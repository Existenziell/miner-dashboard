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

/**
 * Return black or white for readable text on the given background hex.
 * Uses relative luminance (sRGB); threshold 0.45 so light accents get dark text.
 */
export function getContrastColor(hex) {
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#000000' : '#ffffff';
}
