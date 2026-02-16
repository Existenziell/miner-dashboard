/**
 * Shared hex color validation for server (config API) and client (appearance, forms).
 * Single source of truth for "is this a valid 3- or 6-digit hex color (optional #)".
 */

/** Matches optional # followed by 3 or 6 hex digits. */
export const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Returns true if value is a non-empty string that matches a valid hex color.
 * Empty or whitespace-only strings return false.
 */
export function isValidHexColor(value) {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  return s.length > 0 && HEX_COLOR_REGEX.test(s);
}
