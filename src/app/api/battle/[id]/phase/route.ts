import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { canManageBattle } from "@/lib/auth/roles";
import { getBattleById } from "@/lib/battle-storage";
import { broadcastEvent } from "@/lib/websocket/broadcast-helper";
import type { PhaseReadingEvent, PhaseVotingEvent } from "@/lib/websocket/types";

/**
 * POST /api/battle/[id]/phase
 * Broadcasts phase changes (reading/voting) to WebSocket viewers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;

    // Check if user can manage this battle
    const authCheck = await canManageBattle(id);
    if (!authCheck.authorized) {
      return new Response(JSON.stringify({ error: authCheck.error }), {
        status: authCheck.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: "Battle not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!battle.isLive) {
      return new Response(
        JSON.stringify({ error: "Battle must be live to broadcast phase changes" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const { phase, duration } = body;

    if (!phase || !["reading", "voting"].includes(phase)) {
      return new Response(
        JSON.stringify({ error: "Invalid phase. Must be 'reading' or 'voting'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (typeof duration !== "number" || duration <= 0) {
      return new Response(
        JSON.stringify({ error: "Duration must be a positive number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Broadcast the phase event
    if (phase === "reading") {
      await broadcastEvent(id, {
        type: "phase:reading",
        battleId: id,
        timestamp: Date.now(),
        round: battle.currentRound,
        duration,
      } as PhaseReadingEvent);
    } else {
      await broadcastEvent(id, {
        type: "phase:voting",
        battleId: id,
        timestamp: Date.now(),
        round: battle.currentRound,
        duration,
      } as PhaseVotingEvent);
    }

    return new Response(
      JSON.stringify({ success: true, phase, duration, round: battle.currentRound }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error broadcasting phase:", error);
    return new Response(
      JSON.stringify({ error: "Failed to broadcast phase change" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

