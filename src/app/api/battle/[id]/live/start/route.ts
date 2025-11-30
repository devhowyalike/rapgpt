import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { broadcastEvent } from '@/lib/websocket/broadcast-helper';
import type { BattleLiveStartedEvent } from '@/lib/websocket/types';
import { canManageBattle } from '@/lib/auth/roles';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await params;

    // Check if user can manage this battle
    const authCheck = await canManageBattle(id);
    if (!authCheck.authorized) {
      return new Response(JSON.stringify({ error: authCheck.error }), {
        status: authCheck.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (battle.status !== 'paused') {
      return new Response(
        JSON.stringify({ error: 'Battle must be in paused status to go live' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update battle to live mode
    battle.isLive = true;
    battle.votingEnabled = true; // Automatically enable voting when going live
    battle.liveStartedAt = Date.now();
    battle.adminControlMode = battle.adminControlMode || 'manual';
    battle.updatedAt = Date.now();

    await saveBattle(battle);

    // Broadcast live started event
    await broadcastEvent(id, {
      type: 'battle:live_started',
      battleId: id,
      timestamp: Date.now(),
      battle,
      adminId: clerkUserId,
    } as BattleLiveStartedEvent);

    return new Response(JSON.stringify({ success: true, battle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting live battle:', error);
    return new Response(JSON.stringify({ error: 'Failed to start live battle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

