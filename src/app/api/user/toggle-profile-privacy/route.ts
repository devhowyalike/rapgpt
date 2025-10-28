import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth/sync-user";

export async function PATCH() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await getOrCreateUser(clerkUserId);

    // Toggle the isProfilePublic field
    const updatedUser = await db
      .update(users)
      .set({
        isProfilePublic: !user.isProfilePublic,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

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

