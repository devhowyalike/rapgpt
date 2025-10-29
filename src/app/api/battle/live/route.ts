import { NextRequest } from 'next/server';
import { getLiveBattles } from '@/lib/battle-storage';

export async function GET(request: NextRequest) {
  try {
    const battles = await getLiveBattles();
    console.log('[API /battle/live] Fetched', battles.length, 'live battles');

    return new Response(JSON.stringify({ battles }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API /battle/live] Error fetching live battles:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch live battles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

