import { describe, it, expect } from 'vitest';
import { RESET_REASONS } from '@/lib/constants.js';
import {
  formatHashrate,
  formatUptime,
  formatTemp,
  formatPower,
  formatBytes,
  formatNumber,
  formatDifficulty,
  formatPrice,
  formatBestDiff,
  formatResetReason,
} from '@/lib/formatters.js';

describe('formatHashrate', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatHashrate(null)).toBe('--');
    expect(formatHashrate(undefined)).toBe('--');
  });
  it('formats MH/s when < 1 GH/s', () => {
    expect(formatHashrate(0.5)).toBe('500.0 MH/s');
    expect(formatHashrate(0.001)).toBe('1.0 MH/s');
  });
  it('formats GH/s when >= 1 and < 1000', () => {
    expect(formatHashrate(1)).toBe('1.00 GH/s');
    expect(formatHashrate(100)).toBe('100.00 GH/s');
    expect(formatHashrate(999.99)).toBe('999.99 GH/s');
  });
  it('formats TH/s when >= 1000', () => {
    expect(formatHashrate(1000)).toBe('1.00 TH/s');
    expect(formatHashrate(6000)).toBe('6.00 TH/s');
  });
});

describe('formatUptime', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatUptime(null)).toBe('--');
    expect(formatUptime(undefined)).toBe('--');
  });
  it('formats minutes only when < 1 hour', () => {
    expect(formatUptime(0)).toBe('0m');
    expect(formatUptime(90)).toBe('1m');
    expect(formatUptime(3599)).toBe('59m');
  });
  it('formats hours and minutes', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
    expect(formatUptime(3661)).toBe('1h 1m');
  });
  it('formats days, hours, minutes', () => {
    expect(formatUptime(86400)).toBe('1d 0h 0m');
    expect(formatUptime(90061)).toBe('1d 1h 1m');
  });
});

describe('formatTemp', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatTemp(null)).toBe('--');
    expect(formatTemp(undefined)).toBe('--');
  });
  it('formats temperature with one decimal', () => {
    expect(formatTemp(55)).toBe('55.0°C');
    expect(formatTemp(55.67)).toBe('55.7°C');
  });
});

describe('formatPower', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatPower(null)).toBe('--');
    expect(formatPower(undefined)).toBe('--');
  });
  it('formats watts with one decimal', () => {
    expect(formatPower(100)).toBe('100.0 W');
    expect(formatPower(99.5)).toBe('99.5 W');
  });
});

describe('formatBytes', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatBytes(null)).toBe('--');
    expect(formatBytes(undefined)).toBe('--');
  });
  it('formats B, KB, MB, GB with fixed decimal (no locale)', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.02 KB');
    expect(formatBytes(7020736)).toBe('7.02 MB');
    expect(formatBytes(1e9)).toBe('1.00 GB');
  });
});

describe('formatNumber', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatNumber(null)).toBe('--');
    expect(formatNumber(undefined)).toBe('--');
  });
  it('formats with locale commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatDifficulty', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatDifficulty(null)).toBe('--');
    expect(formatDifficulty(undefined)).toBe('--');
  });
  it('formats M scale', () => {
    expect(formatDifficulty(1e6)).toBe('1.00 M');
  });
  it('formats G scale', () => {
    expect(formatDifficulty(1e9)).toBe('1.00 G');
  });
  it('formats T scale', () => {
    expect(formatDifficulty(1e12)).toBe('1.00 T');
  });
  it('formats P scale', () => {
    expect(formatDifficulty(1e15)).toBe('1.00 P');
  });
  it('uses formatNumber for small values', () => {
    expect(formatDifficulty(100)).toBe('100');
  });
});

describe('formatPrice', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatPrice(null)).toBe('--');
    expect(formatPrice(undefined)).toBe('--');
  });
  it('formats USD with $ and locale', () => {
    expect(formatPrice(1000)).toMatch(/\$1,000/);
  });
});

describe('formatBestDiff', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatBestDiff(null)).toBe('--');
    expect(formatBestDiff(undefined)).toBe('--');
  });
  it('formats K, M, G scales without space', () => {
    expect(formatBestDiff(1e3)).toBe('1.00K');
    expect(formatBestDiff(1e6)).toBe('1.00M');
    expect(formatBestDiff(1e9)).toBe('1.00G');
  });
});

describe('RESET_REASONS', () => {
  it('includes known ESP32 reset reason keys', () => {
    expect(RESET_REASONS['SYSTEM.RESET_POWERON']).toBe('Power On');
    expect(RESET_REASONS['SYSTEM.RESET_PANIC']).toBe('Panic / Exception');
  });
});

describe('formatResetReason', () => {
  it('returns "--" for falsy input', () => {
    expect(formatResetReason('')).toBe('--');
    expect(formatResetReason(null)).toBe('--');
  });
  it('returns label for known reason', () => {
    expect(formatResetReason('SYSTEM.RESET_POWERON')).toBe('Power On');
  });
  it('returns raw string for unknown reason', () => {
    expect(formatResetReason('UNKNOWN.KEY')).toBe('UNKNOWN.KEY');
  });
});
