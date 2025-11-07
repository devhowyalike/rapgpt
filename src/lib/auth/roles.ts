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
 * Checks the database for the user's role
 */
export async function checkRole(role: Roles): Promise<boolean> {
  const { userId } = await auth();
  
  if (!userId) {
    return false;
  }
  
  // Check database for user role
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  
  if (!dbUser) {
    return false;
  }
  
  return dbUser.role === role;
}

/**
 * Check if a specific Clerk user ID has admin role
 */
export async function isAdmin(clerkUserId: string): Promise<boolean> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  
  return dbUser?.role === 'admin';
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

/**
 * Check if the current user can manage a battle (is owner or admin)
 * Returns authorization result with user data or error response
 */
export async function canManageBattle(battleId: string): Promise<
  | { authorized: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; isOwner: boolean; isAdmin: boolean }
  | { authorized: false; error: string; status: number }
> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      authorized: false,
      error: 'Forbidden: Access denied',
      status: 403,
    };
  }

  // Get battle record to check ownership
  const { battles } = await import('@/lib/db/schema');
  const battleRecord = await db.query.battles.findFirst({
    where: eq(battles.id, battleId),
  });

  if (!battleRecord) {
    return {
      authorized: false,
      error: 'Battle not found',
      status: 404,
    };
  }

  const isOwner = battleRecord.createdBy === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return {
      authorized: false,
      error: 'Forbidden: You can only control your own battles',
      status: 403,
    };
  }

  return {
    authorized: true,
    user,
    isOwner,
    isAdmin,
  };
}

