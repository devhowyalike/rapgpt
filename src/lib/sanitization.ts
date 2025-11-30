/**
 * Text sanitization utilities for user-generated content
 * Protects against XSS attacks by stripping HTML tags and scripts
 */

import sanitizeHtml from "sanitize-html";

/**
 * Strips all HTML tags and scripts from text
 * Uses sanitize-html library configured for plain text only
 * Returns safe plain text suitable for display
 *
 * @param text - User input text that may contain HTML/scripts
 * @returns Sanitized plain text with all HTML removed
 *
 * @example
 * sanitizeText('<script>alert("xss")</script>Hello') // Returns: 'Hello'
 * sanitizeText('Hello <b>World</b>') // Returns: 'Hello World'
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {}, // Strip all attributes
    disallowedTagsMode: "discard", // Remove tags completely
  });
}
