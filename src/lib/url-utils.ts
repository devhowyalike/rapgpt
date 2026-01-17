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
 * SECURITY: Returns empty string for invalid URLs to prevent injection attacks.
 * Invalid URLs could contain CSP directive separators (;) or other special
 * characters that would be dangerous if passed through to security headers.
 * 
 * @example
 * normalizeToOrigin("https://example.com/") // "https://example.com"
 * normalizeToOrigin("https://example.com/path") // "https://example.com"
 * normalizeToOrigin("http://localhost:3000/") // "http://localhost:3000"
 * normalizeToOrigin("invalid; script-src *") // "" (prevents injection)
 */
export function normalizeToOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    // SECURITY: Return empty string for invalid URLs
    // DO NOT fall back to the original input - it may contain
    // CSP injection payloads like "; script-src *"
    console.warn(`[URL Utils] Invalid URL rejected: "${url.substring(0, 50)}..."`);
    return "";
  }
}
