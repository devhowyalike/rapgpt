import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { getDisplayNameFromDbUser } from "@/lib/get-display-name";
import { isBattleArchived } from "@/lib/battle-engine";
import { getBattleById, saveBattle } from "@/lib/battle-storage";
import { db } from "@/lib/db/client";
import { comments } from "@/lib/db/schema";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { commentRequestSchema } from "@/lib/validations/battle";
import { createArchivedBattleResponse } from "@/lib/validations/utils";
import { broadcastEvent } from "@/lib/websocket/broadcast-helper";
import type { CommentAddedEvent } from "@/lib/websocket/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: You must be signed in to comment",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      `comment:${clerkUserId}`,
      RATE_LIMITS.comment
    );
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Get or create user from database (syncs from Clerk if needed)
    const user = await getOrCreateUser(clerkUserId);

    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const validation = commentRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { content, round } = validation.data;

    const battle = await getBattleById(id);

    if (!battle) {
      return new Response(JSON.stringify({ error: "Battle not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prevent comments on archived battles
    if (isBattleArchived(battle)) {
      return createArchivedBattleResponse("comment");
    }

    // Get display name for comment
    const username = getDisplayNameFromDbUser(user);

    // Insert comment into database
    const commentId = nanoid();
    await db.insert(comments).values({
      id: commentId,
      battleId: id,
      userId: user.id,
      content,
      round: round || null,
    });

    // Create the comment object with user info
    const comment = {
      id: commentId,
      username,
      content,
      timestamp: Date.now(),
      round,
      userId: user.id,
      imageUrl: user.imageUrl,
    };

    // Add comment to battle's comments array and save
    battle.comments.push(comment);
    battle.updatedAt = Date.now();
    await saveBattle(battle);

    // Broadcast comment event if battle is live
    if (battle.isLive) {
      await broadcastEvent(id, {
        type: "comment:added",
        battleId: id,
        timestamp: Date.now(),
        comment,
      } as CommentAddedEvent);
    }

    // Revalidate the battle page to show fresh data
    revalidatePath(`/battle/${id}`);

    return new Response(JSON.stringify({ success: true, comment }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    return new Response(JSON.stringify({ error: "Failed to submit comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
