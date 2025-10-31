import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { broadcastEvent } from '@/lib/websocket/broadcast-helper';
import type { BattleLiveEndedEvent } from '@/lib/websocket/types';
import { checkRole } from '@/lib/auth/roles';

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

    // Check if user is admin
    const adminCheck = await checkRole('admin');
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await params;
    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update battle to end live mode
    battle.isLive = false;
    // If the live battle has been completed (winner assigned or status already completed), mark as completed
    if (battle.status === 'completed' || !!battle.winner) {
      battle.status = 'completed';
      // Note: isFeatured status remains as originally set when battle was created
    }
    battle.updatedAt = Date.now();

    await saveBattle(battle);

    // Broadcast live ended event
    await broadcastEvent(id, {
      type: 'battle:live_ended',
      battleId: id,
      timestamp: Date.now(),
      battle,
    } as BattleLiveEndedEvent);

    return new Response(JSON.stringify({ success: true, battle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error stopping live battle:', error);
    return new Response(JSON.stringify({ error: 'Failed to stop live battle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

