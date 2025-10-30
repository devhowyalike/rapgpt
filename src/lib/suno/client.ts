/**
 * Suno API Client for AI Music Generation
 * Documentation: https://docs.sunoapi.org
 */

import type { Battle, Persona, SongGenerationBeatStyle } from '@/lib/shared/battle-types';

const SUNO_API_BASE_URL = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org';
const SUNO_API_KEY = process.env.SUNO_API_KEY;

interface SunoGenerateRequest {
  prompt: string;
  lyrics: string;
  title: string;
  make_instrumental: boolean;
  model: string;
  wait_audio: boolean;
}

interface SunoGenerateResponse {
  data: Array<{
    id: string;
    audio_url: string;
    video_url: string;
    image_url: string;
    image_large_url: string;
    title: string;
    model_name: string;
    status: 'submitted' | 'queued' | 'streaming' | 'complete' | 'error';
    error_message?: string;
  }>;
}

interface SunoStatusResponse {
  data: {
    id: string;
    audio_url: string;
    video_url: string;
    image_url: string;
    image_large_url: string;
    title: string;
    model_name: string;
    status: 'submitted' | 'queued' | 'streaming' | 'complete' | 'error';
    error_message?: string;
  };
}

/**
 * Beat style to music prompt mapping
 */
const BEAT_STYLE_PROMPTS: Record<SongGenerationBeatStyle, string> = {
  'g-funk': 'West Coast G-Funk hip-hop, smooth funky basslines, synthesizer leads, laid-back groove, 90s California rap style',
  'boom-bap': '90s East Coast boom bap hip-hop, hard-hitting drums, jazz samples, classic breakbeats, underground rap style',
  'trap': 'Modern trap hip-hop, heavy 808 bass, rapid hi-hats, Atlanta sound, contemporary rap style',
};

/**
 * Format battle verses into Suno-compatible lyrics
 */
export function formatLyricsForSuno(battle: Battle): string {
  const lyrics: string[] = [];
  
  // Group verses by round
  for (let round = 1; round <= 3; round++) {
    const roundVerses = battle.verses.filter(v => v.round === round);
    
    if (roundVerses.length > 0) {
      lyrics.push(`[Round ${round}]`);
      
      // Add verses in order (left then right)
      const leftVerse = roundVerses.find(v => v.personaId === battle.personas.left.id);
      const rightVerse = roundVerses.find(v => v.personaId === battle.personas.right.id);
      
      if (leftVerse) {
        lyrics.push(`[${battle.personas.left.name}]`);
        lyrics.push(leftVerse.fullText);
        lyrics.push('');
      }
      
      if (rightVerse) {
        lyrics.push(`[${battle.personas.right.name}]`);
        lyrics.push(rightVerse.fullText);
        lyrics.push('');
      }
    }
  }
  
  return lyrics.join('\n');
}

/**
 * Build song generation prompt combining persona styles and beat selection
 */
export function buildSongPrompt(
  leftPersona: Persona,
  rightPersona: Persona,
  beatStyle: SongGenerationBeatStyle
): string {
  const beatPrompt = BEAT_STYLE_PROMPTS[beatStyle];
  
  // Extract style characteristics from personas
  const styles: string[] = [];
  
  if (leftPersona.style) styles.push(leftPersona.style);
  if (rightPersona.style) styles.push(rightPersona.style);
  
  // Create a combined prompt
  const styleDescription = styles.length > 0 
    ? `incorporating ${styles.join(' and ')} influences, `
    : '';
  
  return `${beatPrompt}, ${styleDescription}rap battle format, energetic delivery, clear vocals, competitive flow`;
}

/**
 * Generate a song from battle verses using Suno API
 */
export async function generateSong(
  battle: Battle,
  beatStyle: SongGenerationBeatStyle
): Promise<{ taskId: string; status: string }> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured');
  }
  
  const lyrics = formatLyricsForSuno(battle);
  const prompt = buildSongPrompt(battle.personas.left, battle.personas.right, beatStyle);
  const title = `${battle.title} - ${beatStyle.toUpperCase()} Battle`;
  
  const requestBody: SunoGenerateRequest = {
    prompt,
    lyrics,
    title,
    make_instrumental: false,
    model: 'chirp-v3-5', // Latest Suno model
    wait_audio: false, // Don't wait, we'll poll for status
  };
  
  const response = await fetch(`${SUNO_API_BASE_URL}/v1/music/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json() as SunoGenerateResponse;
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No music generation task created');
  }
  
  const task = data.data[0];
  
  return {
    taskId: task.id,
    status: task.status,
  };
}

/**
 * Check the status of a song generation task
 */
export async function checkSongStatus(taskId: string): Promise<{
  status: 'submitted' | 'queued' | 'streaming' | 'complete' | 'error';
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  errorMessage?: string;
}> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured');
  }
  
  const response = await fetch(`${SUNO_API_BASE_URL}/v1/music/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json() as SunoStatusResponse;
  
  return {
    status: data.data.status,
    audioUrl: data.data.audio_url,
    videoUrl: data.data.video_url,
    imageUrl: data.data.image_large_url || data.data.image_url,
    errorMessage: data.data.error_message,
  };
}

/**
 * Poll for song completion with timeout
 * @param taskId - Suno task ID
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Polling interval in milliseconds (default: 5000)
 */
export async function pollSongCompletion(
  taskId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<{
  audioUrl: string;
  videoUrl: string;
  imageUrl: string;
}> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkSongStatus(taskId);
    
    if (status.status === 'complete' && status.audioUrl) {
      return {
        audioUrl: status.audioUrl,
        videoUrl: status.videoUrl || '',
        imageUrl: status.imageUrl || '',
      };
    }
    
    if (status.status === 'error') {
      throw new Error(status.errorMessage || 'Song generation failed');
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Song generation timeout - please check back later');
}

