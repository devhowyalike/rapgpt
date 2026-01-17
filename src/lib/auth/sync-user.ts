/**
 * Utility to sync Clerk user to database
 * Used as a fallback when webhooks haven't run yet
 * 
 * SECURITY: Admin role assignment is controlled by INITIAL_ADMIN_EMAIL env var
 * to prevent race conditions and unauthorized admin access.
 */

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { encrypt } from "./encryption";

/**
 * SECURITY: Determines if a user should be granted admin role
 * 
 * Priority order:
 * 1. If INITIAL_ADMIN_EMAIL is set, only that email gets admin (most secure)
 * 2. If INITIAL_ADMIN_EMAIL is not set, falls back to first-user-is-admin (dev convenience)
 * 
 * In production, ALWAYS set INITIAL_ADMIN_EMAIL to prevent unauthorized admin access.
 */
async function shouldBeAdmin(email: string): Promise<boolean> {
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;

  // If INITIAL_ADMIN_EMAIL is configured, use strict matching
  if (initialAdminEmail) {
    const isMatch = email.toLowerCase() === initialAdminEmail.toLowerCase();
    if (isMatch) {
      console.log(`[Auth] Admin role granted via INITIAL_ADMIN_EMAIL match: ${email}`);
    }
    return isMatch;
  }

  // Fallback: first user becomes admin (only if INITIAL_ADMIN_EMAIL not set)
  // This is less secure but convenient for development
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[SECURITY WARNING] INITIAL_ADMIN_EMAIL not set in production. " +
      "First user will become admin. Set INITIAL_ADMIN_EMAIL for explicit admin control."
    );
  }

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  const isFirstUser = existingUsers.length === 0;

  if (isFirstUser) {
    console.log(`[Auth] Admin role granted to first user: ${email}`);
  }

  return isFirstUser;
}

/**
 * Gets or creates a user in the database from Clerk
 * Returns the user from the database or creates one if it doesn't exist
 */
export async function getUserByClerkId(clerkUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  return user || null;
}

/**
 * Gets or creates a user in the database from Clerk
 * Returns the user from the database or creates one if it doesn't exist
 */
export async function getOrCreateUser(clerkUserId: string) {
  // First check if user exists in database
  const existingUser = await getUserByClerkId(clerkUserId);

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, fetch from Clerk and create
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("User not authenticated with Clerk");
  }

  // Get primary email
  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  );

  if (!primaryEmail) {
    throw new Error("No primary email found for user");
  }

  // SECURITY: Determine role based on INITIAL_ADMIN_EMAIL or first-user fallback
  const isAdmin = await shouldBeAdmin(primaryEmail.emailAddress);

  // Encrypt sensitive data
  const encryptedEmail = encrypt(primaryEmail.emailAddress);
  const fullName =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
  const encryptedName = fullName ? encrypt(fullName) : null;

  // Create user in database
  const newUser = {
    id: nanoid(),
    clerkId: clerkUser.id,
    username: clerkUser.username || null,
    encryptedEmail,
    encryptedName,
    encryptedDisplayName: encryptedName,
    imageUrl: clerkUser.imageUrl || null,
    role: isAdmin ? "admin" : "user",
    isProfilePublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(users).values(newUser);

  console.log(
    `✅ User synced from Clerk: ${clerkUser.id} (${isAdmin ? "Admin" : "User"})`,
  );

  return newUser;
}
