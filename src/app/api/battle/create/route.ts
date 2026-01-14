import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { saveBattle } from "@/lib/battle-storage";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import type { Battle } from "@/lib/shared";
import { getPersona } from "@/lib/shared/personas";
import { createBattleRequestSchema } from "@/lib/validations/battle";

// Extended schema to include isFeatured, votingEnabled, and commentsEnabled
// Use .merge() instead of .extend() because createBattleRequestSchema contains refinements
const extendedBattleRequestSchema = createBattleRequestSchema.merge(
  z.object({
    isFeatured: z.boolean().optional().default(false),
    votingEnabled: z.boolean().optional().default(false),
    commentsEnabled: z.boolean().optional().default(true),
    autoStartOnAdvance: z.boolean().optional().default(true),
  }),
);

export async function POST(request: NextRequest) {
  try {
    // Require authentication for battle creation
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized: You must be signed in to create battles" },
        { status: 401 },
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      `create:${clerkUserId}`,
      RATE_LIMITS.createBattle
    );
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Get or create user from database (syncs from Clerk if needed)
    const user = await getOrCreateUser(clerkUserId);

    const body = await request.json();

    // Validate input with Zod
    const validation = extendedBattleRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const {
      player1PersonaId,
      player2PersonaId,
      stageId,
      isFeatured,
      votingEnabled,
      commentsEnabled,
      autoStartOnAdvance,
    } = validation.data;

    // If creating a featured battle, verify user is admin
    if (isFeatured && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can create featured battles" },
        { status: 403 },
      );
    }

    // Get personas
    const player1Persona = getPersona(player1PersonaId);
    const player2Persona = getPersona(player2PersonaId);

    if (!player1Persona || !player2Persona) {
      return NextResponse.json(
        { error: "Invalid persona ID(s)" },
        { status: 400 },
      );
    }

    // Generate battle ID and metadata
    // SECURITY: Use cryptographic random ID to prevent enumeration attacks
    const now = Date.now();
    const battleId = nanoid(16);
    const month = new Date().toLocaleDateString("en-US", { month: "long" });
    const year = new Date().getFullYear();

    // Create new battle
    const battle: Battle = {
      id: battleId,
      title: `${player1Persona.name} vs. ${player2Persona.name}`,
      month,
      year,
      status: "paused",
      stageId,
      personas: {
        player1: player1Persona,
        player2: player2Persona,
      },
      currentRound: 1,
      currentTurn: "player1",
      verses: [],
      scores: [],
      comments: [],
      winner: null,
      createdAt: now,
      updatedAt: now,
      autoStartOnAdvance,
    };

    // Save battle with createdBy, isFeatured, votingEnabled, and commentsEnabled
    await saveBattle(battle, {
      createdBy: user.id,
      isFeatured,
      votingEnabled,
      commentsEnabled,
    });

    return NextResponse.json({ battleId: battle.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating battle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
