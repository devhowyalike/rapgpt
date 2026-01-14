/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production with multiple instances, consider using Upstash Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Don't block process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists or window has expired, create new entry
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if rate limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limit response for API routes
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = result.retryAfterMs
    ? Math.ceil(result.retryAfterMs / 1000)
    : 60;

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

/**
 * Helper to get client identifier from request
 * Uses IP address from headers (behind proxy) or falls back to a default
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests (more reliable)
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated, take the first (client) IP
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback (shouldn't happen in production)
  return "ip:unknown";
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Expensive AI generation - strict limit
  generateVerse: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  // Battle creation
  createBattle: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 battles per minute
  },
  // Voting
  vote: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 votes per minute
  },
  // Commenting
  comment: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 comments per minute
  },
  // Song generation (very expensive)
  generateSong: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 3 songs per 5 minutes
  },
} as const;
