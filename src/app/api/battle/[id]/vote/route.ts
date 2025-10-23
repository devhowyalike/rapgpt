import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { updateScoreWithVotes, isBattleArchived, isRoundComplete } from '@/lib/battle-engine';
import { voteRequestSchema } from '@/lib/validations/battle';
import { createArchivedBattleResponse } from '@/lib/validations/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input with Zod
    const validation = voteRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { round, personaId, userId } = validation.data;

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent votes on archived battles
    if (isBattleArchived(battle)) {
      return createArchivedBattleResponse('vote');
    }

    // Only allow voting on the current round
    if (round !== battle.currentRound) {
      return new Response(JSON.stringify({ 
        error: 'Can only vote on the current round',
        currentRound: battle.currentRound,
        attemptedRound: round
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only allow voting if the round is complete (both personas have performed)
    if (!isRoundComplete(battle, round)) {
      return new Response(JSON.stringify({ 
        error: 'Round is not complete yet. Wait for both personas to perform.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the round score
    const roundScoreIndex = battle.scores.findIndex(s => s.round === round);
    
    if (roundScoreIndex === -1) {
      return new Response(JSON.stringify({ error: 'Round not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update vote count
    const roundScore = battle.scores[roundScoreIndex];
    const currentVotes = roundScore.personaScores[personaId]?.userVotes || 0;
    const updatedScore = updateScoreWithVotes(roundScore, personaId, currentVotes + 1);

    battle.scores[roundScoreIndex] = updatedScore;
    battle.updatedAt = Date.now();

    await saveBattle(battle);

    // Revalidate the archive page and battle page to show fresh data
    revalidatePath('/archive');
    revalidatePath(`/battle/${id}`);

    return new Response(JSON.stringify({ success: true, battle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit vote' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

