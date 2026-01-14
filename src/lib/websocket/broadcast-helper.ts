/**
 * Helper to broadcast WebSocket events from API routes
 * In dev mode, API routes run in a separate process, so we need to use HTTP
 */

import { broadcast as directBroadcast, isWebSocketAvailable } from "./server";
import type { WebSocketEvent } from "./types";

const PORT = process.env.PORT || "3000";
const BROADCAST_URL =
  process.env.BROADCAST_INTERNAL_URL ||
  `http://127.0.0.1:${PORT}/__internal/ws-broadcast`;

// SECURITY: Get broadcast secret from environment
// In production, this must be set. In development, we allow a fallback but warn.
const BROADCAST_SECRET = process.env.INTERNAL_BROADCAST_SECRET;
if (!BROADCAST_SECRET && process.env.NODE_ENV === "production") {
  console.error("[Broadcast Helper] INTERNAL_BROADCAST_SECRET not set in production!");
}

/**
 * Broadcast a WebSocket event to all clients in a battle room
 * This works in both dev and production
 */
export async function broadcastEvent(
  battleId: string,
  event: WebSocketEvent,
): Promise<void> {
  try {
    // Try direct broadcast first (works in production)
    if (isWebSocketAvailable()) {
      console.log("[Broadcast Helper] Using direct broadcast for:", event.type);
      directBroadcast(battleId, event);
      return;
    }

    // Fallback to HTTP in dev mode
    console.log(
      "[Broadcast Helper] Using HTTP broadcast for:",
      event.type,
      "to battle:",
      battleId,
    );
    const response = await fetch(BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Internal secret to prevent external access
        "X-Internal-Secret": BROADCAST_SECRET || "dev-secret-insecure",
      },
      body: JSON.stringify({ battleId, event }),
    });

    if (!response.ok) {
      console.error(
        "[Broadcast Helper] HTTP broadcast failed:",
        response.status,
        await response.text(),
      );
    } else {
      console.log(
        "[Broadcast Helper] HTTP broadcast successful for:",
        event.type,
      );
    }
  } catch (error) {
    console.error("[Broadcast Helper] Failed to broadcast:", error);
  }
}
