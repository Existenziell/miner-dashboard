/**
 * Normalize miner API boolean fields (may be 1, true, or missing).
 * Returns true if any argument is 1 or true.
 */
export function toBool(...values) {
  return values.some((v) => v === 1 || v === true);
}
