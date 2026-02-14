import { describe, expect, it } from 'vitest';
import { formatTime } from '@/lib/chartUtils.js';

describe('formatTime', () => {
  it('formats timestamp as locale time with hour and minute', () => {
    // Use a fixed date so we don't depend on locale
    const ts = new Date('2025-02-11T14:35:00Z').getTime();
    const result = formatTime(ts);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    // Result may be "2:35 PM" or "14:35" depending on locale
    expect(result).toContain('35');
  });

  it('handles numeric timestamp', () => {
    const ts = 1739280900000; // some valid ms
    expect(() => formatTime(ts)).not.toThrow();
    expect(formatTime(ts)).toBeTruthy();
  });
});
