import { describe, expect, it } from 'vitest';
import {
  isValidHex,
  normalizeHex,
  hexWithAlpha,
  getContrastColor,
  CONTRAST_THRESHOLD_DEFAULT,
  CONTRAST_THRESHOLD_TOGGLE,
} from '@/lib/colorUtils.js';

describe('isValidHex', () => {
  it('returns true for valid 3-digit hex', () => {
    expect(isValidHex('abc')).toBe(true);
    expect(isValidHex('#f00')).toBe(true);
    expect(isValidHex('  #abc  ')).toBe(true);
  });

  it('returns true for valid 6-digit hex', () => {
    expect(isValidHex('ffffff')).toBe(true);
    expect(isValidHex('#d946ef')).toBe(true);
    expect(isValidHex('  #06b6d4  ')).toBe(true);
  });

  it('coerces value to string (trims and validates)', () => {
    expect(isValidHex(0)).toBe(false);
    expect(isValidHex(null)).toBe(false);
    expect(isValidHex(undefined)).toBe(false);
  });

  it('returns false for invalid hex strings', () => {
    expect(isValidHex('')).toBe(false);
    expect(isValidHex('ab')).toBe(false);
    expect(isValidHex('ggg')).toBe(false);
    expect(isValidHex('abcd')).toBe(false);
  });
});

describe('normalizeHex', () => {
  it('returns #rrggbb for 6-digit hex', () => {
    expect(normalizeHex('ffffff')).toBe('#ffffff');
    expect(normalizeHex('#d946ef')).toBe('#d946ef');
    expect(normalizeHex('  abcdef  ')).toBe('#abcdef');
  });

  it('expands 3-digit hex to 6-digit', () => {
    expect(normalizeHex('fff')).toBe('#ffffff');
    expect(normalizeHex('#f00')).toBe('#ff0000');
    expect(normalizeHex('abc')).toBe('#aabbcc');
  });

  it('returns defaultHex for invalid input', () => {
    expect(normalizeHex('', '#fallback')).toBe('#fallback');
    expect(normalizeHex('xyz', '#000000')).toBe('#000000');
    expect(normalizeHex(null, '#111111')).toBe('#111111');
  });

  it('uses #d946ef as default when defaultHex not provided', () => {
    expect(normalizeHex('')).toBe('#d946ef');
    expect(normalizeHex('nothex')).toBe('#d946ef');
  });
});

describe('hexWithAlpha', () => {
  it('appends alpha channel to 7-char hex', () => {
    expect(hexWithAlpha('#ffffff', 0)).toBe('#ffffff00');
    expect(hexWithAlpha('#ffffff', 1)).toBe('#ffffffff');
    expect(hexWithAlpha('#000000', 0.5)).toBe('#00000080');
  });

  it('rounds alpha to nearest 0–255', () => {
    expect(hexWithAlpha('#aabbcc', 0.5)).toBe('#aabbcc80');
  });
});

describe('CONTRAST_THRESHOLD_*', () => {
  it('exports default and toggle thresholds as numbers', () => {
    expect(CONTRAST_THRESHOLD_DEFAULT).toBe(0.45);
    expect(CONTRAST_THRESHOLD_TOGGLE).toBe(0.65);
  });
});

describe('getContrastColor', () => {
  it('returns black for light backgrounds', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000');
    expect(getContrastColor('#eeeeee')).toBe('#000000');
    expect(getContrastColor('#06b6d4')).toBe('#000000'); // cyan accent, high luminance
  });

  it('returns white for dark backgrounds', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff');
    expect(getContrastColor('#111111')).toBe('#ffffff');
    expect(getContrastColor('#333366')).toBe('#ffffff');
  });

  it('accepts hex with or without #', () => {
    expect(getContrastColor('ffffff')).toBe('#000000');
    expect(getContrastColor('#000000')).toBe('#ffffff');
  });

  it('uses custom threshold when provided', () => {
    // default threshold 0.45: above = black, below = white
    expect(getContrastColor('#888888', 0.5)).toBe('#000000');
    expect(getContrastColor('#888888', 0.2)).toBe('#000000');
    expect(getContrastColor('#888888', 0.8)).toBe('#ffffff');
  });
});
