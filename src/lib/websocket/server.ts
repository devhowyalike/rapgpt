/**
 * Server-side WebSocket utilities for broadcasting events
 */

import type { WebSocket } from "ws";
import type { WebSocketEvent } from "./types";

export interface BattleRoomStats {
  battleId: string;
  viewerCount: number;
  adminConnected: boolean;
  createdAt: number;
  lastActivityAt: number;
  adminDisconnectedAt: number | null;
}

export interface WebSocketStats {
  totalConnections: number;
  totalRooms: number;
  rooms: BattleRoomStats[];
  serverStartedAt: number;
  config: {
    heartbeatInterval: number;
    roomInactivityTimeout: number;
    adminGracePeriod: number;
    maxRoomLifetime: number;
  };
}

export interface WebSocketServer {
  clients: Set<WebSocket>;
  broadcast: (battleId: string, event: WebSocketEvent) => void;
  getViewerCount: (battleId: string) => number;
  getStats?: () => WebSocketStats;
}

// Use globalThis to ensure the WebSocket server reference is truly global
// across all module instances (including separately bundled Next.js API routes)
declare global {
  // eslint-disable-next-line no-var
  var __rapgpt_wsServer: WebSocketServer | null | undefined;
}

function getWsServer(): WebSocketServer | null {
  return globalThis.__rapgpt_wsServer ?? null;
}

export function setWebSocketServer(server: WebSocketServer) {
  globalThis.__rapgpt_wsServer = server;
}

export function getWebSocketServer(): WebSocketServer | null {
  return getWsServer();
}

export function broadcast(battleId: string, event: WebSocketEvent) {
  const wsServer = getWsServer();
  if (!wsServer) {
    console.warn(
      "WebSocket server not initialized. Event not broadcasted:",
      event.type,
    );
    return;
  }
  wsServer.broadcast(battleId, event);
}

export function getViewerCount(battleId: string): number {
  const wsServer = getWsServer();
  if (!wsServer) {
    return 0;
  }
  return wsServer.getViewerCount(battleId);
}

/**
 * Get WebSocket server statistics
 */
export function getWebSocketStats(): WebSocketStats | null {
  const wsServer = getWsServer();
  if (!wsServer?.getStats) {
    return null;
  }
  return wsServer.getStats();
}

/**
 * Helper to check if WebSocket server is available
 */
export function isWebSocketAvailable(): boolean {
  return getWsServer() !== null;
}
