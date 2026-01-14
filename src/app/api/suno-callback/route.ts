/**
 * Callback endpoint for Suno API to notify when song generation is complete
 * 
 * SECURITY: This endpoint verifies callbacks using a secret token passed
 * as a query parameter when registering the callback URL with Suno.
 * 
 * Callback URL format: https://your-domain.com/api/suno-callback?token=SECRET
 */

import { NextResponse, NextRequest } from "next/server";
import { getBattleById, saveBattle } from "@/lib/battle-storage";

// SECURITY: Require SUNO_CALLBACK_SECRET in production
const SUNO_CALLBACK_SECRET = process.env.SUNO_CALLBACK_SECRET;

/**
 * Verify the callback token from query parameters
 */
function verifyCallbackToken(request: NextRequest): boolean {
  // In development without secret, allow requests but warn
  if (!SUNO_CALLBACK_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Suno Callback] SUNO_CALLBACK_SECRET not set in production!");
      return false;
    }
    console.warn("[Suno Callback] No callback secret configured, skipping verification");
    return true;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    console.warn("[Suno Callback] No token provided in callback request");
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  if (token.length !== SUNO_CALLBACK_SECRET.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ SUNO_CALLBACK_SECRET.charCodeAt(i);
  }

  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify callback authenticity
    if (!verifyCallbackToken(request)) {
      console.warn("[Suno Callback] Invalid or missing callback token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    console.log(
      "[Suno Callback] Received verified callback:",
      JSON.stringify(data, null, 2),
    );

    // The callback data structure might vary, log it to see what we get
    // Typical structure might be:
    // {
    //   code: 200,
    //   data: { taskId, status, audio_url, etc. },
    //   callbackType: 'complete'
    // }

    // For now, just log and return success
    // We'll implement the actual logic once we see the structure

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Suno Callback] Error processing callback:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 },
    );
  }
}
