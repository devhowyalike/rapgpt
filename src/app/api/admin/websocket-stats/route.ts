/**
 * Admin API endpoint for WebSocket server statistics
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/roles";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const INTERNAL_BROADCAST_SECRET =
  process.env.INTERNAL_BROADCAST_SECRET || "dev-secret";

/**
 * Fetch WebSocket stats from the custom server via internal endpoint
 */
async function fetchWebSocketStats() {
  try {
    // In development, the custom server runs on the same port
    // In production, this might need adjustment based on deployment
    const baseUrl = process.env.INTERNAL_SERVER_URL || "http://localhost:3000";
    
    const response = await fetch(`${baseUrl}/__internal/ws-stats`, {
      method: "GET",
      headers: {
        "x-internal-secret": INTERNAL_BROADCAST_SECRET,
      },
      // Short timeout since it's internal
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error("[Admin Stats] Failed to fetch WS stats:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Admin Stats] Error fetching WS stats:", error);
    return null;
  }
}

export async function GET() {
  try {
    // Verify admin access
    const isAdmin = await checkRole("admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get WebSocket stats from the custom server
    const wsStats = await fetchWebSocketStats();

    // Get battle IDs from active rooms (excluding special rooms like __homepage__)
    const activeRoomIds = wsStats?.rooms
      ?.filter((r: { battleId: string }) => !r.battleId.startsWith("__"))
      .map((r: { battleId: string }) => r.battleId) ?? [];

    // Fetch battle info for all active rooms (not just live ones)
    let activeBattles: typeof battles.$inferSelect[] = [];
    if (activeRoomIds.length > 0) {
      activeBattles = await db.query.battles.findMany({
        where: (battles, { inArray }) => inArray(battles.id, activeRoomIds),
      });
    }

    // Get live battles from database
    const liveBattles = await db.query.battles.findMany({
      where: eq(battles.isLive, true),
    });

    // Get recent battles for context
    const recentBattles = await db.query.battles.findMany({
      where: eq(battles.status, "completed"),
      orderBy: (battles, { desc }) => [desc(battles.updatedAt)],
      limit: 10,
    });

    // Create a map of battle info by ID for easy lookup
    const battleInfoMap = new Map(
      [...activeBattles, ...liveBattles].map((b) => [
        b.id,
        {
          id: b.id,
          title: b.title,
          isLive: b.isLive,
          liveStartedAt: b.liveStartedAt,
          currentRound: b.currentRound,
          status: b.status,
          player1: b.player1Persona.name,
          player2: b.player2Persona.name,
        },
      ])
    );

    return NextResponse.json({
      websocket: wsStats
        ? {
            available: true,
            ...wsStats,
          }
        : {
            available: false,
            message: "WebSocket server not initialized or stats not available",
          },
      // Include battle info map for rooms to look up
      battleInfo: Object.fromEntries(battleInfoMap),
      liveBattles: {
        count: liveBattles.length,
        battles: liveBattles.map((b) => ({
          id: b.id,
          title: b.title,
          isLive: b.isLive,
          liveStartedAt: b.liveStartedAt,
          currentRound: b.currentRound,
          status: b.status,
          player1: b.player1Persona.name,
          player2: b.player2Persona.name,
        })),
      },
      recentBattles: recentBattles.map((b) => ({
        id: b.id,
        title: b.title,
        status: b.status,
        completedAt: b.updatedAt,
        player1: b.player1Persona.name,
        player2: b.player2Persona.name,
        winner: b.winner,
      })),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Admin Stats] Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

