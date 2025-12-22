/**
 * Custom Next.js server with WebSocket support
 */

import { eq } from "drizzle-orm";
import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { WebSocket, WebSocketServer } from "ws";
import { db } from "./src/lib/db/client";
import { battles } from "./src/lib/db/schema";
import { setWebSocketServer } from "./src/lib/websocket/server";
import type {
  BattleEndingReason,
  ClientMessage,
  WebSocketEvent,
} from "./src/lib/websocket/types";

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

interface ClientConnection {
  ws: WebSocket;
  battleId: string;
  clientId: string;
  isAdmin: boolean;
  isAlive: boolean;
}

interface BattleRoomMetadata {
  createdAt: number;
  lastActivityAt: number;
  adminClientId: string | null;
  adminDisconnectedAt: number | null;
  warningBroadcastedAt: number | null; // Track if we've sent a warning
}

// Battle rooms: Map<battleId, Set<ClientConnection>>
const battleRooms = new Map<string, Set<ClientConnection>>();

// Battle room metadata: Map<battleId, BattleRoomMetadata>
const battleRoomMetadata = new Map<string, BattleRoomMetadata>();

// Client tracking: Map<WebSocket, ClientConnection>
const clients = new Map<WebSocket, ClientConnection>();

// Track if shutdown is in progress
let isShuttingDown = false;

function joinBattleRoom(battleId: string, client: ClientConnection) {
  const now = Date.now();

  if (!battleRooms.has(battleId)) {
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

  battleRooms.get(battleId)?.add(client);

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
 * Reset stale live battles in database on server startup
 */
async function cleanupStaleLiveBattles() {
  try {
    const result = await db
      .update(battles)
      .set({ isLive: false, liveStartedAt: null })
      .where(eq(battles.isLive, true));
    console.log("[Startup] Reset stale live battles in database");
    return result;
  } catch (error) {
    console.error("[Startup] Error resetting stale live battles:", error);
  }
}

/**
 * Broadcast warning before closing a battle
 */
function broadcastWarningBeforeClose(
  battleId: string,
  reason: BattleEndingReason,
  secondsRemaining: number,
) {
  const metadata = battleRoomMetadata.get(battleId);
  if (metadata) {
    metadata.warningBroadcastedAt = Date.now();
  }

  broadcast(battleId, {
    type: "battle:ending_soon",
    battleId,
    timestamp: Date.now(),
    reason,
    secondsRemaining,
  });

  console.log(
    `[WS Cleanup] Warning broadcasted to battle ${battleId}: ending in ${secondsRemaining}s due to ${reason}`,
  );
}

/**
 * End a live battle and clean up the room
 */
async function endLiveBattleAndCleanup(
  battleId: string,
  reason: BattleEndingReason,
) {
  // Skip special rooms like __homepage__
  if (battleId.startsWith("__")) {
    return;
  }

  console.log(`[WS Cleanup] Ending live battle ${battleId} due to ${reason}`);

  // Update database to mark battle as no longer live
  try {
    await db
      .update(battles)
      .set({ isLive: false, liveStartedAt: null })
      .where(eq(battles.id, battleId));
    console.log(`[WS Cleanup] Updated database for battle ${battleId}`);
  } catch (error) {
    console.error(`[WS Cleanup] Error updating database for ${battleId}:`, error);
  }

  // Broadcast battle:live_ended event to notify clients
  const room = battleRooms.get(battleId);
  if (room) {
    const message = JSON.stringify({
      type: "battle:live_ended",
      battleId,
      timestamp: Date.now(),
      battle: { id: battleId }, // Minimal battle object; clients should refetch
    });

    room.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });

    // Also notify homepage
    const homepageRoom = battleRooms.get("__homepage__");
    if (homepageRoom) {
      homepageRoom.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      });
    }
  }

  // Clean up room metadata (keep the room itself for viewers who want to stay)
  const metadata = battleRoomMetadata.get(battleId);
  if (metadata) {
    metadata.adminClientId = null;
    metadata.adminDisconnectedAt = null;
    metadata.warningBroadcastedAt = null;
    // Reset activity timestamp so inactivity checks continue fresh
    metadata.lastActivityAt = Date.now();
  }
}

/**
 * Check rooms for inactivity, admin timeouts, and max lifetime
 */
function checkRoomTimeouts() {
  const now = Date.now();

  battleRoomMetadata.forEach((metadata, battleId) => {
    // Skip special rooms
    if (battleId.startsWith("__")) return;

    const timeSinceActivity = now - metadata.lastActivityAt;
    const timeSinceCreation = now - metadata.createdAt;
    const warningThreshold = WS_WARNING_BEFORE_CLOSE;

    // Check for max room lifetime
    if (WS_MAX_ROOM_LIFETIME > 0 && timeSinceCreation > WS_MAX_ROOM_LIFETIME) {
      if (!metadata.warningBroadcastedAt) {
        broadcastWarningBeforeClose(battleId, "max_lifetime", warningThreshold / 1000);
      } else if (now - metadata.warningBroadcastedAt > warningThreshold) {
        endLiveBattleAndCleanup(battleId, "max_lifetime");
      }
      return;
    }

    // Check for admin disconnect grace period
    if (metadata.adminDisconnectedAt) {
      const timeSinceAdminLeft = now - metadata.adminDisconnectedAt;

      if (timeSinceAdminLeft > WS_ADMIN_GRACE_PERIOD) {
        if (!metadata.warningBroadcastedAt) {
          broadcastWarningBeforeClose(battleId, "admin_timeout", warningThreshold / 1000);
        } else if (now - metadata.warningBroadcastedAt > warningThreshold) {
          endLiveBattleAndCleanup(battleId, "admin_timeout");
        }
        return;
      }
    }

    // Check for room inactivity
    if (timeSinceActivity > WS_ROOM_INACTIVITY_TIMEOUT) {
      if (!metadata.warningBroadcastedAt) {
        broadcastWarningBeforeClose(battleId, "inactivity", warningThreshold / 1000);
      } else if (now - metadata.warningBroadcastedAt > warningThreshold) {
        endLiveBattleAndCleanup(battleId, "inactivity");
      }
    }
  });
}

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
      message: "Server is shutting down. Please reconnect shortly.",
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

  // Room cleanup interval - check every minute for timeouts
  const roomCleanupInterval = setInterval(() => {
    checkRoomTimeouts();
  }, 60000);

  wss.on("close", () => {
    clearInterval(pingInterval);
    clearInterval(roomCleanupInterval);
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
  });
});
