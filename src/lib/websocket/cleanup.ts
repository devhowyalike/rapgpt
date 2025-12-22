/**
 * WebSocket room cleanup utilities
 * 
 * Handles automatic cleanup of:
 * - Stale live battles on server startup
 * - Orphaned live battles (no WebSocket room but isLive=true in DB)
 * - Room timeouts (inactivity, admin disconnect, max lifetime)
 */

import { eq } from "drizzle-orm";
import type { WebSocket } from "ws";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";
import type { BattleEndingReason, WebSocketEvent } from "./types";

export interface BattleRoomMetadata {
  createdAt: number;
  lastActivityAt: number;
  adminClientId: string | null;
  adminDisconnectedAt: number | null;
  warningBroadcastedAt: number | null;
}

export interface ClientConnection {
  ws: WebSocket;
  battleId: string;
  clientId: string;
  isAdmin: boolean;
  isAlive: boolean;
}

export interface CleanupContext {
  battleRooms: Map<string, Set<ClientConnection>>;
  battleRoomMetadata: Map<string, BattleRoomMetadata>;
  broadcast: (battleId: string, event: WebSocketEvent) => void;
  config: {
    roomInactivityTimeout: number;
    adminGracePeriod: number;
    maxRoomLifetime: number;
    warningBeforeClose: number;
  };
}

/**
 * Reset all live battles in database (used on server startup/shutdown)
 */
export async function cleanupStaleLiveBattles(): Promise<void> {
  try {
    await db
      .update(battles)
      .set({ isLive: false, liveStartedAt: null })
      .where(eq(battles.isLive, true));
    console.log("[Cleanup] Reset stale live battles in database");
  } catch (error) {
    console.error("[Cleanup] Error resetting stale live battles:", error);
  }
}

/**
 * Broadcast warning before closing a battle
 */
function broadcastWarningBeforeClose(
  ctx: CleanupContext,
  battleId: string,
  reason: BattleEndingReason,
  secondsRemaining: number,
): void {
  const metadata = ctx.battleRoomMetadata.get(battleId);
  if (metadata) {
    metadata.warningBroadcastedAt = Date.now();
  }

  ctx.broadcast(battleId, {
    type: "battle:ending_soon",
    battleId,
    timestamp: Date.now(),
    reason,
    secondsRemaining,
  });

  console.log(
    `[Cleanup] Warning broadcasted to battle ${battleId}: ending in ${secondsRemaining}s due to ${reason}`,
  );
}

/**
 * End a live battle and clean up the room
 */
async function endLiveBattleAndCleanup(
  ctx: CleanupContext,
  battleId: string,
  reason: BattleEndingReason,
): Promise<void> {
  // Skip special rooms like __homepage__
  if (battleId.startsWith("__")) {
    return;
  }

  console.log(`[Cleanup] Ending live battle ${battleId} due to ${reason}`);

  // Update database to mark battle as no longer live
  try {
    await db
      .update(battles)
      .set({ isLive: false, liveStartedAt: null })
      .where(eq(battles.id, battleId));
    console.log(`[Cleanup] Updated database for battle ${battleId}`);
  } catch (error) {
    console.error(`[Cleanup] Error updating database for ${battleId}:`, error);
  }

  // Broadcast battle:live_ended event to notify clients
  const room = ctx.battleRooms.get(battleId);
  if (room) {
    // Send minimal battle object; clients should refetch full data
    const message = JSON.stringify({
      type: "battle:live_ended",
      battleId,
      timestamp: Date.now(),
      battle: { id: battleId },
    });

    room.forEach((client) => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(message);
      }
    });

    // Also notify homepage
    broadcastToHomepage(ctx, battleId);
  }

  // Clean up room metadata (keep the room itself for viewers who want to stay)
  const metadata = ctx.battleRoomMetadata.get(battleId);
  if (metadata) {
    metadata.adminClientId = null;
    metadata.adminDisconnectedAt = null;
    metadata.warningBroadcastedAt = null;
    metadata.lastActivityAt = Date.now();
  }
}

/**
 * Broadcast battle:live_ended to homepage room
 */
function broadcastToHomepage(ctx: CleanupContext, battleId: string): void {
  const homepageRoom = ctx.battleRooms.get("__homepage__");
  if (homepageRoom) {
    const message = JSON.stringify({
      type: "battle:live_ended",
      battleId,
      timestamp: Date.now(),
      battle: { id: battleId },
    });
    homepageRoom.forEach((client) => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(message);
      }
    });
  }
}

/**
 * Check rooms for inactivity, admin timeouts, and max lifetime
 */
export function checkRoomTimeouts(ctx: CleanupContext): void {
  const now = Date.now();
  const { roomInactivityTimeout, adminGracePeriod, maxRoomLifetime, warningBeforeClose } = ctx.config;

  ctx.battleRoomMetadata.forEach((metadata, battleId) => {
    // Skip special rooms
    if (battleId.startsWith("__")) return;

    const timeSinceActivity = now - metadata.lastActivityAt;
    const timeSinceCreation = now - metadata.createdAt;

    // Check for max room lifetime
    if (maxRoomLifetime > 0 && timeSinceCreation > maxRoomLifetime) {
      if (!metadata.warningBroadcastedAt) {
        broadcastWarningBeforeClose(ctx, battleId, "max_lifetime", warningBeforeClose / 1000);
      } else if (now - metadata.warningBroadcastedAt > warningBeforeClose) {
        endLiveBattleAndCleanup(ctx, battleId, "max_lifetime");
      }
      return;
    }

    // Check for admin disconnect grace period
    if (metadata.adminDisconnectedAt) {
      const timeSinceAdminLeft = now - metadata.adminDisconnectedAt;

      if (timeSinceAdminLeft > adminGracePeriod) {
        if (!metadata.warningBroadcastedAt) {
          broadcastWarningBeforeClose(ctx, battleId, "admin_timeout", warningBeforeClose / 1000);
        } else if (now - metadata.warningBroadcastedAt > warningBeforeClose) {
          endLiveBattleAndCleanup(ctx, battleId, "admin_timeout");
        }
        return;
      }
    }

    // Check for room inactivity
    if (timeSinceActivity > roomInactivityTimeout) {
      if (!metadata.warningBroadcastedAt) {
        broadcastWarningBeforeClose(ctx, battleId, "inactivity", warningBeforeClose / 1000);
      } else if (now - metadata.warningBroadcastedAt > warningBeforeClose) {
        endLiveBattleAndCleanup(ctx, battleId, "inactivity");
      }
    }
  });
}

/**
 * Check for orphaned live battles in the database that have no WebSocket room.
 * This catches the edge case where the admin was the only viewer and disconnected,
 * causing the room to be deleted but the battle to remain isLive=true in the DB.
 */
export async function cleanupOrphanedLiveBattles(ctx: CleanupContext): Promise<void> {
  try {
    // Query all live battles from the database
    const liveBattles = await db.query.battles.findMany({
      where: eq(battles.isLive, true),
      columns: {
        id: true,
        liveStartedAt: true,
      },
    });

    if (liveBattles.length === 0) return;

    const now = Date.now();

    for (const battle of liveBattles) {
      // Skip if there's an active WebSocket room for this battle
      if (ctx.battleRooms.has(battle.id)) continue;

      // Check if past the grace period since going live
      const liveStartedAt = battle.liveStartedAt
        ? new Date(battle.liveStartedAt).getTime()
        : now;
      const timeSinceLive = now - liveStartedAt;

      // Use admin grace period as the timeout for orphaned battles
      if (timeSinceLive > ctx.config.adminGracePeriod) {
        console.log(
          `[Cleanup] Found orphaned live battle ${battle.id} with no WebSocket room. Cleaning up...`,
        );

        // Mark as not live in database
        await db
          .update(battles)
          .set({ isLive: false, liveStartedAt: null })
          .where(eq(battles.id, battle.id));

        // Broadcast to homepage so UI updates
        broadcastToHomepage(ctx, battle.id);

        console.log(`[Cleanup] Orphaned battle ${battle.id} cleaned up`);
      }
    }
  } catch (error) {
    console.error("[Cleanup] Error cleaning up orphaned live battles:", error);
  }
}

