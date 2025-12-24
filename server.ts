/**
 * Custom Next.js server with WebSocket support
 */

import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { WebSocket, WebSocketServer } from "ws";
import { setWebSocketServer } from "./src/lib/websocket/server";
import {
  cleanupStaleLiveBattles,
  initializeCleanup,
  startCleanupIntervalIfNeeded,
  stopCleanupIntervalIfEmpty,
  stopCleanupInterval,
  type BattleRoomMetadata,
  type ClientConnection,
} from "./src/lib/websocket/cleanup";
import type { ClientMessage, WebSocketEvent } from "./src/lib/websocket/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Timeout configuration (configurable via environment variables)
const WS_ROOM_INACTIVITY_TIMEOUT = parseInt(
  process.env.WS_ROOM_INACTIVITY_TIMEOUT || "1800000",
  10,
); // 30 min default
const WS_ADMIN_GRACE_PERIOD = parseInt(
  process.env.WS_ADMIN_GRACE_PERIOD || "300000",
  10,
); // 5 min default
const WS_HEARTBEAT_INTERVAL = parseInt(
  process.env.WS_HEARTBEAT_INTERVAL || "30000",
  10,
); // 30 sec default
const WS_MAX_ROOM_LIFETIME = parseInt(
  process.env.WS_MAX_ROOM_LIFETIME || "7200000",
  10,
); // 2 hours default (0 = disabled)
const WS_WARNING_BEFORE_CLOSE = 60000; // 1 minute warning before auto-close

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const INTERNAL_BROADCAST_SECRET =
  process.env.INTERNAL_BROADCAST_SECRET || "dev-secret";

// Types imported from ./src/lib/websocket/cleanup

// Battle rooms: Map<battleId, Set<ClientConnection>>
const battleRooms = new Map<string, Set<ClientConnection>>();

// Battle room metadata: Map<battleId, BattleRoomMetadata>
const battleRoomMetadata = new Map<string, BattleRoomMetadata>();

// Client tracking: Map<WebSocket, ClientConnection>
const clients = new Map<WebSocket, ClientConnection>();

// Track if shutdown is in progress
let isShuttingDown = false;

// Track server start time for stats
const serverStartedAt = Date.now();

function joinBattleRoom(battleId: string, client: ClientConnection) {
  const now = Date.now();
  const isNewRoom = !battleRooms.has(battleId);

  if (isNewRoom) {
    battleRooms.set(battleId, new Set());
    // Initialize metadata for new room
    battleRoomMetadata.set(battleId, {
      createdAt: now,
      lastActivityAt: now,
      adminClientId: null,
      adminDisconnectedAt: null,
      warningBroadcastedAt: null,
    });
  }

  const room = battleRooms.get(battleId);
  if (room) {
    // Deduplicate: Remove any existing connection with the same clientId
    // This handles reconnections and prevents double-counting
    const existingClient = Array.from(room).find(c => c.clientId === client.clientId);
    if (existingClient) {
      room.delete(existingClient);
      console.log(
        `[WS] Removed stale connection for client ${client.clientId} in battle ${battleId}`,
      );
    }
    room.add(client);
  }

  // Update metadata
  const metadata = battleRoomMetadata.get(battleId);
  if (metadata) {
    metadata.lastActivityAt = now;

    // Track admin connection and clear any grace period
    if (client.isAdmin) {
      metadata.adminClientId = client.clientId;
      metadata.adminDisconnectedAt = null; // Admin reconnected, clear timeout
      metadata.warningBroadcastedAt = null; // Clear any pending warning
    }
  }

  console.log(
    `[WS] Client ${client.clientId} joined battle ${battleId}. Room size: ${battleRooms.get(battleId)?.size}`,
  );
  
  // Start cleanup interval when first battle room is created
  if (isNewRoom && !battleId.startsWith("__")) {
    startCleanupIntervalIfNeeded();
  }
}

function leaveBattleRoom(battleId: string, client: ClientConnection) {
  const room = battleRooms.get(battleId);
  if (room) {
    room.delete(client);
    console.log(
      `[WS] Client ${client.clientId} left battle ${battleId}. Room size: ${room.size}`,
    );

    // Track admin disconnection for grace period
    const metadata = battleRoomMetadata.get(battleId);
    if (metadata && client.isAdmin && metadata.adminClientId === client.clientId) {
      metadata.adminDisconnectedAt = Date.now();
      console.log(
        `[WS] Admin ${client.clientId} disconnected from battle ${battleId}. Grace period started.`,
      );
    }

    if (room.size === 0) {
      battleRooms.delete(battleId);
      battleRoomMetadata.delete(battleId);
      console.log(`[WS] Room ${battleId} is empty, removed (including metadata)`);
      
      // Stop cleanup interval if no active battle rooms remain
      if (!battleId.startsWith("__")) {
        stopCleanupIntervalIfEmpty();
      }
    }
  }
}

function broadcast(
  battleId: string,
  event: WebSocketEvent,
  excludeClient?: WebSocket,
) {
  const room = battleRooms.get(battleId);
  if (!room) {
    console.warn(`[WS] No room found for battle ${battleId}`);
    return;
  }

  // Update room activity timestamp (except for internal events)
  const metadata = battleRoomMetadata.get(battleId);
  if (metadata && !event.type.startsWith("server:") && event.type !== "battle:ending_soon") {
    metadata.lastActivityAt = Date.now();
  }

  const message = JSON.stringify(event);
  let sentCount = 0;

  room.forEach((client) => {
    if (
      client.ws !== excludeClient &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(message);
      sentCount++;
    }
  });

  console.log(
    `[WS] Broadcasted ${event.type} to ${sentCount} clients in battle ${battleId}`,
  );

  // Also broadcast to homepage room for live status changes
  if (
    battleId !== "__homepage__" &&
    (event.type === "battle:live_started" || event.type === "battle:live_ended")
  ) {
    const homepageRoom = battleRooms.get("__homepage__");
    if (homepageRoom) {
      let homepageSentCount = 0;
      homepageRoom.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
          homepageSentCount++;
        }
      });
      console.log(
        `[WS] Broadcasted ${event.type} to ${homepageSentCount} homepage clients`,
      );
    }
  }

  // Send lightweight progress update to homepage when verse completes
  if (battleId !== "__homepage__" && event.type === "verse:complete") {
    const homepageRoom = battleRooms.get("__homepage__");
    if (homepageRoom && homepageRoom.size > 0) {
      const progressEvent = JSON.stringify({
        type: "homepage:battle_progress",
        battleId,
        timestamp: Date.now(),
        currentRound: (event as { round: number }).round,
      });
      let homepageSentCount = 0;
      homepageRoom.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(progressEvent);
          homepageSentCount++;
        }
      });
      console.log(
        `[WS] Broadcasted homepage:battle_progress (verse) to ${homepageSentCount} homepage clients`,
      );
    }
  }

  // Send lightweight progress update to homepage when comment is added
  if (battleId !== "__homepage__" && event.type === "comment:added") {
    const homepageRoom = battleRooms.get("__homepage__");
    if (homepageRoom && homepageRoom.size > 0) {
      const commentEvent = event as { comment: { round?: number } };
      const progressEvent = JSON.stringify({
        type: "homepage:battle_progress",
        battleId,
        timestamp: Date.now(),
        currentRound: commentEvent.comment.round || 0,
        commentCount: 1, // Increment by 1
      });
      let homepageSentCount = 0;
      homepageRoom.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(progressEvent);
          homepageSentCount++;
        }
      });
      console.log(
        `[WS] Broadcasted homepage:battle_progress (comment) to ${homepageSentCount} homepage clients`,
      );
    }
  }
}

function getViewerCount(battleId: string): number {
  const room = battleRooms.get(battleId);
  if (!room) return 0;

  // Count only non-admin clients
  return Array.from(room).filter((c) => !c.isAdmin).length;
}

function broadcastViewerCount(battleId: string) {
  // If room doesn't exist (e.g. last user left), nothing to broadcast to
  if (!battleRooms.has(battleId)) return;

  const count = getViewerCount(battleId);
  broadcast(battleId, {
    type: "viewers:count",
    battleId,
    timestamp: Date.now(),
    count,
  });
}

/**
 * Get WebSocket server statistics for admin dashboard
 */
function getStats() {
  const rooms: Array<{
    battleId: string;
    viewerCount: number;
    adminConnected: boolean;
    createdAt: number;
    lastActivityAt: number;
    adminDisconnectedAt: number | null;
  }> = [];

  battleRoomMetadata.forEach((metadata, battleId) => {
    const room = battleRooms.get(battleId);
    const viewerCount = room
      ? Array.from(room).filter((c) => !c.isAdmin).length
      : 0;
    const adminConnected = room
      ? Array.from(room).some((c) => c.isAdmin)
      : false;

    rooms.push({
      battleId,
      viewerCount,
      adminConnected,
      createdAt: metadata.createdAt,
      lastActivityAt: metadata.lastActivityAt,
      adminDisconnectedAt: metadata.adminDisconnectedAt,
    });
  });

  return {
    totalConnections: clients.size,
    totalRooms: battleRooms.size,
    rooms,
    serverStartedAt,
    config: {
      heartbeatInterval: WS_HEARTBEAT_INTERVAL,
      roomInactivityTimeout: WS_ROOM_INACTIVITY_TIMEOUT,
      adminGracePeriod: WS_ADMIN_GRACE_PERIOD,
      maxRoomLifetime: WS_MAX_ROOM_LIFETIME,
    },
  };
}

// Cleanup functions imported from ./src/lib/websocket/cleanup

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);

  // Broadcast shutdown warning to all rooms
  battleRooms.forEach((_, battleId) => {
    broadcast(battleId, {
      type: "server:shutdown",
      battleId,
      timestamp: Date.now(),
      message: "Attempting to reconnect...",
    });
  });

  // End all live battles in database
  await cleanupStaleLiveBattles();

  console.log("[Server] Graceful shutdown complete");
  process.exit(0);
}

app.prepare().then(async () => {
  // Cleanup stale live battles from previous server runs
  await cleanupStaleLiveBattles();
  const server = createServer(async (req, res) => {
    // Only log non-internal Next.js requests
    const url = req.url || "";
    const isInternalNextRequest =
      url.startsWith("/__nextjs") ||
      url.startsWith("/_next/") ||
      url.includes("hot-update");

    if (!isInternalNextRequest) {
      console.log(`[Server] Request: ${req.method} ${url}`);
    }

    // Internal endpoint for broadcasting WebSocket events from API routes
    // Must be handled BEFORE Next.js to prevent 404
    if (url.startsWith("/__internal/ws-broadcast") && req.method === "POST") {
      console.log("[Server] Matched internal broadcast endpoint");
      // Verify internal secret
      const secret = req.headers["x-internal-secret"];
      if (secret !== INTERNAL_BROADCAST_SECRET) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const { battleId, event } = JSON.parse(body);
          console.log(
            `[Internal Broadcast] Received request for battle ${battleId}, event ${event.type}`,
          );
          broadcast(battleId, event);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error("[Internal Broadcast] Error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal error" }));
        }
      });
      return;
    }

    // Internal endpoint for fetching WebSocket stats from API routes
    if (url.startsWith("/__internal/ws-stats") && req.method === "GET") {
      // Verify internal secret
      const secret = req.headers["x-internal-secret"];
      if (secret !== INTERNAL_BROADCAST_SECRET) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden" }));
        return;
      }

      try {
        const stats = getStats();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(stats));
      } catch (error) {
        console.error("[Internal Stats] Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal error" }));
      }
      return;
    }

    // Pass everything else to Next.js
    const parsedUrl = parse(req.url || "", true);
    await handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    noServer: true,
    path: "/ws",
  });

  // Set up WebSocket server for broadcasting from API routes
  setWebSocketServer({
    clients: new Set(),
    broadcast,
    getViewerCount,
    getStats,
  });

  // Handle WebSocket upgrade
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url || "", true);

    if (pathname === "/ws") {
      // Handle our custom WebSocket endpoint
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // Let Next.js handle its own WebSocket upgrades (HMR, etc.)
    // by NOT destroying the socket for other paths
  });

  // Handle WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] New connection established");

    const connection: ClientConnection = {
      ws,
      battleId: "",
      clientId: "",
      isAdmin: false,
      isAlive: true,
    };

    clients.set(ws, connection);

    // Handle incoming messages
    ws.on("message", (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());

        switch (message.type) {
          case "join": {
            // Leave previous room if any
            if (connection.battleId) {
              const oldBattleId = connection.battleId;
              leaveBattleRoom(oldBattleId, connection);
              broadcastViewerCount(oldBattleId);
            }

            // Join new room
            connection.battleId = message.battleId;
            connection.clientId = message.clientId || `client-${Date.now()}`;
            connection.isAdmin = message.isAdmin || false;

            joinBattleRoom(message.battleId, connection);

            // Send acknowledgment with current state
            ws.send(
              JSON.stringify({
                type: "connection:acknowledged",
                battleId: message.battleId,
                clientId: connection.clientId,
                timestamp: Date.now(),
                viewerCount: getViewerCount(message.battleId),
              } as WebSocketEvent),
            );

            // Broadcast viewer count update
            broadcastViewerCount(message.battleId);

            // Notify if admin joined
            if (connection.isAdmin) {
              broadcast(message.battleId, {
                type: "admin:connected",
                battleId: message.battleId,
                adminId: connection.clientId,
                timestamp: Date.now(),
              });
            }
            break;
          }

          case "leave": {
            if (connection.battleId) {
              leaveBattleRoom(connection.battleId, connection);
              broadcastViewerCount(connection.battleId);
            }
            break;
          }

          case "sync_request": {
            // Client is requesting state sync - handled by Next.js API route
            // Send a minimal acknowledgment here
            ws.send(
              JSON.stringify({
                type: "connection:acknowledged",
                battleId: message.battleId,
                clientId: connection.clientId,
                timestamp: Date.now(),
                viewerCount: getViewerCount(message.battleId),
              } as WebSocketEvent),
            );
            break;
          }
        }
      } catch (error) {
        console.error("[WS] Error parsing message:", error);
      }
    });

    // Handle connection close
    ws.on("close", () => {
      if (connection.battleId) {
        leaveBattleRoom(connection.battleId, connection);
        broadcastViewerCount(connection.battleId);

        // Notify if admin disconnected
        if (connection.isAdmin && battleRooms.has(connection.battleId)) {
          broadcast(connection.battleId, {
            type: "admin:disconnected",
            battleId: connection.battleId,
            adminId: connection.clientId,
            timestamp: Date.now(),
          });
        }
      }

      clients.delete(ws);
      console.log("[WS] Connection closed");
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[WS] Connection error:", error);
    });

    // Heartbeat to detect broken connections
    connection.isAlive = true;
    ws.on("pong", () => {
      connection.isAlive = true;
    });
  });

  // Ping clients to keep connections alive (configurable interval)
  const pingInterval = setInterval(() => {
    clients.forEach((connection, ws) => {
      if (!connection.isAlive) {
        console.log(
          `[WS] Terminating dead connection for client ${connection.clientId}`,
        );
        ws.terminate();
        return;
      }

      connection.isAlive = false;
      ws.ping();
    });
  }, WS_HEARTBEAT_INTERVAL);

  // Initialize cleanup module (on-demand - interval starts when battles are active)
  initializeCleanup({
    battleRooms,
    battleRoomMetadata,
    broadcast,
    config: {
      roomInactivityTimeout: WS_ROOM_INACTIVITY_TIMEOUT,
      adminGracePeriod: WS_ADMIN_GRACE_PERIOD,
      maxRoomLifetime: WS_MAX_ROOM_LIFETIME,
      warningBeforeClose: WS_WARNING_BEFORE_CLOSE,
    },
  });

  wss.on("close", () => {
    clearInterval(pingInterval);
    stopCleanupInterval();
  });

  // Register shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
    console.log(`> WebSocket cleanup config:`);
    console.log(`>   - Heartbeat interval: ${WS_HEARTBEAT_INTERVAL / 1000}s`);
    console.log(`>   - Room inactivity timeout: ${WS_ROOM_INACTIVITY_TIMEOUT / 60000}min`);
    console.log(`>   - Admin grace period: ${WS_ADMIN_GRACE_PERIOD / 60000}min`);
    console.log(`>   - Max room lifetime: ${WS_MAX_ROOM_LIFETIME > 0 ? `${WS_MAX_ROOM_LIFETIME / 3600000}h` : "disabled"}`);
    console.log(`>   - Room cleanup: on-demand (only runs when battles are active)`);
  });
});
