import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeToOrigin } from "@/lib/url-utils";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/learn-more",
  "/roster",
  "/battle(.*)",
  "/profile(.*)",
  "/community",
  "/sign-in(.*)",
  "/api/webhooks(.*)", // Webhooks should be public
  "/api/battle(.*)", // Battle APIs (sync, etc) handle their own auth or are public
  "/api/user(.*)", // User APIs handle their own auth
]);

/**
 * Generate Content Security Policy at RUNTIME
 * 
 * SECURITY: This must be in middleware (not next.config.ts) because:
 * - next.config.ts is evaluated at BUILD time, baking in NODE_ENV
 * - Middleware runs at REQUEST time, using actual runtime environment
 * - This prevents dev CSP from being deployed to production (or vice versa)
 */
function generateCspHeader(): string {
  const isDev = process.env.NODE_ENV === "development";

  // Derive WebSocket URL from app URL for CSP
  // Normalize to remove trailing slashes before converting to WebSocket URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const normalizedAppUrl = appUrl ? normalizeToOrigin(appUrl) : "";
  // Convert HTTP(S) URL to WebSocket URL (wss:// for https://, ws:// for http://)
  const wsUrl = normalizedAppUrl
    ? normalizedAppUrl.startsWith("https://")
      ? normalizedAppUrl.replace("https://", "wss://")
      : normalizedAppUrl.replace("http://", "ws://")
    : "";

  const directives = [
    // Default to self only
    "default-src 'self'",
    // Scripts: self, Clerk, inline scripts (needed for Next.js), and eval ONLY in dev
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://*.clerk.com https://*.clerk.accounts.dev`,
    // Styles: self, inline styles (needed for dynamic styling), Clerk
    "style-src 'self' 'unsafe-inline' https://*.clerk.com",
    // Images: self, data URIs, Clerk, and blob URLs for generated content
    "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://images.clerk.dev https://*.sunoapi.org",
    // Fonts: self and data URIs
    "font-src 'self' data:",
    // Connect: self, Clerk APIs, WebSocket, and Suno API
    // SECURITY: localhost WebSocket origins only allowed in development
    `connect-src 'self' ${wsUrl} https://*.clerk.com https://*.clerk.accounts.dev wss://*.clerk.com https://api.sunoapi.org${isDev ? " ws://localhost:* wss://localhost:*" : ""}`,
    // Media: self and Suno audio URLs
    "media-src 'self' https://*.sunoapi.org https://*.suno.ai blob:",
    // Frames: self and Clerk (for auth popups)
    "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
    // Frame ancestors: self only (prevents clickjacking)
    "frame-ancestors 'self'",
    // Form actions: self only
    "form-action 'self'",
    // Base URI: self only
    "base-uri 'self'",
    // Object sources: none (prevents plugins like Flash)
    "object-src 'none'",
    // Upgrade insecure requests ONLY in production
    !isDev ? "upgrade-insecure-requests" : "",
  ];

  return directives.filter(Boolean).join("; ");
}

export default clerkMiddleware(async (auth, req) => {
  // Admin route protection is handled at the page level using checkRole()
  // This allows us to avoid database queries in middleware (Edge Runtime limitation)

  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Add CSP header to response (evaluated at runtime, not build time)
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", generateCspHeader());
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
