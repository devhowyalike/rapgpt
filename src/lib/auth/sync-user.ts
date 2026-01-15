/**
 * Utility to sync Clerk user to database
 * Used as a fallback when webhooks haven't run yet
 */

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { encrypt } from "./encryption";

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

  // Check if this is the first user (they become admin)
  const existingUsers = await db.select().from(users);
  const isFirstUser = existingUsers.length === 0;

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
    role: isFirstUser ? "admin" : "user",
    isProfilePublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(users).values(newUser);

  console.log(
    `✅ User synced from Clerk: ${clerkUser.id} (${isFirstUser ? "Admin" : "User"})`,
  );

  return newUser;
}
