/**
 * User Deletion API
 * Allows admins to delete users and all their associated data
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    // Delete the user (this will cascade delete comments and votes they created)
    await db.delete(users).where(eq(users.id, userId));

    // Revalidate pages
    revalidatePath('/admin/dashboard');
    revalidatePath('/community');
    revalidatePath(`/profile/${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'User and all associated data deleted successfully'
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

