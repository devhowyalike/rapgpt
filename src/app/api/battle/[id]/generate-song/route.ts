/**
 * API endpoint for generating AI songs from battle verses
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { getBattleById, saveBattle } from "@/lib/battle-storage";
import { logError, logErrorWithContext } from "@/lib/error-utils";
import type { SongGenerationBeatStyle } from "@/lib/shared/battle-types";
import { generateSong } from "@/lib/suno/client";
import { recordSongCreationUsage } from "@/lib/usage-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 },
      );
    }

    // Get internal database user ID
    const dbUser = await getOrCreateUser(clerkUserId);
    const dbUserId = dbUser.id;

    const { id } = await params;

    // Get the battle
    const battle = await getBattleById(id);
    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = sessionClaims?.metadata?.role === "admin";

    // Validate user is battle creator OR admin
    // Admins can generate songs for any battle (including legacy battles without creators)
    const isCreator = battle.creator?.userId === dbUserId;
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Only the battle creator or an admin can generate songs" },
        { status: 403 },
      );
    }

    // Validate battle is completed
    if (battle.status !== "completed") {
      return NextResponse.json(
        { error: "Can only generate songs for completed battles" },
        { status: 400 },
      );
    }

    // Check if song already exists AND is complete
    // Allow retrying if song generation was started but didn't complete (has taskId but no audioUrl)
    if (battle.generatedSong?.audioUrl) {
      return NextResponse.json(
        { error: "Song already generated for this battle" },
        { status: 400 },
      );
    }

    // If there's an incomplete song, we can resume with the existing taskId
    const existingTaskId = battle.generatedSong?.sunoTaskId;
    if (existingTaskId) {
      console.log(
        "[API] Found existing incomplete song with taskId:",
        existingTaskId,
      );
      // Return the existing taskId so client can resume polling
      return NextResponse.json({
        success: true,
        taskId: existingTaskId,
        status: "processing",
        message: "Resuming song generation. Polling for completion...",
        isResume: true,
      });
    }

    // Parse request body
    const body = await request.json();
    const { beatStyle } = body as { beatStyle: SongGenerationBeatStyle };

    // Validate beat style
    if (!beatStyle || !["g-funk", "boom-bap", "trap"].includes(beatStyle)) {
      return NextResponse.json(
        { error: "Invalid beat style. Must be: g-funk, boom-bap, or trap" },
        { status: 400 },
      );
    }

    // Validate battle has verses
    if (battle.verses.length === 0) {
      return NextResponse.json(
        { error: "Battle has no verses to generate song from" },
        { status: 400 },
      );
    }

    // Generate song using Suno API
    console.log(
      "[API] Starting song generation for battle:",
      id,
      "with beat style:",
      beatStyle,
    );
    console.log("[API] Battle has", battle.verses.length, "verses");

    let taskId: string;
    try {
      const result = await generateSong(battle, beatStyle);
      taskId = result.taskId;
      console.log(
        "[API] Song generation started successfully. TaskId:",
        taskId,
      );

      // Record song creation usage (Suno credits)
      // Standard Suno generation typically costs 10 credits
      try {
        await recordSongCreationUsage({
          id: crypto.randomUUID(),
          battleId: id,
          provider: "suno",
          credits: 10,
          status: "completed",
        });
        console.log("[API] Recorded song creation usage for battle:", id);
      } catch (usageError) {
        // Log but don't fail the request if usage recording fails
        logError("API Song Usage", usageError);
      }
    } catch (error) {
      logErrorWithContext("API Song Generation", error, { battleId: id, beatStyle });
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Failed to start song generation: ${error.message}`
              : "Failed to start song generation",
        },
        { status: 500 },
      );
    }

    // Save initial song data with taskId so we can track it
    const partialSong = {
      audioUrl: "", // Will be filled when complete
      videoUrl: "",
      imageUrl: "",
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
      status: "processing",
      message: "Song generation started. Polling for completion...",
    });
  } catch (error) {
    logError("API Song Generation", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
