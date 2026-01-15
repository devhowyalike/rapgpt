"use client";

import { useEffect } from "react";

/**
 * Next.js default image sizes configuration
 * imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
 * deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
 */

type ImageType = "fixed" | "fill";

interface PreloadConfig {
  /** Image source paths to preload */
  srcs: string[];
  /** 
   * Type of image:
   * - "fixed": Uses imageSizes (for images with explicit width/height)
   * - "fill": Uses deviceSizes (for responsive fill images)
   */
  type: ImageType;
  /** Base width for fixed images (will be adjusted for device pixel ratio) */
  baseWidth?: number;
  /** Image quality (default: 75) */
  quality?: number;
}

/**
 * Get the appropriate Next.js image width based on device characteristics
 */
function getOptimalWidth(type: ImageType, baseWidth?: number): number {
  const dpr = window.devicePixelRatio || 1;

  if (type === "fixed") {
    // For fixed-size images, scale by device pixel ratio
    // and round up to nearest Next.js imageSize
    const targetWidth = (baseWidth || 144) * dpr;
    const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
    return imageSizes.find((size) => size >= targetWidth) || 384;
  }

  // For fill images, use viewport width × dpr
  // and round up to nearest Next.js deviceSize
  const effectiveWidth = window.innerWidth * dpr;
  const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  return deviceSizes.find((size) => size >= effectiveWidth) || 1920;
}

/**
 * Generate a Next.js optimized image URL
 */
export function getNextImageUrl(
  src: string,
  width: number,
  quality = 75
): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/**
 * Hook to preload images using Next.js optimized URLs.
 * Automatically detects device characteristics and preloads at the appropriate size.
 *
 * @example
 * // Preload avatar images (fixed size)
 * usePreloadImages({
 *   srcs: personas.map(p => p.avatar),
 *   type: "fixed",
 *   baseWidth: 144
 * });
 *
 * @example
 * // Preload background images (fill/responsive)
 * usePreloadImages({
 *   srcs: stages.map(s => s.backgroundImage),
 *   type: "fill"
 * });
 */
export function usePreloadImages({
  srcs,
  type,
  baseWidth,
  quality = 75,
}: PreloadConfig): void {
  useEffect(() => {
    if (srcs.length === 0) return;

    const width = getOptimalWidth(type, baseWidth);

    for (const src of srcs) {
      const img = new window.Image();
      img.src = getNextImageUrl(src, width, quality);
    }
  }, [srcs, type, baseWidth, quality]);
}

/**
 * Imperatively preload images (for use outside React components)
 */
export function preloadImages(config: PreloadConfig): void {
  if (typeof window === "undefined") return;

  const { srcs, type, baseWidth, quality = 75 } = config;
  const width = getOptimalWidth(type, baseWidth);

  for (const src of srcs) {
    const img = new window.Image();
    img.src = getNextImageUrl(src, width, quality);
  }
}
