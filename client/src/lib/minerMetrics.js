/**
 * Derived miner metrics (computed from API data).
 */

/**
 * Efficiency in J/TH (power in W / hashrate in TH/s).
 * @param {object} miner - Miner data with power (W) and hashRate (GH/s)
 * @returns {number|null} J/TH or null if not computable
 */
export function computeEfficiency(miner) {
  if (!miner?.power || !miner?.hashRate || miner.hashRate === 0) return null;
  const thps = miner.hashRate / 1000;
  if (thps === 0) return null;
  return miner.power / thps;
}
