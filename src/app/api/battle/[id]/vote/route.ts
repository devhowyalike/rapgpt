import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { updateScoreWithVotes, isBattleArchived, isRoundComplete } from '@/lib/battle-engine';
import { voteRequestSchema } from '@/lib/validations/battle';
import { createArchivedBattleResponse } from '@/lib/validations/utils';
import { db } from '@/lib/db/client';
import { votes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getOrCreateUser } from '@/lib/auth/sync-user';
import { broadcastEvent } from '@/lib/websocket/broadcast-helper';
import type { VoteCastEvent } from '@/lib/websocket/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: You must be signed in to vote' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create user from database (syncs from Clerk if needed)
    const user = await getOrCreateUser(clerkUserId);

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
    
    const { round, personaId } = validation.data;

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

    // Check if user has already voted on this round
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.battleId, id),
        eq(votes.round, round),
        eq(votes.userId, user.id)
      ),
    });

    // Find the round score
    const roundScoreIndex = battle.scores.findIndex(s => s.round === round);
    
    if (roundScoreIndex === -1) {
      return new Response(JSON.stringify({ error: 'Round not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const roundScore = battle.scores[roundScoreIndex];

    if (existingVote) {
      // User is changing their vote
      if (existingVote.personaId === personaId) {
        // Clicking the same persona - undo the vote
        await db.delete(votes).where(eq(votes.id, existingVote.id));
        
        // Decrement vote count
        const currentVotes = roundScore.personaScores[personaId]?.userVotes || 0;
        const updatedScore = updateScoreWithVotes(roundScore, personaId, Math.max(0, currentVotes - 1));
        battle.scores[roundScoreIndex] = updatedScore;
      } else {
        // Voting for a different persona - update the vote
        await db.update(votes)
          .set({ personaId, createdAt: new Date() })
          .where(eq(votes.id, existingVote.id));
        
        // Decrement old persona's votes
        const oldVotes = roundScore.personaScores[existingVote.personaId]?.userVotes || 0;
        let updatedScore = updateScoreWithVotes(roundScore, existingVote.personaId, Math.max(0, oldVotes - 1));
        
        // Increment new persona's votes
        const newVotes = updatedScore.personaScores[personaId]?.userVotes || 0;
        updatedScore = updateScoreWithVotes(updatedScore, personaId, newVotes + 1);
        
        battle.scores[roundScoreIndex] = updatedScore;
      }
    } else {
      // New vote - insert into database
      await db.insert(votes).values({
        id: nanoid(),
        battleId: id,
        round,
        personaId,
        userId: user.id,
      });

      // Increment vote count
      const currentVotes = roundScore.personaScores[personaId]?.userVotes || 0;
      const updatedScore = updateScoreWithVotes(roundScore, personaId, currentVotes + 1);
      battle.scores[roundScoreIndex] = updatedScore;
    }

    battle.updatedAt = Date.now();

    await saveBattle(battle);

    // Broadcast vote event if battle is live
    if (battle.isLive) {
      await broadcastEvent(id, {
        type: 'vote:cast',
        battleId: id,
        timestamp: Date.now(),
        round,
        personaId,
        battle,
      } as VoteCastEvent);
    }

    // Revalidate the battle page to show fresh data
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

