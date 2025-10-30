/**
 * User Deletion API
 * Allows admins to delete users and all their associated data
 * Deletes from both database and Clerk
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { users, battles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, getCurrentUser } from '@/lib/auth/roles';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const { userId } = await params;
    
    // Get current admin user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent admins from deleting themselves
    if (currentUser.id === userId) {
      return new Response(JSON.stringify({ 
        error: 'You cannot delete your own account' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the user to be deleted
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userToDelete) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete all battles created by this user first
    // (comments and votes will cascade delete automatically via foreign key constraints)
    await db.delete(battles).where(eq(battles.createdBy, userId));

    // Delete the user from database (this will cascade delete comments and votes they created)
    await db.delete(users).where(eq(users.id, userId));

    // Delete the user from Clerk
    // This ensures they cannot sign back in
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userToDelete.clerkId);
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError);
      // Note: User is already deleted from DB, so we log but don't fail the request
      // The admin may need to manually delete from Clerk dashboard if this fails
    }

    // Revalidate pages
    revalidatePath('/admin/dashboard');
    revalidatePath('/community');
    revalidatePath(`/profile/${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'User deleted from database and Clerk successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return new Response(JSON.stringify({ 
          error: error.message 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to delete user' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

