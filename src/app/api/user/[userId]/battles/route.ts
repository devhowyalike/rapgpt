import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkRole } from "@/lib/auth/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user is admin
    const isAdmin = await checkRole("admin");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Fetch all battles created by this user
    const userBattles = await db
      .select()
      .from(battles)
      .where(eq(battles.createdBy, userId))
      .orderBy(desc(battles.createdAt));

    return NextResponse.json({ battles: userBattles });
  } catch (error) {
    console.error("Error fetching user battles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user battles" },
      { status: 500 }
    );
  }
}

