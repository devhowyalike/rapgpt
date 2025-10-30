/**
 * API endpoint for generating AI songs from battle verses
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBattleById, saveBattle } from '@/lib/battle-storage';
import { generateSong, pollSongCompletion } from '@/lib/suno/client';
import type { SongGenerationBeatStyle } from '@/lib/shared/battle-types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Get the battle
    const battle = await getBattleById(id);
    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    // Validate user is battle creator (bypass for testing if env var is set)
    const bypassCreatorCheck = process.env.BYPASS_SONG_GENERATION_AUTH === 'true';
    if (!bypassCreatorCheck && (!battle.creator || battle.creator.userId !== userId)) {
      return NextResponse.json(
        { error: 'Only the battle creator can generate songs' },
        { status: 403 }
      );
    }

    // Validate battle is completed
    if (battle.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only generate songs for completed battles' },
        { status: 400 }
      );
    }

    // Check if song already exists
    if (battle.generatedSong) {
      return NextResponse.json(
        { error: 'Song already generated for this battle' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { beatStyle } = body as { beatStyle: SongGenerationBeatStyle };

    // Validate beat style
    if (!beatStyle || !['g-funk', 'boom-bap', 'trap'].includes(beatStyle)) {
      return NextResponse.json(
        { error: 'Invalid beat style. Must be: g-funk, boom-bap, or trap' },
        { status: 400 }
      );
    }

    // Validate battle has verses
    if (battle.verses.length === 0) {
      return NextResponse.json(
        { error: 'Battle has no verses to generate song from' },
        { status: 400 }
      );
    }

    // Generate song using Suno API
    console.log('[API] Starting song generation for battle:', id, 'with beat style:', beatStyle);
    console.log('[API] Battle has', battle.verses.length, 'verses');
    
    let taskId: string;
    try {
      const result = await generateSong(battle, beatStyle);
      taskId = result.taskId;
      console.log('[API] Song generation started successfully. TaskId:', taskId);
    } catch (error) {
      console.error('[API] Error initiating song generation:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { 
          error: error instanceof Error 
            ? `Failed to start song generation: ${error.message}` 
            : 'Failed to start song generation'
        },
        { status: 500 }
      );
    }

    // Save initial song data with taskId so we can track it
    const partialSong = {
      audioUrl: '', // Will be filled when complete
      videoUrl: '',
      imageUrl: '',
      title: `${battle.title} - ${beatStyle.toUpperCase()} Battle`,
      beatStyle,
      generatedAt: Date.now(),
      sunoTaskId: taskId,
    };

    await saveBattle({
      ...battle,
      generatedSong: partialSong,
    });

    // Return taskId immediately - let client poll for progress
    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'Song generation started. Polling for completion...',
    });

  } catch (error) {
    console.error('Unexpected error generating song:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

