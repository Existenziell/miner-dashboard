export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Stringify an object with sorted keys at every level so that two semantically
 * equal objects (same keys and values, different key order) produce the same string.
 */
export function sortedStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(sortedStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${sortedStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}
