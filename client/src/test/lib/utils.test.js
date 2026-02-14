import { describe, expect, it } from 'vitest';
import { deepCopy } from '@/lib/utils.js';

describe('deepCopy', () => {
  it('returns a deep clone of a plain object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const copy = deepCopy(obj);
    expect(copy).toEqual(obj);
    expect(copy).not.toBe(obj);
    expect(copy.b).not.toBe(obj.b);
  });

  it('returns a deep clone of an array', () => {
    const arr = [1, { x: 2 }, [3]];
    const copy = deepCopy(arr);
    expect(copy).toEqual(arr);
    expect(copy).not.toBe(arr);
    expect(copy[1]).not.toBe(arr[1]);
    expect(copy[2]).not.toBe(arr[2]);
  });

  it('cloned changes do not affect the original', () => {
    const obj = { nested: { value: 1 } };
    const copy = deepCopy(obj);
    copy.nested.value = 99;
    expect(obj.nested.value).toBe(1);
  });
});
