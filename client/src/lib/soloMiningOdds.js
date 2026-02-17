/**
 * Solo mining odds: expected time to block and probability over various periods.
 * Uses network difficulty and average block time; hashrate in TH/s.
 */

const TWO_32 = 2 ** 32;
const SEC_PER_DAY = 86400;
const SEC_PER_YEAR = 365.25 * 24 * 3600;

/**
 * Compute expected time to find a block (seconds) and chance over given periods.
 */
export function computeSoloOdds(thPerSec, networkDifficulty) {
  if (
    !Number.isFinite(thPerSec) ||
    thPerSec <= 0 ||
    !Number.isFinite(networkDifficulty) ||
    networkDifficulty <= 0
  ) {
    return {
      expectedSeconds: null,
      chance1DayPct: null,
      chance7DaysPct: null,
      chance30DaysPct: null,
      chance90DaysPct: null,
      chance1YearPct: null,
      chance2YearsPct: null,
      chance5YearsPct: null,
    };
  }

  const hashrateHps = thPerSec * 1e12;
  const expectedHashesPerBlock = networkDifficulty * TWO_32;
  const expectedSeconds = expectedHashesPerBlock / hashrateHps;

  const pct = (seconds) => 100 * (1 - Math.exp(-seconds / expectedSeconds));

  return {
    expectedSeconds,
    chance1DayPct: pct(SEC_PER_DAY),
    chance7DaysPct: pct(7 * SEC_PER_DAY),
    chance30DaysPct: pct(30 * SEC_PER_DAY),
    chance90DaysPct: pct(90 * SEC_PER_DAY),
    chance1YearPct: pct(SEC_PER_YEAR),
    chance2YearsPct: pct(2 * SEC_PER_YEAR),
    chance5YearsPct: pct(5 * SEC_PER_YEAR),
  };
}

/**
 * Format expected time (seconds) as human-readable string (e.g. "1224.4 years", "15.2 days").
 */
export function formatExpectedTime(expectedSeconds) {
  if (!Number.isFinite(expectedSeconds) || expectedSeconds < 0) return '--';
  if (expectedSeconds >= SEC_PER_YEAR) {
    const years = expectedSeconds / SEC_PER_YEAR;
    return `${years.toFixed(1)} year${years !== 1 ? 's' : ''}`;
  }
  if (expectedSeconds >= SEC_PER_DAY) {
    const days = expectedSeconds / SEC_PER_DAY;
    return `${days.toFixed(1)} day${days !== 1 ? 's' : ''}`;
  }
  if (expectedSeconds >= 3600) {
    const hours = expectedSeconds / 3600;
    return `${hours.toFixed(1)} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = expectedSeconds / SEC_PER_DAY;
  return `${days.toFixed(1)} day${days !== 1 ? 's' : ''}`;
}

/**
 * Format small probability as percentage string (e.g. "0.0002%", "0.007%").
 */
export function formatChancePct(pct) {
  if (pct == null || !Number.isFinite(pct)) return '--';
  if (pct >= 100) return '100%';
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  if (pct >= 1) return `${pct.toFixed(2)}%`;
  if (pct >= 0.01) return `${pct.toFixed(4)}%`;
  if (pct >= 0.0001) return `${pct.toFixed(4)}%`;
  if (pct > 0) {
    const fixed = pct.toFixed(10).replace(/\.?0+$/, '');
    return `${fixed}%`;
  }
  return '0%';
}
