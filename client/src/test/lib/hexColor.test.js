import { HEX_COLOR_REGEX, isValidHexColor } from 'shared/hexColor.js';
import { describe, expect, it } from 'vitest';

describe('HEX_COLOR_REGEX', () => {
  it('matches 3-digit hex with optional #', () => {
    expect(HEX_COLOR_REGEX.test('abc')).toBe(true);
    expect(HEX_COLOR_REGEX.test('#abc')).toBe(true);
    expect(HEX_COLOR_REGEX.test('ABC')).toBe(true);
    expect(HEX_COLOR_REGEX.test('#f00')).toBe(true);
  });

  it('matches 6-digit hex with optional #', () => {
    expect(HEX_COLOR_REGEX.test('abcdef')).toBe(true);
    expect(HEX_COLOR_REGEX.test('#abcdef')).toBe(true);
    expect(HEX_COLOR_REGEX.test('#d946ef')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(HEX_COLOR_REGEX.test('')).toBe(false);
    expect(HEX_COLOR_REGEX.test('ab')).toBe(false);
    expect(HEX_COLOR_REGEX.test('abcd')).toBe(false);
    expect(HEX_COLOR_REGEX.test('abcdef0')).toBe(false);
    expect(HEX_COLOR_REGEX.test('ggg')).toBe(false);
    expect(HEX_COLOR_REGEX.test('#ggg')).toBe(false);
    expect(HEX_COLOR_REGEX.test('abc ')).toBe(false);
    expect(HEX_COLOR_REGEX.test(' abc')).toBe(false);
  });
});

describe('isValidHexColor', () => {
  it('returns false for non-strings', () => {
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(0)).toBe(false);
    expect(isValidHexColor(true)).toBe(false);
    expect(isValidHexColor({})).toBe(false);
  });

  it('returns false for empty or whitespace-only strings', () => {
    expect(isValidHexColor('')).toBe(false);
    expect(isValidHexColor('   ')).toBe(false);
    expect(isValidHexColor('\t')).toBe(false);
  });

  it('returns true for valid 3-digit hex', () => {
    expect(isValidHexColor('abc')).toBe(true);
    expect(isValidHexColor('#abc')).toBe(true);
    expect(isValidHexColor('f00')).toBe(true);
    expect(isValidHexColor('  #abc  ')).toBe(true);
  });

  it('returns true for valid 6-digit hex', () => {
    expect(isValidHexColor('abcdef')).toBe(true);
    expect(isValidHexColor('#d946ef')).toBe(true);
    expect(isValidHexColor('#06b6d4')).toBe(true);
    expect(isValidHexColor('  #ffffff  ')).toBe(true);
  });

  it('returns false for invalid hex strings', () => {
    expect(isValidHexColor('ab')).toBe(false);
    expect(isValidHexColor('abcd')).toBe(false);
    expect(isValidHexColor('#ggg')).toBe(false);
    expect(isValidHexColor('xyz')).toBe(false);
    expect(isValidHexColor('#abcde')).toBe(false);
  });
});
