import { describe, expect, it } from 'vitest';
import { computeEfficiency } from '@/lib/minerMetrics.js';

describe('computeEfficiency', () => {
  it('returns null when miner is null or undefined', () => {
    expect(computeEfficiency(null)).toBe(null);
    expect(computeEfficiency(undefined)).toBe(null);
  });

  it('returns null when power is missing or zero', () => {
    expect(computeEfficiency({ hashRate: 5000 })).toBe(null);
    expect(computeEfficiency({ power: 0, hashRate: 5000 })).toBe(null);
  });

  it('returns null when hashRate is missing or zero', () => {
    expect(computeEfficiency({ power: 100 })).toBe(null);
    expect(computeEfficiency({ power: 100, hashRate: 0 })).toBe(null);
  });

  it('computes J/TH as power (W) / hashrate (TH/s)', () => {
    // 100 W, 5 TH/s => 100/5 = 20 J/TH
    expect(computeEfficiency({ power: 100, hashRate: 5000 })).toBe(20);
  });

  it('converts GH/s to TH/s (divide by 1000)', () => {
    // 100 W, 6000 GH/s = 6 TH/s => 100/6 ≈ 16.67
    expect(computeEfficiency({ power: 100, hashRate: 6000 })).toBeCloseTo(100 / 6, 5);
  });

  it('returns null when effective TH/s is zero', () => {
    expect(computeEfficiency({ power: 100, hashRate: 0 })).toBe(null);
  });
});
