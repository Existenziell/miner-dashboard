import { describe, expect, it } from 'vitest';
import { stripAnsi } from '@/lib/stripAnsi';

describe('stripAnsi', () => {
  it('returns empty string for non-string input', () => {
    expect(stripAnsi(null)).toBe('');
    expect(stripAnsi(undefined)).toBe('');
    expect(stripAnsi(42)).toBe('');
  });

  it('returns string unchanged when it has no ANSI codes', () => {
    expect(stripAnsi('hello')).toBe('hello');
    expect(stripAnsi('')).toBe('');
  });

  it('strips single color code', () => {
    expect(stripAnsi('\x1b[0m')).toBe('');
    expect(stripAnsi('\x1b[32mtext')).toBe('text');
    expect(stripAnsi('text\x1b[0m')).toBe('text');
  });

  it('strips multiple codes and semicolons', () => {
    expect(stripAnsi('\x1b[0;32mgreen\x1b[0m')).toBe('green');
    expect(stripAnsi('\x1b[1;31merror\x1b[0m')).toBe('error');
  });

  it('preserves non-ANSI content', () => {
    expect(stripAnsi('a\x1b[32mb\x1b[0mc')).toBe('abc');
  });
});
