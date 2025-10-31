import type { NextConfig } from "next";

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
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
};

export default nextConfig;

