import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, battles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth/sync-user";

export async function PATCH() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await getOrCreateUser(clerkUserId);

    const newIsProfilePublic = !user.isProfilePublic;

    // Toggle the isProfilePublic field
    const updatedUser = await db
      .update(users)
      .set({
        isProfilePublic: newIsProfilePublic,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    // If making profile private, automatically unpublish all public battles
    if (!newIsProfilePublic) {
      await db
        .update(battles)
        .set({
          isPublic: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(battles.createdBy, user.id),
            eq(battles.isPublic, true)
          )
        );
    }

    return NextResponse.json({
      success: true,
      isProfilePublic: updatedUser[0].isProfilePublic,
    });
  } catch (error) {
    console.error("Error toggling profile privacy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

