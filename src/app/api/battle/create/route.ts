import { NextRequest, NextResponse } from 'next/server';
import type { Battle } from '@/lib/shared';
import { getPersona } from '@/lib/shared/personas';
import { saveBattle } from '@/lib/battle-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leftPersonaId, rightPersonaId } = body;

    // Validate input
    if (!leftPersonaId || !rightPersonaId) {
      return NextResponse.json(
        { error: 'Both leftPersonaId and rightPersonaId are required' },
        { status: 400 }
      );
    }

    if (leftPersonaId === rightPersonaId) {
      return NextResponse.json(
        { error: 'Cannot battle the same persona' },
        { status: 400 }
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

    // Save battle
    await saveBattle(battle);

    return NextResponse.json({ battleId: battle.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating battle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

