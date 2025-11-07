import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { canManageBattle } from '@/lib/auth/roles';
import { z } from 'zod';

const controlModeSchema = z.object({
  mode: z.enum(['manual', 'auto']),
  config: z.object({
    verseDelay: z.number().min(5).max(120).optional(),
    autoAdvance: z.boolean().optional(),
    readingDuration: z.number().min(5).max(60).optional(),
    votingDuration: z.number().min(5).max(60).optional(),
  }).optional(),
});

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
    const body = await request.json();
    
    const validation = controlModeSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { mode, config } = validation.data;

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

    if (!battle.isLive) {
      return new Response(
        JSON.stringify({ error: 'Battle must be live to change control mode' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update control mode
    battle.adminControlMode = mode;
    
    // Update config if provided
    if (config) {
      battle.autoPlayConfig = {
        ...battle.autoPlayConfig,
        ...config,
      };
    }
    
    battle.updatedAt = Date.now();

    await saveBattle(battle);

    return new Response(JSON.stringify({ success: true, battle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating control mode:', error);
    return new Response(JSON.stringify({ error: 'Failed to update control mode' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

