import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import type { Comment } from '@/lib/shared';
import { MAX_COMMENTS } from '@/lib/shared';
import { commentRequestSchema } from '@/lib/validations/battle';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input with Zod
    const validation = commentRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { username, content, round } = validation.data;

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment: Comment = {
      id: `${id}-comment-${Date.now()}-${Math.random()}`,
      username, // Already trimmed and validated by Zod
      content, // Already trimmed and validated by Zod
      timestamp: Date.now(),
      round,
    };

    battle.comments = [...battle.comments, comment];

    // Limit total comments
    if (battle.comments.length > MAX_COMMENTS) {
      battle.comments = battle.comments.slice(-MAX_COMMENTS);
    }

    battle.updatedAt = Date.now();

    await saveBattle(battle);

    // Revalidate the archive page and battle page to show fresh data
    revalidatePath('/archive');
    revalidatePath(`/battle/${id}`);

    return new Response(JSON.stringify({ success: true, comment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error submitting comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

