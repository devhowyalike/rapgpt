/**
 * Manual endpoint to mark song as complete with audio URL from Suno dashboard
 * This is a workaround since Suno API doesn't seem to provide a status polling endpoint
 */

import { NextResponse } from 'next/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import type { SongGenerationBeatStyle } from '@/lib/shared/battle-types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { audioUrl, taskId } = body;

    if (!audioUrl || !taskId) {
      return NextResponse.json(
        { error: 'audioUrl and taskId are required' },
        { status: 400 }
      );
    }

    // Get the battle
    const battle = await getBattleById(id);
    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    // Verify taskId matches
    if (battle.generatedSong?.sunoTaskId !== taskId) {
      return NextResponse.json(
        { error: 'Task ID mismatch' },
        { status: 400 }
      );
    }

    // Update with the audio URL
    const completedSong = {
      ...battle.generatedSong,
      audioUrl,
      videoUrl: battle.generatedSong?.videoUrl || '',
      imageUrl: battle.generatedSong?.imageUrl || '',
      title: battle.generatedSong?.title || `${battle.title} Song`,
      beatStyle: (battle.generatedSong?.beatStyle || 'boom-bap') as SongGenerationBeatStyle,
      generatedAt: battle.generatedSong?.generatedAt || Date.now(),
      sunoTaskId: taskId,
    };

    await saveBattle({
      ...battle,
      generatedSong: completedSong,
    });

    return NextResponse.json({
      success: true,
      song: completedSong,
    });

  } catch (error) {
    console.error('Error manually completing song:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to complete song'
      },
      { status: 500 }
    );
  }
}

