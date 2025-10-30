/**
 * Suno API Client for AI Music Generation
 * Documentation: https://docs.sunoapi.org
 */

import type { Battle, Persona, SongGenerationBeatStyle } from '@/lib/shared/battle-types';

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

interface SunoStatusResponse {
  code: number;
  msg: string;
  data: Array<{
    id: string;
    audio_url: string;
    video_url: string;
    image_url: string;
    image_large_url: string;
    title: string;
    status: 'streaming' | 'complete' | 'error';
    error_message?: string;
  }>;
}

// Alternative response format for MusicAPI/producer endpoints
interface MusicAPIProducerResponse {
  code: number;
  data: Array<{
    clip_id: string;
    audio_url: string;
    video_url?: string | null;
    image_url: string;
    state: 'pending' | 'running' | 'succeeded';
    title?: string;
  }>;
  message: string;
}

// Alternative response format for MusicAPI/nuro endpoints  
interface MusicAPINuroResponse {
  task_id: string;
  status: 'pending' | 'running' | 'succeeded';
  progress: number;
  audio_url: string;
  lyrics?: string;
  duration?: number;
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
 * Check the status of a song generation task
 * 
 * Note: The exact endpoint path may vary. Try these if the current one fails:
 * - /api/v1/query/{taskId}
 * - /api/v1/task/{taskId}
 * - /api/v1/generate/{taskId}
 * Check your Suno API dashboard for the correct "Get Music Generation Details" endpoint
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
  
  // Try the status endpoint - the correct one from docs is first
  const endpoints = [
    `/api/v1/generate/record-info?taskId=${taskId}`,
  ];
  
  let lastError: Error | null = null;
  
  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      const url = `${SUNO_API_BASE_URL}${endpoint}`;
      console.log('[Suno] Trying status endpoint:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
      });
      
      console.log('[Suno] Status endpoint response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
      
      if (response.status === 404) {
        console.log('[Suno] 404 - trying next endpoint');
        // Try next endpoint
        continue;
      }
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[Suno] Error response from', endpoint, ':', error);
        throw new Error(`Suno API error: ${response.status} - ${error}`);
      }
      
      const data = await response.json();
      console.log('[Suno] Status data received:', data);
      
      // Try to parse response in different formats
      
      // Format 1: Suno record-info format (status field)
      if ('code' in data && 'data' in data && 'status' in data.data) {
        const recordInfo = data as SunoRecordInfoResponse;
        console.log('[Suno] Using record-info format, status:', recordInfo.data.status);
        
        if (recordInfo.code !== 200) {
          throw new Error(`Suno API error: ${recordInfo.msg}`);
        }
        
        // Check status field
        if (recordInfo.data.status === 'SUCCESS' && recordInfo.data.response?.sunoData && recordInfo.data.response.sunoData.length > 0) {
          // Use first song
          const song = recordInfo.data.response.sunoData[0];
          console.log('[Suno] Generation complete, audioUrl:', song.audioUrl);
          
          return {
            status: 'complete',
            audioUrl: song.audioUrl,
            videoUrl: '',
            imageUrl: song.imageUrl || '',
            errorMessage: undefined,
          };
        } else if (recordInfo.data.status === 'CREATE_TASK_FAILED' || recordInfo.data.status === 'GENERATE_AUDIO_FAILED' || recordInfo.data.status === 'CALLBACK_EXCEPTION' || recordInfo.data.status === 'SENSITIVE_WORD_ERROR') {
          return {
            status: 'error',
            audioUrl: '',
            videoUrl: '',
            imageUrl: '',
            errorMessage: recordInfo.data.errorMessage || `Generation failed: ${recordInfo.data.status}`,
          };
        } else {
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
      }
      
      // Format 2: MusicAPI Nuro format (flat object with task_id)
      if ('task_id' in data && 'status' in data) {
        const nuroData = data as MusicAPINuroResponse;
        console.log('[Suno] Using Nuro format, status:', nuroData.status);
        
        const status = nuroData.status === 'succeeded' ? 'complete' : 
                      nuroData.status === 'pending' ? 'streaming' :
                      nuroData.status === 'running' ? 'streaming' : 'error';
        
        return {
          status,
          audioUrl: nuroData.audio_url,
          videoUrl: '',
          imageUrl: '',
          errorMessage: undefined,
        };
      }
      
      // Format 3: MusicAPI Producer format (code + data array with clip_id)
      if ('code' in data && 'data' in data && Array.isArray(data.data) && data.data.length > 0 && 'clip_id' in data.data[0]) {
        const producerData = data as MusicAPIProducerResponse;
        console.log('[Suno] Using Producer format');
        
        if (producerData.code !== 200) {
          console.error('[Suno] API returned error code:', producerData.code, producerData.message);
          throw new Error(`Suno API error: ${producerData.message}`);
        }
        
        const clip = producerData.data[0];
        console.log('[Suno] Song state:', clip.state);
        
        const status = clip.state === 'succeeded' ? 'complete' :
                      clip.state === 'pending' ? 'streaming' :
                      clip.state === 'running' ? 'streaming' : 'error';
        
        return {
          status,
          audioUrl: clip.audio_url,
          videoUrl: clip.video_url || '',
          imageUrl: clip.image_url,
          errorMessage: undefined,
        };
      }
      
      // Format 4: Original Suno format (code + data array with id)
      if ('code' in data && 'data' in data && Array.isArray(data.data) && data.data.length > 0) {
        const sunoData = data as SunoStatusResponse;
        
        if (sunoData.code !== 200) {
          console.error('[Suno] API returned error code:', sunoData.code, sunoData.msg);
          throw new Error(`Suno API error: ${sunoData.msg}`);
        }
        
        const song = sunoData.data[0];
        console.log('[Suno] Song status:', song.status);
        
        return {
          status: song.status,
          audioUrl: song.audio_url,
          videoUrl: song.video_url,
          imageUrl: song.image_large_url || song.image_url,
          errorMessage: song.error_message,
        };
      }
      
      // Unknown format
      throw new Error(`Unknown response format: ${JSON.stringify(data).substring(0, 200)}`);
    } catch (error) {
      console.error('[Suno] Error checking endpoint', endpoint, ':', error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next endpoint
    }
  }
  
  // All endpoints failed
  throw new Error(
    `Failed to check song status. Tried ${endpoints.length} endpoints. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Please check your Suno API documentation for the correct endpoint.`
  );
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

