/**
 * Derived miner metrics (computed from API data).
 */

/** Efficiency in J/TH (power in W / hashrate in TH/s). */
export function computeEfficiency(miner) {
  if (!miner?.power || !miner?.hashRate || miner.hashRate === 0) return null;
  const thps = miner.hashRate / 1000;
  if (thps === 0) return null;
  return miner.power / thps;
}
