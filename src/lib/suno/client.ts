/**
 * Suno API Client for AI Music Generation
 * Documentation: https://docs.sunoapi.org
 */

import type { Battle, Persona, SongGenerationBeatStyle } from '@/lib/shared/battle-types';
import { ROUNDS_PER_BATTLE } from '@/lib/shared/battle-types';

const SUNO_API_BASE_URL = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org';
const SUNO_API_KEY = process.env.SUNO_API_KEY;

interface SunoGenerateRequest {
  prompt: string;
  style: string;
  title: string;
  customMode: boolean;
  instrumental: boolean;
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
  callBackUrl?: string;
}

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}


// Suno record-info response format from /api/v1/generate/record-info
interface SunoRecordInfoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    parentMusicId?: string;
    param?: string;
    response?: {
      taskId: string;
      sunoData: Array<{
        id: string;
        audioUrl: string;
        streamAudioUrl?: string;
        imageUrl?: string;
        prompt?: string;
        modelName?: string;
        title?: string;
        tags?: string;
        createTime?: string;
        duration?: number;
      }>;
    };
    status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' | 'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR';
    type?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
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
  for (let round = 1; round <= ROUNDS_PER_BATTLE; round++) {
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
  
  const formatted = lyrics.join('\n');
  console.log('[Suno] Formatted lyrics:', {
    length: formatted.length,
    totalVerses: battle.verses.length,
    preview: formatted.substring(0, 200) + '...',
  });
  
  return formatted;
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
  
  const prompt = `${beatPrompt}, ${styleDescription}rap battle format, energetic delivery, clear vocals, competitive flow`;
  console.log('[Suno] Built style prompt:', {
    beatStyle,
    prompt,
    length: prompt.length,
  });
  
  return prompt;
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
  const style = buildSongPrompt(battle.personas.left, battle.personas.right, beatStyle);
  const title = `${battle.title} - ${beatStyle.toUpperCase()} Battle`;
  
  const requestBody: SunoGenerateRequest = {
    prompt: lyrics,
    style: style,
    title: title,
    customMode: true,
    instrumental: false,
    model: 'V4_5', // V4.5 model - good balance of quality and speed
    callBackUrl: 'https://example.com/callback', // Dummy callback - we poll instead
  };
  
  console.log('[Suno] Generating song with request:', {
    url: `${SUNO_API_BASE_URL}/api/v1/generate`,
    prompt_length: lyrics.length,
    style_length: style.length,
    title_length: title.length,
    model: requestBody.model,
  });
  
  const response = await fetch(`${SUNO_API_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  console.log('[Suno] Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('[Suno] Error response:', error);
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json() as SunoGenerateResponse;
  console.log('[Suno] Response data:', data);
  
  if (data.code !== 200) {
    console.error('[Suno] API returned error code:', data.code, data.msg);
    throw new Error(`Suno API error: ${data.msg}`);
  }
  
  return {
    taskId: data.data.taskId,
    status: 'queued',
  };
}

/**
 * Check the status of a song generation task using the official endpoint
 * Documentation: https://docs.sunoapi.org/suno-api/get-music-generation-details
 */
export async function checkSongStatus(taskId: string): Promise<{
  status: 'streaming' | 'complete' | 'error';
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  errorMessage?: string;
}> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured');
  }
  
  const url = `${SUNO_API_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`;
  console.log('[Suno] Checking status:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`,
    },
  });
  
  console.log('[Suno] Status response:', {
    status: response.status,
    statusText: response.statusText,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('[Suno] Error response:', error);
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json() as SunoRecordInfoResponse;
  console.log('[Suno] Status data:', {
    status: data.data.status,
    taskId: data.data.taskId,
  });
  
  if (data.code !== 200) {
    throw new Error(`Suno API error: ${data.msg}`);
  }
  
  // Check status field
  if (data.data.status === 'SUCCESS' && data.data.response?.sunoData && data.data.response.sunoData.length > 0) {
    // Use first song
    const song = data.data.response.sunoData[0];
    console.log('[Suno] Generation complete, audioUrl:', song.audioUrl);
    
    return {
      status: 'complete',
      audioUrl: song.audioUrl,
      videoUrl: '',
      imageUrl: song.imageUrl || '',
      errorMessage: undefined,
    };
  } 
  
  if (data.data.status === 'CREATE_TASK_FAILED' || data.data.status === 'GENERATE_AUDIO_FAILED' || 
      data.data.status === 'CALLBACK_EXCEPTION' || data.data.status === 'SENSITIVE_WORD_ERROR') {
    return {
      status: 'error',
      audioUrl: '',
      videoUrl: '',
      imageUrl: '',
      errorMessage: data.data.errorMessage || `Generation failed: ${data.data.status}`,
    };
  }
  
  // Still in progress (PENDING, TEXT_SUCCESS, FIRST_SUCCESS)
  console.log('[Suno] Generation in progress');
  return {
    status: 'streaming',
    audioUrl: '',
    videoUrl: '',
    imageUrl: '',
    errorMessage: undefined,
  };
}
