import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { db } from '@/lib/db/client';
import { battles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateUser } from '@/lib/auth/sync-user';
import type { Battle } from '@/lib/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(battle), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching battle:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch battle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: You must be signed in to update battles' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create user from database
    const user = await getOrCreateUser(clerkUserId);

    const { id } = await params;
    const battle: Battle = await request.json();

    if (battle.id !== id) {
      return new Response(JSON.stringify({ error: 'Battle ID mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user owns the battle
    const existingBattle = await db.query.battles.findFirst({
      where: eq(battles.id, id),
    });

    if (!existingBattle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authorization: user must own the battle OR be an admin
    const isOwner = existingBattle.createdBy === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden: You do not have permission to update this battle' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Persist main battle fields
    await saveBattle(battle);

    // If an admin just completed this battle, feature it for the archive
    const becameCompleted = battle.status === 'completed' && existingBattle.status !== 'completed';
    if (becameCompleted && isAdmin && !existingBattle.isFeatured) {
      await db
        .update(battles)
        .set({
          isFeatured: true,
          updatedAt: new Date(),
        })
        .where(eq(battles.id, id));
    }

    // If battle is being paused, automatically unpublish it
    if (battle.status === 'incomplete' && existingBattle.isPublic) {
      await db
        .update(battles)
        .set({
          isPublic: false,
          updatedAt: new Date(),
        })
        .where(eq(battles.id, id));
    }

    // Revalidate pages to show fresh data
    revalidatePath('/archive');
    revalidatePath('/community');
    revalidatePath(`/battle/${id}`);
    revalidatePath(`/profile/${existingBattle.createdBy}`);

    return new Response(JSON.stringify(battle), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating battle:', error);
    return new Response(JSON.stringify({ error: 'Failed to update battle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

