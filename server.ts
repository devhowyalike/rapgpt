/**
 * Custom Next.js server with WebSocket support
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import type { WebSocketEvent, ClientMessage } from './src/lib/websocket/types';
import { setWebSocketServer } from './src/lib/websocket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const INTERNAL_BROADCAST_SECRET = process.env.INTERNAL_BROADCAST_SECRET || 'dev-secret';

interface ClientConnection {
  ws: WebSocket;
  battleId: string;
  clientId: string;
  isAdmin: boolean;
  isAlive: boolean;
}

// Battle rooms: Map<battleId, Set<ClientConnection>>
const battleRooms = new Map<string, Set<ClientConnection>>();

// Client tracking: Map<WebSocket, ClientConnection>
const clients = new Map<WebSocket, ClientConnection>();

function joinBattleRoom(battleId: string, client: ClientConnection) {
  if (!battleRooms.has(battleId)) {
    battleRooms.set(battleId, new Set());
  }
  battleRooms.get(battleId)?.add(client);
  console.log(`[WS] Client ${client.clientId} joined battle ${battleId}. Room size: ${battleRooms.get(battleId)?.size}`);
}

function leaveBattleRoom(battleId: string, client: ClientConnection) {
  const room = battleRooms.get(battleId);
  if (room) {
    room.delete(client);
    console.log(`[WS] Client ${client.clientId} left battle ${battleId}. Room size: ${room.size}`);
    
    if (room.size === 0) {
      battleRooms.delete(battleId);
      console.log(`[WS] Room ${battleId} is empty, removed`);
    }
  }
}

function broadcast(battleId: string, event: WebSocketEvent, excludeClient?: WebSocket) {
  const room = battleRooms.get(battleId);
  if (!room) {
    console.warn(`[WS] No room found for battle ${battleId}`);
    return;
  }

  const message = JSON.stringify(event);
  let sentCount = 0;

  room.forEach((client) => {
    if (client.ws !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sentCount++;
    }
  });

  console.log(`[WS] Broadcasted ${event.type} to ${sentCount} clients in battle ${battleId}`);

  // Also broadcast to homepage room for live status changes
  if (battleId !== '__homepage__' && (event.type === 'battle:live_started' || event.type === 'battle:live_ended')) {
    const homepageRoom = battleRooms.get('__homepage__');
    if (homepageRoom) {
      let homepageSentCount = 0;
      homepageRoom.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
          homepageSentCount++;
        }
      });
      console.log(`[WS] Broadcasted ${event.type} to ${homepageSentCount} homepage clients`);
    }
  }
}

function getViewerCount(battleId: string): number {
  const room = battleRooms.get(battleId);
  if (!room) return 0;
  
  // Count only non-admin clients
  return Array.from(room).filter(c => !c.isAdmin).length;
}

function broadcastViewerCount(battleId: string) {
  const count = getViewerCount(battleId);
  broadcast(battleId, {
    type: 'viewers:count',
    battleId,
    timestamp: Date.now(),
    count,
  });
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    console.log(`[Server] Request: ${req.method} ${req.url}`);
    
    // Internal endpoint for broadcasting WebSocket events from API routes
    // Must be handled BEFORE Next.js to prevent 404
    if (req.url?.startsWith('/__internal/ws-broadcast') && req.method === 'POST') {
      console.log('[Server] Matched internal broadcast endpoint');
      // Verify internal secret
      const secret = req.headers['x-internal-secret'];
      if (secret !== INTERNAL_BROADCAST_SECRET) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const { battleId, event } = JSON.parse(body);
          console.log(`[Internal Broadcast] Received request for battle ${battleId}, event ${event.type}`);
          broadcast(battleId, event);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('[Internal Broadcast] Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal error' }));
        }
      });
      return;
    }
    
    // Pass everything else to Next.js
    const parsedUrl = parse(req.url || '', true);
    await handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ 
    noServer: true,
    path: '/ws',
  });

  // Set up WebSocket server for broadcasting from API routes
  setWebSocketServer({
    clients: new Set(),
    broadcast,
    getViewerCount,
  });

  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] New connection established');

    const connection: ClientConnection = {
      ws,
      battleId: '',
      clientId: '',
      isAdmin: false,
      isAlive: true,
    };

    clients.set(ws, connection);

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join': {
            // Leave previous room if any
            if (connection.battleId) {
              leaveBattleRoom(connection.battleId, connection);
            }

            // Join new room
            connection.battleId = message.battleId;
            connection.clientId = message.clientId || `client-${Date.now()}`;
            connection.isAdmin = message.isAdmin || false;
            
            joinBattleRoom(message.battleId, connection);

            // Send acknowledgment with current state
            ws.send(JSON.stringify({
              type: 'connection:acknowledged',
              battleId: message.battleId,
              clientId: connection.clientId,
              timestamp: Date.now(),
              viewerCount: getViewerCount(message.battleId),
            } as WebSocketEvent));

            // Broadcast viewer count update
            broadcastViewerCount(message.battleId);

            // Notify if admin joined
            if (connection.isAdmin) {
              broadcast(message.battleId, {
                type: 'admin:connected',
                battleId: message.battleId,
                adminId: connection.clientId,
                timestamp: Date.now(),
              });
            }
            break;
          }

          case 'leave': {
            if (connection.battleId) {
              leaveBattleRoom(connection.battleId, connection);
              broadcastViewerCount(connection.battleId);
            }
            break;
          }

          case 'sync_request': {
            // Client is requesting state sync - handled by Next.js API route
            // Send a minimal acknowledgment here
            ws.send(JSON.stringify({
              type: 'connection:acknowledged',
              battleId: message.battleId,
              clientId: connection.clientId,
              timestamp: Date.now(),
              viewerCount: getViewerCount(message.battleId),
            } as WebSocketEvent));
            break;
          }
        }
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      if (connection.battleId) {
        leaveBattleRoom(connection.battleId, connection);
        broadcastViewerCount(connection.battleId);

        // Notify if admin disconnected
        if (connection.isAdmin) {
          broadcast(connection.battleId, {
            type: 'admin:disconnected',
            battleId: connection.battleId,
            adminId: connection.clientId,
            timestamp: Date.now(),
          });
        }
      }
      
      clients.delete(ws);
      console.log('[WS] Connection closed');
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WS] Connection error:', error);
    });

    // Heartbeat to detect broken connections
    connection.isAlive = true;
    ws.on('pong', () => {
      connection.isAlive = true;
    });
  });

  // Ping clients every 30 seconds to keep connections alive
  const pingInterval = setInterval(() => {
    clients.forEach((connection, ws) => {
      if (!connection.isAlive) {
        console.log(`[WS] Terminating dead connection for client ${connection.clientId}`);
        ws.terminate();
        return;
      }

      connection.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
  });
});

