/**
 * Role-based access control utilities
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import type { Roles } from '@/types/globals';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if the current user has a specific role
 */
export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();
  
  return sessionClaims?.metadata?.role === role;
}

/**
 * Get the current authenticated user from the database
 */
export async function getCurrentUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  return dbUser || null;
}

/**
 * Get the current user's ID from Clerk session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  return userId;
}

/**
 * Require admin role - throw error if not admin
 */
export async function requireAdmin() {
  const userId = await requireAuth();
  const isAdmin = await checkRole('admin');
  
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return userId;
}

/**
 * Check if user owns a resource or is an admin
 */
export async function canManageResource(resourceOwnerId: string): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }

  // Admins can manage any resource
  if (user.role === 'admin') {
    return true;
  }

  // Users can only manage their own resources
  return user.id === resourceOwnerId;
}

