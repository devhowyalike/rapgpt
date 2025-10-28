import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { Battle } from '@/lib/shared';
import { getPersona } from '@/lib/shared/personas';
import { saveBattle } from '@/lib/battle-storage';
import { createBattleRequestSchema } from '@/lib/validations/battle';
import { getOrCreateUser } from '@/lib/auth/sync-user';
import { z } from 'zod';

// Extended schema to include isFeatured
// Use .merge() instead of .extend() because createBattleRequestSchema contains refinements
const extendedBattleRequestSchema = createBattleRequestSchema.merge(
  z.object({
    isFeatured: z.boolean().optional().default(false),
  })
);

export async function POST(request: NextRequest) {
  try {
    // Require authentication for battle creation
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be signed in to create battles' },
        { status: 401 }
      );
    }

    // Get or create user from database (syncs from Clerk if needed)
    const user = await getOrCreateUser(clerkUserId);

    const body = await request.json();
    
    // Validate input with Zod
    const validation = extendedBattleRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { leftPersonaId, rightPersonaId, isFeatured } = validation.data;

    // If creating a featured battle, verify user is admin
    if (isFeatured && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create featured battles' },
        { status: 403 }
      );
    }

    // Get personas
    const leftPersona = getPersona(leftPersonaId);
    const rightPersona = getPersona(rightPersonaId);

    if (!leftPersona || !rightPersona) {
      return NextResponse.json(
        { error: 'Invalid persona ID(s)' },
        { status: 400 }
      );
    }

    // Generate battle ID and metadata
    const now = Date.now();
    const battleId = `battle-${leftPersonaId}-vs-${rightPersonaId}-${now}`;
    const month = new Date().toLocaleDateString('en-US', { month: 'long' });
    const year = new Date().getFullYear();

    // Create new battle
    const battle: Battle = {
      id: battleId,
      title: `${leftPersona.name} vs ${rightPersona.name}`,
      month,
      year,
      status: 'ongoing',
      personas: {
        left: leftPersona,
        right: rightPersona,
      },
      currentRound: 1,
      currentTurn: 'left',
      verses: [],
      scores: [],
      comments: [],
      winner: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save battle with createdBy and isFeatured
    await saveBattle(battle, {
      createdBy: user.id,
      isFeatured,
    });

    return NextResponse.json({ battleId: battle.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating battle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

