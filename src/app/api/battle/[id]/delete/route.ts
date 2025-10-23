/**
 * Battle Deletion API
 * Allows users to delete their own battles and admins to delete any battle
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { battles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: You must be signed in to delete battles' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await params;

    // Get the battle
    const battle = await db.query.battles.findFirst({
      where: eq(battles.id, id),
    });

    if (!battle) {
      return new Response(JSON.stringify({ 
        error: 'Battle not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authorization: user must own the battle OR be an admin
    const isOwner = battle.createdBy === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden: You do not have permission to delete this battle' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the battle (will cascade to comments and votes)
    await db.delete(battles).where(eq(battles.id, id));

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/archive');
    revalidatePath('/my-battles');
    revalidatePath('/admin/dashboard');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Battle deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting battle:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete battle' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

