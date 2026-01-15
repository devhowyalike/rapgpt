/**
 * Utilities for deriving display names from user data
 * Priority: username > displayName > firstName+lastName > fallback
 */

import { decrypt } from "@/lib/auth/encryption";

/**
 * Clerk user shape for display name extraction (subset of UserResource)
 */
interface ClerkUserForDisplayName {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Get display name from a Clerk user object (client-side)
 */
export function getDisplayNameFromClerkUser(
  user: ClerkUserForDisplayName | null | undefined,
  fallback = "User"
): string {
  if (!user) return fallback;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return user.username || fullName || fallback;
}

/**
 * Database user shape for display name extraction
 */
export interface DbUserForDisplayName {
  username?: string | null;
  encryptedDisplayName?: string | null;
  encryptedName?: string | null;
}

/**
 * Get display name from a database user record (server-side)
 * Handles decryption of encrypted fields
 */
export function getDisplayNameFromDbUser(
  user: DbUserForDisplayName | null | undefined,
  fallback = "Anonymous"
): string {
  if (!user) return fallback;

  // Priority: username > encryptedDisplayName > encryptedName > fallback
  if (user.username) {
    return user.username;
  }

  if (user.encryptedDisplayName) {
    try {
      return decrypt(user.encryptedDisplayName);
    } catch {
      // Fall through to next option
    }
  }

  if (user.encryptedName) {
    try {
      return decrypt(user.encryptedName);
    } catch {
      // Fall through to fallback
    }
  }

  return fallback;
}
