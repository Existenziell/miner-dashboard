import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESET_REASONS } from '@/lib/constants.js';
import {
  formatBestDiff,
  formatBytes,
  formatDifficulty,
  formatHash,
  formatHashrate,
  formatNumber,
  formatPower,
  formatPrice,
  formatResetReason,
  formatStratumUser,
  formatTemp,
  formatTimeAgo,
  formatUptime,
  formatWeight,
  obfuscateMac,
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

describe('formatWeight', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatWeight(null)).toBe('--');
    expect(formatWeight(undefined)).toBe('--');
  });
  it('formats WU, KW, MW', () => {
    expect(formatWeight(500)).toBe('500 WU');
    expect(formatWeight(4000)).toBe('4.00 KW');
    expect(formatWeight(4000000)).toBe('4.00 MW');
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('returns "--" for null or invalid', () => {
    expect(formatTimeAgo(null)).toBe('--');
    expect(formatTimeAgo(undefined)).toBe('--');
    expect(formatTimeAgo(NaN)).toBe('--');
  });
  it('returns "0 sec ago" for current time, "just now" for future', () => {
    const now = Math.floor(new Date('2025-01-15T12:00:00Z').getTime() / 1000);
    expect(formatTimeAgo(now)).toBe('0 sec ago');
    expect(formatTimeAgo(now + 10)).toBe('just now');
  });
  it('returns "X sec ago" for under 60s', () => {
    const ts = Math.floor(new Date('2025-01-15T11:59:55Z').getTime() / 1000);
    expect(formatTimeAgo(ts)).toBe('5 sec ago');
  });
  it('returns "X min ago" for under 1 hour', () => {
    const ts = Math.floor(new Date('2025-01-15T11:55:00Z').getTime() / 1000);
    expect(formatTimeAgo(ts)).toBe('5 min ago');
  });
  it('returns "X hour(s) ago" for under 24 hours', () => {
    const ts = Math.floor(new Date('2025-01-15T10:00:00Z').getTime() / 1000);
    expect(formatTimeAgo(ts)).toBe('2 hours ago');
  });
  it('returns "X day(s) ago" for 24+ hours', () => {
    const ts = Math.floor(new Date('2025-01-14T12:00:00Z').getTime() / 1000);
    expect(formatTimeAgo(ts)).toBe('1 day ago');
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

describe('formatHash', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatHash(null)).toBe('--');
    expect(formatHash(undefined)).toBe('--');
  });
  it('formats hash with first 3 and last 6 characters', () => {
    expect(formatHash('00000000000000000000cd73f237ce14202ea861a829f32e450b55c5f424be4f')).toBe('000...24be4f');
  });
});

describe('formatStratumUser', () => {
  it('returns "--" for null, undefined, or empty string', () => {
    expect(formatStratumUser(null)).toBe('--');
    expect(formatStratumUser(undefined)).toBe('--');
    expect(formatStratumUser('')).toBe('--');
  });
  it('returns "--" for whitespace-only string', () => {
    expect(formatStratumUser('   ')).toBe('--');
  });
  it('obfuscates address only (no dot): first 4 + ... + last 6', () => {
    expect(formatStratumUser('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfj5x4qhf')).toBe('bc1q...5x4qhf');
  });
  it('obfuscates address and keeps suffix for Address.Worker', () => {
    expect(formatStratumUser('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfj5x4qhf.worker1')).toBe('bc1q...5x4qhf.worker1');
  });
  it('obfuscates address and keeps full suffix for Address.Worker.RIG_ID', () => {
    expect(formatStratumUser('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfj5x4qhf.Worker.RIG_ID')).toBe('bc1q...5x4qhf.Worker.RIG_ID');
  });
  it('shows address part in full when length <= 10', () => {
    expect(formatStratumUser('short')).toBe('short');
    expect(formatStratumUser('user.worker')).toBe('user.worker');
  });
  it('obfuscates long single segment (no suffix)', () => {
    expect(formatStratumUser('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe('1BvB...JaNVN2');
  });
});

describe('obfuscateMac', () => {
  it('returns "--" for null, undefined, or empty string', () => {
    expect(obfuscateMac(null)).toBe('--');
    expect(obfuscateMac(undefined)).toBe('--');
    expect(obfuscateMac('')).toBe('--');
  });
  it('obfuscates colon-separated MAC to first and last octet', () => {
    expect(obfuscateMac('AC:A7:04:1F:F6:6C')).toBe('AC:00:00:00:00:6C');
  });
  it('obfuscates hyphen-separated MAC and returns colon-separated', () => {
    expect(obfuscateMac('AC-A7-04-1F-F6-6C')).toBe('AC:00:00:00:00:6C');
  });
  it('returns original string when not 6 octets', () => {
    expect(obfuscateMac('AC:A7:04')).toBe('AC:A7:04');
  });
});
