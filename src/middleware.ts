import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/archive',
  '/battle(.*)',
  '/profile(.*)',
  '/community',
  '/sign-in(.*)',
  '/api/webhooks(.*)', // Webhooks should be public
  '/api/battle(.*)/comment', // Comment routes handle their own auth
  '/api/battle(.*)/vote', // Vote routes handle their own auth
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Protect admin routes with role check
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    
    if (!userId) {
      const url = new URL('/', req.url);
      return NextResponse.redirect(url);
    }

    // Check database for admin role
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });
    
    if (!user || user.role !== 'admin') {
      const url = new URL('/', req.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

