import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * GET /api/battle/has-archived
 * Check if there are any archived battles (completed battles with liveStartedAt)
 * Returns: { hasArchived: boolean }
 */
export async function GET() {
  try {
    // Query for any completed battle with liveStartedAt timestamp
    const result = await db
      .select({ id: battles.id })
      .from(battles)
      .where(
        and(
          eq(battles.status, "completed"),
          isNotNull(battles.liveStartedAt)
        )
      )
      .limit(1);

    return NextResponse.json({
      hasArchived: result.length > 0,
    });
  } catch (error) {
    console.error("[has-archived] Error checking for archived battles:", error);
    // Return false on error to gracefully degrade
    return NextResponse.json({ hasArchived: false });
  }
}

