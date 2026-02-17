import { describe, expect, it } from 'vitest';
import {
  computeSoloOdds,
  formatChancePct,
  formatExpectedTime,
} from '@/lib/soloMiningOdds.js';

const SEC_PER_DAY = 86400;
const SEC_PER_YEAR = 365.25 * 24 * 3600;
const TWO_32 = 2 ** 32;

describe('computeSoloOdds', () => {
  const nullResult = {
    expectedSeconds: null,
    chance1DayPct: null,
    chance7DaysPct: null,
    chance30DaysPct: null,
    chance90DaysPct: null,
    chance1YearPct: null,
    chance2YearsPct: null,
    chance5YearsPct: null,
  };

  it('returns all nulls when thPerSec is invalid', () => {
    const diff = 1e12;
    expect(computeSoloOdds(null, diff)).toEqual(nullResult);
    expect(computeSoloOdds(undefined, diff)).toEqual(nullResult);
    expect(computeSoloOdds(0, diff)).toEqual(nullResult);
    expect(computeSoloOdds(-1, diff)).toEqual(nullResult);
    expect(computeSoloOdds(NaN, diff)).toEqual(nullResult);
  });

  it('returns all nulls when networkDifficulty is invalid', () => {
    const th = 14;
    expect(computeSoloOdds(th, null)).toEqual(nullResult);
    expect(computeSoloOdds(th, undefined)).toEqual(nullResult);
    expect(computeSoloOdds(th, 0)).toEqual(nullResult);
    expect(computeSoloOdds(th, -1)).toEqual(nullResult);
    expect(computeSoloOdds(th, NaN)).toEqual(nullResult);
  });

  it('computes expectedSeconds as (difficulty * 2^32) / (thPerSec * 1e12)', () => {
    const thPerSec = 14;
    const difficulty = 100e12; // 100T
    const result = computeSoloOdds(thPerSec, difficulty);
    const expectedSeconds = (difficulty * TWO_32) / (thPerSec * 1e12);
    expect(result.expectedSeconds).toBeCloseTo(expectedSeconds, 5);
  });

  it('chance over period T is 100 * (1 - exp(-T/expectedSeconds))', () => {
    // If expected time = 1 day, chance in 1 day ≈ 63.2% (1 - 1/e)
    const expectedOneDay = SEC_PER_DAY;
    const difficulty = (expectedOneDay * 14 * 1e12) / TWO_32;
    const result = computeSoloOdds(14, difficulty);
    expect(result.expectedSeconds).toBeCloseTo(expectedOneDay, 0);
    expect(result.chance1DayPct).toBeCloseTo(100 * (1 - Math.exp(-1)), 5);
  });

  it('returns increasing chances for longer periods', () => {
    const result = computeSoloOdds(14, 100e12);
    expect(result.chance1DayPct).toBeLessThan(result.chance7DaysPct);
    expect(result.chance7DaysPct).toBeLessThan(result.chance30DaysPct);
    expect(result.chance30DaysPct).toBeLessThan(result.chance90DaysPct);
    expect(result.chance90DaysPct).toBeLessThan(result.chance1YearPct);
    expect(result.chance1YearPct).toBeLessThan(result.chance2YearsPct);
    expect(result.chance2YearsPct).toBeLessThan(result.chance5YearsPct);
  });

  it('all chance values are between 0 and 100 for finite expected time', () => {
    const result = computeSoloOdds(1, 50e12);
    const chanceKeys = [
      'chance1DayPct', 'chance7DaysPct', 'chance30DaysPct', 'chance90DaysPct',
      'chance1YearPct', 'chance2YearsPct', 'chance5YearsPct',
    ];
    chanceKeys.forEach((key) => {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(100);
    });
  });
});

describe('formatExpectedTime', () => {
  it('returns "--" for null, undefined, NaN, or negative', () => {
    expect(formatExpectedTime(null)).toBe('--');
    expect(formatExpectedTime(undefined)).toBe('--');
    expect(formatExpectedTime(NaN)).toBe('--');
    expect(formatExpectedTime(-1)).toBe('--');
  });

  it('formats years when >= 1 year', () => {
    expect(formatExpectedTime(SEC_PER_YEAR)).toBe('1.0 year');
    expect(formatExpectedTime(2 * SEC_PER_YEAR)).toBe('2.0 years');
    expect(formatExpectedTime(1224.4 * SEC_PER_YEAR)).toMatch(/1224\.4 years/);
  });

  it('formats days when >= 1 day and < 1 year', () => {
    expect(formatExpectedTime(SEC_PER_DAY)).toBe('1.0 day');
    expect(formatExpectedTime(7 * SEC_PER_DAY)).toBe('7.0 days');
  });

  it('formats hours when >= 1 hour and < 1 day', () => {
    expect(formatExpectedTime(3600)).toBe('1.0 hour');
    expect(formatExpectedTime(7200)).toBe('2.0 hours');
  });

  it('formats under 1 hour as days with decimal', () => {
    expect(formatExpectedTime(1800)).toBe('0.0 days');
  });
});

describe('formatChancePct', () => {
  it('returns "--" for null, undefined, or NaN', () => {
    expect(formatChancePct(null)).toBe('--');
    expect(formatChancePct(undefined)).toBe('--');
    expect(formatChancePct(NaN)).toBe('--');
  });

  it('returns "100%" for >= 100', () => {
    expect(formatChancePct(100)).toBe('100%');
    expect(formatChancePct(150)).toBe('100%');
  });

  it('formats with one decimal for 10 <= pct < 100', () => {
    expect(formatChancePct(10)).toBe('10.0%');
    expect(formatChancePct(99.5)).toBe('99.5%');
  });

  it('formats with two decimals for 1 <= pct < 10', () => {
    expect(formatChancePct(1)).toBe('1.00%');
    expect(formatChancePct(5.5)).toBe('5.50%');
  });

  it('formats with four decimals for 0.01 <= pct < 1', () => {
    expect(formatChancePct(0.5)).toBe('0.5000%');
    expect(formatChancePct(0.007)).toBe('0.0070%');
  });

  it('formats very small positive without scientific notation', () => {
    const small = 9.81e-5;
    expect(formatChancePct(small)).not.toMatch(/e/i);
    expect(formatChancePct(small)).toMatch(/%$/);
    expect(formatChancePct(small)).toBe('0.0000981%');
  });

  it('returns "0%" for zero', () => {
    expect(formatChancePct(0)).toBe('0%');
  });
});
