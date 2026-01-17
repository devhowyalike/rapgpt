/**
 * URL utilities for consistent URL handling across the application
 */

/**
 * Normalize a URL to origin format (scheme://host[:port])
 * 
 * Browser Origin headers never include paths or trailing slashes.
 * Use this when comparing URLs against Origin headers or building
 * origin allowlists.
 * 
 * @example
 * normalizeToOrigin("https://example.com/") // "https://example.com"
 * normalizeToOrigin("https://example.com/path") // "https://example.com"
 * normalizeToOrigin("http://localhost:3000/") // "http://localhost:3000"
 */
export function normalizeToOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    // If URL parsing fails, fall back to manual cleanup
    return url.replace(/\/+$/, "");
  }
}
