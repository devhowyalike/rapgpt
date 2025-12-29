import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/learn-more",
  "/battle(.*)",
  "/profile(.*)",
  "/community",
  "/sign-in(.*)",
  "/api/webhooks(.*)", // Webhooks should be public
  "/api/battle(.*)", // Battle APIs (sync, etc) handle their own auth or are public
  "/api/user(.*)", // User APIs handle their own auth
]);

export default clerkMiddleware(async (auth, req) => {
  // Admin route protection is handled at the page level using checkRole()
  // This allows us to avoid database queries in middleware (Edge Runtime limitation)

  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
