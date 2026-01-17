import type { NextConfig } from "next";

/**
 * Security headers for all responses
 * 
 * NOTE: Content-Security-Policy is NOT included here because it requires
 * runtime evaluation of NODE_ENV. CSP is set in middleware.ts instead.
 * See: src/middleware.ts generateCspHeader()
 */
const securityHeaders = [
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
