/**
 * Error handling utilities for safe logging and responses
 * 
 * SECURITY: These utilities prevent sensitive data from leaking into logs
 * by sanitizing error objects before logging.
 */

/**
 * Fields that should never be logged (case-insensitive matching)
 */
const SENSITIVE_FIELDS = [
  "password",
  "secret",
  "token",
  "key",
  "auth",
  "credential",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "session",
  "jwt",
  "bearer",
  "private",
  "encryption",
];

/**
 * Check if a key name suggests sensitive data
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));
}

/**
 * Recursively sanitize an object, redacting sensitive fields
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return "[MAX_DEPTH]";

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Redact strings that look like tokens/keys (long alphanumeric strings)
    if (obj.length > 32 && /^[a-zA-Z0-9_\-+/=]+$/.test(obj)) {
      return "[REDACTED]";
    }
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Extract safe error information for logging
 * Removes potentially sensitive data like stack traces in production
 */
export function getSafeErrorInfo(error: unknown): {
  message: string;
  name: string;
  code?: string;
  stack?: string;
} {
  const isDev = process.env.NODE_ENV !== "production";

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      code: (error as Error & { code?: string }).code,
      // Only include stack in development
      stack: isDev ? error.stack : undefined,
    };
  }

  if (typeof error === "string") {
    return { message: error, name: "Error" };
  }

  if (typeof error === "object" && error !== null) {
    const sanitized = sanitizeObject(error) as Record<string, unknown>;
    return {
      message: String(sanitized.message || "Unknown error"),
      name: String(sanitized.name || "Error"),
      code: sanitized.code ? String(sanitized.code) : undefined,
    };
  }

  return { message: "Unknown error", name: "Error" };
}

/**
 * Log an error safely, redacting sensitive information
 * Use this instead of console.error when logging request/response errors
 */
export function logError(context: string, error: unknown): void {
  const safeInfo = getSafeErrorInfo(error);
  
  if (process.env.NODE_ENV === "production") {
    // In production, log minimal info
    console.error(`[${context}] ${safeInfo.name}: ${safeInfo.message}`);
  } else {
    // In development, log more details including stack
    console.error(`[${context}] Error:`, safeInfo);
  }
}

/**
 * Log an error with additional context data, sanitizing sensitive fields
 */
export function logErrorWithContext(
  context: string,
  error: unknown,
  additionalContext?: Record<string, unknown>
): void {
  const safeInfo = getSafeErrorInfo(error);
  const sanitizedContext = additionalContext
    ? sanitizeObject(additionalContext)
    : undefined;

  if (process.env.NODE_ENV === "production") {
    console.error(
      `[${context}] ${safeInfo.name}: ${safeInfo.message}`,
      sanitizedContext ? JSON.stringify(sanitizedContext) : ""
    );
  } else {
    console.error(`[${context}] Error:`, safeInfo);
    if (sanitizedContext) {
      console.error(`[${context}] Context:`, sanitizedContext);
    }
  }
}

/**
 * Create a safe error response for API routes
 * Never exposes internal error details to clients
 */
export function createErrorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}
