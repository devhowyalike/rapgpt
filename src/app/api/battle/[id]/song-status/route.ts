/**
 * API endpoint for checking song generation status
 */

import { NextResponse } from 'next/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { checkSongStatus } from '@/lib/suno/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 }
      );
    }

    // Check status from Suno API
    const status = await checkSongStatus(taskId);

    // If complete, save to database
    if (status.status === 'complete' && status.audioUrl) {
      const battle = await getBattleById(id);
      if (battle) {
        // Extract beat style from existing generatedSong or default to boom-bap
        const beatStyle = battle.generatedSong?.beatStyle || 'boom-bap' as const;
        
        const completedSong = {
          audioUrl: status.audioUrl,
          videoUrl: status.videoUrl || '',
          imageUrl: status.imageUrl || '',
          title: battle.generatedSong?.title || `${battle.title} Song`,
          beatStyle,
          generatedAt: Date.now(),
          sunoTaskId: taskId,
        };

        await saveBattle({
          ...battle,
          generatedSong: completedSong,
        });

        return NextResponse.json({
          status: 'complete',
          song: completedSong,
        });
      }
    }

    // Return current status
    return NextResponse.json({
      status: status.status,
      audioUrl: status.audioUrl,
      errorMessage: status.errorMessage,
    });

  } catch (error) {
    console.error('Error checking song status:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to check song status'
      },
      { status: 500 }
    );
  }
}

