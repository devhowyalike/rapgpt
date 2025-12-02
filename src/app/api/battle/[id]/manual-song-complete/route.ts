/**
 * API endpoint for manually completing song generation
 * Used when polling times out but song is available on Suno dashboard
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBattleById, saveBattle } from "@/lib/battle-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Get the battle
    const battle = await getBattleById(id);
    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    // Check if user is admin (manual completion is admin-only for security)
    const isAdmin = sessionClaims?.metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Manual song completion is restricted to administrators" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { audioUrl, taskId } = body as { audioUrl: string; taskId: string };

    // Validate inputs
    if (!audioUrl || !taskId) {
      return NextResponse.json(
        { error: "Missing audioUrl or taskId" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(audioUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid audio URL format" },
        { status: 400 },
      );
    }

    // Check if song exists and matches the taskId
    if (!battle.generatedSong || battle.generatedSong.sunoTaskId !== taskId) {
      return NextResponse.json(
        { error: "No matching song generation found for this task ID" },
        { status: 400 },
      );
    }

    // Update the song with the provided audio URL
    const completedSong = {
      ...battle.generatedSong,
      audioUrl,
      generatedAt: Date.now(),
    };

    await saveBattle({
      ...battle,
      generatedSong: completedSong,
    });

    console.log("[API] Song manually completed for battle:", id);

    return NextResponse.json({
      success: true,
      song: completedSong,
    });
  } catch (error) {
    console.error("Error manually completing song:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete song",
      },
      { status: 500 },
    );
  }
}
