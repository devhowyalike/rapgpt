/**
 * Server-side WebSocket utilities for broadcasting events
 */

import type { WebSocket } from "ws";
import type { WebSocketEvent } from "./types";

// Global WebSocket server instance (will be set by the custom server)
let wsServer: WebSocketServer | null = null;

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

export function setWebSocketServer(server: WebSocketServer) {
  wsServer = server;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}

export function broadcast(battleId: string, event: WebSocketEvent) {
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
  if (!wsServer) {
    return 0;
  }
  return wsServer.getViewerCount(battleId);
}

/**
 * Get WebSocket server statistics
 */
export function getWebSocketStats(): WebSocketStats | null {
  if (!wsServer?.getStats) {
    return null;
  }
  return wsServer.getStats();
}

/**
 * Helper to check if WebSocket server is available
 */
export function isWebSocketAvailable(): boolean {
  return wsServer !== null;
}
