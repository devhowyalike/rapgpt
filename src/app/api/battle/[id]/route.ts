import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
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
    const { id } = await params;
    const battle: Battle = await request.json();

    if (battle.id !== id) {
      return new Response(JSON.stringify({ error: 'Battle ID mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await saveBattle(battle);

    // Revalidate the archive page and battle page to show fresh data
    revalidatePath('/archive');
    revalidatePath(`/battle/${id}`);

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

