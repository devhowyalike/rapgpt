/**
 * Validation utilities for API routes
 */

import { NextResponse } from "next/server";
import { type ZodType, type z } from "zod";

/**
 * Validates request body against a Zod schema
 * Returns validated data or throws a response error
 */
export async function validateRequest<T extends ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      throw NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    return validation.data;
  } catch (error) {
    if (error instanceof NextResponse) {
      throw error;
    }
    throw NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }
}

/**
 * Validates data against a Zod schema
 * Returns validated data or null with error response
 */
export function validate<T extends ZodType>(
  data: unknown,
  schema: T,
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse } {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: validation.data };
}

/**
 * Creates a 403 Forbidden response for archived battles
 * Used when users try to comment or vote on completed/incomplete battles
 */
export function createArchivedBattleResponse(
  action: "comment" | "vote",
): Response {
  const actionText = action === "comment" ? "Comments are" : "Voting is";
  return new Response(
    JSON.stringify({ error: `${actionText} disabled for archived battles` }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}
