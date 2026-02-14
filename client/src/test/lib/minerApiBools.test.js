import { describe, expect, it } from 'vitest';
import { toBool } from '@/lib/minerApiBools.js';

describe('toBool', () => {
  it('returns false when no arguments', () => {
    expect(toBool()).toBe(false);
  });

  it('returns false for falsy values', () => {
    expect(toBool(null)).toBe(false);
    expect(toBool(undefined)).toBe(false);
    expect(toBool(0)).toBe(false);
    expect(toBool('')).toBe(false);
    expect(toBool(false)).toBe(false);
  });

  it('returns true when any argument is 1', () => {
    expect(toBool(1)).toBe(true);
    expect(toBool(0, 1)).toBe(true);
    expect(toBool(1, 0)).toBe(true);
  });

  it('returns true when any argument is true', () => {
    expect(toBool(true)).toBe(true);
    expect(toBool(false, true)).toBe(true);
  });

  it('normalizes miner API style (1 or true)', () => {
    expect(toBool(1)).toBe(true);
    expect(toBool(true)).toBe(true);
    expect(toBool(1, true)).toBe(true);
  });

  it('returns false when multiple values are all falsy (and not 1/true)', () => {
    expect(toBool(null, undefined, 0)).toBe(false);
  });
});
