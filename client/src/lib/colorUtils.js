/**
 * Normalize 3- or 6-digit hex to #rrggbb. Invalid input returns defaultHex.
 */
export function normalizeHex(value, defaultHex = '#d946ef') {
  const s = String(value ?? '').trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[0] + s[0], g = s[1] + s[1], b = s[2] + s[2];
    return `#${r}${g}${b}`;
  }
  return defaultHex;
}

/** Hex with alpha (alpha 0–1). Returns #rrggbbaa. */
export function hexWithAlpha(hex, alpha) {
  const n = Math.round(alpha * 255);
  const a = n.toString(16).padStart(2, '0');
  return hex.slice(0, 7) + a;
}
