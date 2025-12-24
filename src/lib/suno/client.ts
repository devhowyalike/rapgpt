/**
 * Suno API Client for AI Music Generation
 * Documentation: https://docs.sunoapi.org
 */

import type {
  Battle,
  Persona,
  SongGenerationBeatStyle,
} from "@/lib/shared/battle-types";
import { ROUNDS_PER_BATTLE } from "@/lib/shared/battle-types";

const SUNO_API_BASE_URL =
  process.env.SUNO_API_BASE_URL || "https://api.sunoapi.org";
const SUNO_API_KEY = process.env.SUNO_API_KEY;

interface SunoCreditsResponse {
  code: number;
  msg: string;
  data: number; // Credits remaining
}

/**
 * Get remaining credits from Suno API account
 * Documentation: https://docs.sunoapi.org/suno-api/get-remaining-credits
 */
export async function getSunoCredits(): Promise<{ credits: number; error?: string }> {
  if (!SUNO_API_KEY) {
    return { credits: 0, error: "SUNO_API_KEY is not configured" };
  }

  try {
    const response = await fetch(`${SUNO_API_BASE_URL}/api/v1/generate/credit`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Suno] Error fetching credits:", error);
      return { credits: 0, error: `API error: ${response.status}` };
    }

    const data = (await response.json()) as SunoCreditsResponse;
    
    if (data.code !== 200) {
      return { credits: 0, error: data.msg };
    }

    console.log("[Suno] Credits remaining:", data.data);
    return { credits: data.data };
  } catch (error) {
    console.error("[Suno] Error fetching credits:", error);
    return { credits: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

interface SunoGenerateRequest {
  prompt: string;
  style: string;
  title: string;
  customMode: boolean;
  instrumental: boolean;
  model: "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5";
  callBackUrl?: string;
  vocalGender?: "m" | "f";
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
    status:
      | "PENDING"
      | "TEXT_SUCCESS"
      | "FIRST_SUCCESS"
      | "SUCCESS"
      | "CREATE_TASK_FAILED"
      | "GENERATE_AUDIO_FAILED"
      | "CALLBACK_EXCEPTION"
      | "SENSITIVE_WORD_ERROR";
    type?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  };
}

/**
 * Beat style to music prompt mapping
 */
const BEAT_STYLE_PROMPTS: Record<SongGenerationBeatStyle, string> = {
  "g-funk":
    "West Coast G-Funk hip-hop, smooth funky basslines, synthesizer leads, laid-back groove, 90s California rap style",
  "boom-bap":
    "90s East Coast boom bap hip-hop, hard-hitting drums, jazz samples, classic breakbeats, underground rap style",
  trap: "Modern trap hip-hop, heavy 808 bass, rapid hi-hats, Atlanta sound, contemporary rap style",
};

/**
 * Format battle verses into Suno-compatible lyrics
 */
export function formatLyricsForSuno(battle: Battle): string {
  const lyrics: string[] = [];

  // Group verses by round
  for (let round = 1; round <= ROUNDS_PER_BATTLE; round++) {
    const roundVerses = battle.verses.filter((v) => v.round === round);

    if (roundVerses.length > 0) {
      lyrics.push(`[Round ${round}]`);

      // Add verses in order (player1 then player2)
      const player1Verse = roundVerses.find(
        (v) => v.personaId === battle.personas.player1.id,
      );
      const player2Verse = roundVerses.find(
        (v) => v.personaId === battle.personas.player2.id,
      );

      if (player1Verse) {
        lyrics.push(`[${battle.personas.player1.name}]`);
        lyrics.push(player1Verse.fullText);
        lyrics.push("");
      }

      if (player2Verse) {
        lyrics.push(`[${battle.personas.player2.name}]`);
        lyrics.push(player2Verse.fullText);
        lyrics.push("");
      }
    }
  }

  const formatted = lyrics.join("\n");
  console.log("[Suno] Formatted lyrics:", {
    length: formatted.length,
    totalVerses: battle.verses.length,
    preview: formatted.substring(0, 200) + "...",
  });

  return formatted;
}

/**
 * Determine vocal gender for song generation based on battle personas
 * If both personas have the same gender, use it
 * If mixed gender battle, prefer undefined to let the API handle variation
 */
function determineVocalGender(
  player1Persona: Persona,
  player2Persona: Persona,
): "m" | "f" | undefined {
  const player1Gender = player1Persona.vocalGender;
  const player2Gender = player2Persona.vocalGender;

  // If both personas have the same gender preference, use it
  if (player1Gender && player2Gender && player1Gender === player2Gender) {
    return player1Gender;
  }

  // Mixed gender battle - let API handle the variation naturally
  // or if one is defined and the other isn't, use the defined one
  if (player1Gender && !player2Gender) return player1Gender;
  if (player2Gender && !player1Gender) return player2Gender;

  // Let the API decide naturally for mixed gender battles
  return undefined;
}

/**
 * Build song generation prompt combining persona styles and beat selection
 * Uses musicStyleDescription when available to avoid copyrighted artist names
 */
export function buildSongPrompt(
  player1Persona: Persona,
  player2Persona: Persona,
  beatStyle: SongGenerationBeatStyle,
): string {
  const beatPrompt = BEAT_STYLE_PROMPTS[beatStyle];

  // Use detailed music style descriptions if available, otherwise fall back to basic style field
  const styleDescriptions: string[] = [];

  if (player1Persona.musicStyleDescription) {
    styleDescriptions.push(player1Persona.musicStyleDescription);
  } else if (player1Persona.style) {
    styleDescriptions.push(player1Persona.style);
  }

  if (player2Persona.musicStyleDescription) {
    styleDescriptions.push(player2Persona.musicStyleDescription);
  } else if (player2Persona.style) {
    styleDescriptions.push(player2Persona.style);
  }

  // Create a combined prompt with descriptive characteristics
  const styleDescription =
    styleDescriptions.length > 0
      ? `featuring ${styleDescriptions.join(" contrasted with ")}, `
      : "";

  const prompt = `${beatPrompt}, ${styleDescription}rap battle format, energetic delivery, clear vocals, competitive back-and-forth flow`;
  console.log("[Music Generation] Built style prompt:", {
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
  beatStyle: SongGenerationBeatStyle,
): Promise<{ taskId: string; status: string }> {
  if (!SUNO_API_KEY) {
    throw new Error("SUNO_API_KEY is not configured");
  }

  const lyrics = formatLyricsForSuno(battle);
  const style = buildSongPrompt(
    battle.personas.player1,
    battle.personas.player2,
    beatStyle,
  );
  const title = `${battle.title} - ${beatStyle.toUpperCase()} Battle`;
  const vocalGender = determineVocalGender(
    battle.personas.player1,
    battle.personas.player2,
  );

  const requestBody: SunoGenerateRequest = {
    prompt: lyrics,
    style: style,
    title: title,
    customMode: true,
    instrumental: false,
    model: "V4_5", // V4.5 model - good balance of quality and speed
    callBackUrl: "https://example.com/callback", // Dummy callback - we poll instead
    vocalGender: vocalGender,
  };

  console.log("[Suno] Generating song with request:", {
    url: `${SUNO_API_BASE_URL}/api/v1/generate`,
    prompt_length: lyrics.length,
    style_length: style.length,
    title_length: title.length,
    model: requestBody.model,
    vocalGender: requestBody.vocalGender,
  });

  const response = await fetch(`${SUNO_API_BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUNO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("[Suno] Response status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error("[Suno] Error response:", error);
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as SunoGenerateResponse;
  console.log("[Suno] Response data:", data);

  if (data.code !== 200) {
    console.error("[Suno] API returned error code:", data.code, data.msg);
    throw new Error(`Suno API error: ${data.msg}`);
  }

  return {
    taskId: data.data.taskId,
    status: "queued",
  };
}

/**
 * Check the status of a song generation task using the official endpoint
 * Documentation: https://docs.sunoapi.org/suno-api/get-music-generation-details
 */
export async function checkSongStatus(taskId: string): Promise<{
  status: "streaming" | "complete" | "error";
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  errorMessage?: string;
}> {
  if (!SUNO_API_KEY) {
    throw new Error("SUNO_API_KEY is not configured");
  }

  const url = `${SUNO_API_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`;
  console.log("[Suno] Checking status:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SUNO_API_KEY}`,
    },
  });

  console.log("[Suno] Status response:", {
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Suno] Error response:", error);
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as SunoRecordInfoResponse;
  console.log("[Suno] Status data:", {
    status: data.data.status,
    taskId: data.data.taskId,
  });

  if (data.code !== 200) {
    throw new Error(`Suno API error: ${data.msg}`);
  }

  // Check status field
  if (
    data.data.status === "SUCCESS" &&
    data.data.response?.sunoData &&
    data.data.response.sunoData.length > 0
  ) {
    // Use first song
    const song = data.data.response.sunoData[0];
    console.log("[Suno] Generation complete, audioUrl:", song.audioUrl);

    return {
      status: "complete",
      audioUrl: song.audioUrl,
      videoUrl: "",
      imageUrl: song.imageUrl || "",
      errorMessage: undefined,
    };
  }

  if (
    data.data.status === "CREATE_TASK_FAILED" ||
    data.data.status === "GENERATE_AUDIO_FAILED" ||
    data.data.status === "CALLBACK_EXCEPTION" ||
    data.data.status === "SENSITIVE_WORD_ERROR"
  ) {
    return {
      status: "error",
      audioUrl: "",
      videoUrl: "",
      imageUrl: "",
      errorMessage:
        data.data.errorMessage || `Generation failed: ${data.data.status}`,
    };
  }

  // Still in progress (PENDING, TEXT_SUCCESS, FIRST_SUCCESS)
  console.log("[Suno] Generation in progress");
  return {
    status: "streaming",
    audioUrl: "",
    videoUrl: "",
    imageUrl: "",
    errorMessage: undefined,
  };
}
