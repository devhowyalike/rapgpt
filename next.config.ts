import type { NextConfig } from "next";

// Derive WebSocket URL from app URL for CSP
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
const wsUrl = appUrl ? appUrl.replace("https://", "wss://").replace("http://", "ws://") : "";

// Content Security Policy configuration
// Allows necessary resources while blocking potentially malicious content
const cspDirectives = [
  // Default to self only
  "default-src 'self'",
  // Scripts: self, Clerk, inline scripts (needed for Next.js), and eval in dev
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://*.clerk.com https://*.clerk.accounts.dev`,
  // Styles: self, inline styles (needed for dynamic styling), Clerk
  "style-src 'self' 'unsafe-inline' https://*.clerk.com",
  // Images: self, data URIs, Clerk, and blob URLs for generated content
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://images.clerk.dev https://*.sunoapi.org",
  // Fonts: self and data URIs
  "font-src 'self' data:",
  // Connect: self, Clerk APIs, WebSocket, and Suno API
  // Note: WebSocket URL derived from NEXT_PUBLIC_APP_URL since 'self' doesn't cover wss:
  `connect-src 'self' ${wsUrl} https://*.clerk.com https://*.clerk.accounts.dev wss://*.clerk.com https://api.sunoapi.org ws://localhost:* wss://localhost:*`,
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
  // Upgrade insecure requests in production
  process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

// Security headers for all responses
const securityHeaders = [
  {
    // Content Security Policy - restricts resource loading
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    // Prevent clickjacking attacks by disallowing embedding in frames
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    // Prevent MIME type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Enable XSS filter in older browsers
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Control how much referrer information is shared
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict powerful browser features
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    // Strict Transport Security - force HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
  compiler: {
    // Remove console.log/warn/info in production, but keep console.error
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
          exclude: ["error"],
        }
        : false,
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
