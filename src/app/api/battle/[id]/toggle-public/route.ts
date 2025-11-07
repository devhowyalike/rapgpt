import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth/sync-user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await getOrCreateUser(clerkUserId);
    const { id: battleId } = await params;

    // Find the battle and verify ownership
    const battle = await db.query.battles.findFirst({
      where: and(eq(battles.id, battleId), eq(battles.createdBy, user.id)),
    });

    if (!battle) {
      return NextResponse.json(
        { error: "Battle not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Prevent publishing paused battles (not yet completed)
    if (!battle.isPublic && battle.status === "paused") {
      return NextResponse.json(
        { error: "Cannot publish paused battles. Complete the battle first." },
        { status: 400 }
      );
    }

    // Prevent publishing battles if user profile is private
    if (!battle.isPublic && !user.isProfilePublic) {
      return NextResponse.json(
        { error: "Cannot publish battles with a private profile. Make your profile public first." },
        { status: 400 }
      );
    }

    // Toggle the isPublic field
    const updatedBattle = await db
      .update(battles)
      .set({
        isPublic: !battle.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(battles.id, battleId))
      .returning();

    return NextResponse.json({
      success: true,
      isPublic: updatedBattle[0].isPublic,
    });
  } catch (error) {
    console.error("Error toggling battle public status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

