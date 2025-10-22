import { NextRequest } from 'next/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { updateScoreWithVotes } from '@/lib/battle-engine';

interface VoteRequest {
  round: number;
  personaId: string;
  userId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { round, personaId, userId }: VoteRequest = await request.json();

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
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

