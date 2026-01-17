import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encrypt } from "@/lib/auth/encryption";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { saveBattle } from "@/lib/battle-storage";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitization";
import type { Battle } from "@/lib/shared";
import { getPersona } from "@/lib/shared/personas";
import { createBattleRequestSchema } from "@/lib/validations/battle";

// Extended schema to include isFeatured, votingEnabled, commentsEnabled, and custom contexts
// Use .merge() instead of .extend() because createBattleRequestSchema contains refinements
const extendedBattleRequestSchema = createBattleRequestSchema.merge(
  z.object({
    isFeatured: z.boolean().optional().default(false),
    votingEnabled: z.boolean().optional().default(false),
    commentsEnabled: z.boolean().optional().default(true),
    autoStartOnAdvance: z.boolean().optional().default(true),
    // Custom context for personas (max 120 characters, optional)
    player1CustomContext: z.string().max(120).optional(),
    player2CustomContext: z.string().max(120).optional(),
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
      player1CustomContext,
      player2CustomContext,
    } = validation.data;

    // If creating a featured battle, verify user is admin
    if (isFeatured && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can create featured battles" },
        { status: 403 },
      );
    }

    // Get personas
    const player1PersonaBase = getPersona(player1PersonaId);
    const player2PersonaBase = getPersona(player2PersonaId);

    if (!player1PersonaBase || !player2PersonaBase) {
      return NextResponse.json(
        { error: "Invalid persona ID(s)" },
        { status: 400 },
      );
    }

    // Sanitize and encrypt custom contexts if provided
    const player1EncryptedContext = player1CustomContext
      ? encrypt(sanitizeText(player1CustomContext.trim()))
      : undefined;
    const player2EncryptedContext = player2CustomContext
      ? encrypt(sanitizeText(player2CustomContext.trim()))
      : undefined;

    // Create persona objects with optional encrypted custom context
    const player1Persona = {
      ...player1PersonaBase,
      ...(player1EncryptedContext && { encryptedCustomContext: player1EncryptedContext }),
    };
    const player2Persona = {
      ...player2PersonaBase,
      ...(player2EncryptedContext && { encryptedCustomContext: player2EncryptedContext }),
    };

    // Generate battle ID and metadata
    // SECURITY: Use cryptographic random ID to prevent enumeration attacks
    const now = Date.now();
    const battleId = nanoid(16);
    const month = new Date().toLocaleDateString("en-US", { month: "long" });
    const year = new Date().getFullYear();

    // Create new battle
    const battle: Battle = {
      id: battleId,
      title: `${player1PersonaBase.name} vs. ${player2PersonaBase.name}`,
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
