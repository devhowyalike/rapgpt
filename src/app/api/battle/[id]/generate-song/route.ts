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

    // Validate user is battle creator
    if (!battle.creator || battle.creator.userId !== userId) {
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
    let taskId: string;
    try {
      const result = await generateSong(battle, beatStyle);
      taskId = result.taskId;
    } catch (error) {
      console.error('Error initiating song generation:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error 
            ? `Failed to start song generation: ${error.message}` 
            : 'Failed to start song generation'
        },
        { status: 500 }
      );
    }

    // Poll for completion (with 5 minute timeout = 60 attempts * 5 seconds)
    let songData;
    try {
      songData = await pollSongCompletion(taskId, 60, 5000);
    } catch (error) {
      console.error('Error polling song completion:', error);
      
      // If timeout, save partial data so user can check back later
      const partialSong = {
        audioUrl: '', // Empty until complete
        title: `${battle.title} - ${beatStyle.toUpperCase()} Battle`,
        beatStyle,
        generatedAt: Date.now(),
        sunoTaskId: taskId,
      };

      const updatedBattle = {
        ...battle,
        generatedSong: partialSong,
      };

      await saveBattle(updatedBattle);

      return NextResponse.json(
        { 
          error: 'Song generation is taking longer than expected. The song will continue processing - check back in a few minutes.',
          taskId,
          partial: true,
        },
        { status: 202 } // Accepted but not complete
      );
    }

    // Save completed song data to battle
    const completedSong = {
      audioUrl: songData.audioUrl,
      videoUrl: songData.videoUrl,
      imageUrl: songData.imageUrl,
      title: `${battle.title} - ${beatStyle.toUpperCase()} Battle`,
      beatStyle,
      generatedAt: Date.now(),
      sunoTaskId: taskId,
    };

    const updatedBattle = {
      ...battle,
      generatedSong: completedSong,
    };

    await saveBattle(updatedBattle);

    // Return success with song data
    return NextResponse.json({
      success: true,
      song: completedSong,
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

