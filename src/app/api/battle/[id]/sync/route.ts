import { NextRequest } from 'next/server';
import { getBattleById } from '@/lib/battle-storage';
import { getViewerCount } from '@/lib/websocket/server';

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

    const viewerCount = getViewerCount(id);

    return new Response(JSON.stringify({ 
      battle,
      viewerCount,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing battle state:', error);
    return new Response(JSON.stringify({ error: 'Failed to sync battle state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

