/**
 * Shared WebSocket utilities
 */

/**
 * Generate a stable client ID with a given prefix
 * @param prefix - Prefix for the client ID (e.g., "admin", "viewer", "homepage")
 */
export function generateClientId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Check if a WebSocket connection is currently active (connecting or open)
 * Useful to prevent duplicate connection attempts
 */
export function isWebSocketActive(ws: WebSocket | null): boolean {
  if (!ws) return false;
  return ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN;
}

/**
 * Check if a WebSocket is connected and ready to send messages
 */
export function isWebSocketConnected(ws: WebSocket | null): boolean {
  return ws?.readyState === WebSocket.OPEN;
}

