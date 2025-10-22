import { NextRequest } from 'next/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import type { Comment } from '@/lib/shared';
import { MAX_COMMENTS } from '@/lib/shared';

interface CommentRequest {
  username: string;
  content: string;
  round?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { username, content, round }: CommentRequest = await request.json();

    if (!username || !content) {
      return new Response(JSON.stringify({ error: 'Username and content required' }), {
        status: 400,
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

    const comment: Comment = {
      id: `${id}-comment-${Date.now()}-${Math.random()}`,
      username: username.trim().slice(0, 50),
      content: content.trim().slice(0, 500),
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

