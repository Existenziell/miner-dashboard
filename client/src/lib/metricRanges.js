import { computeEfficiency } from '@/lib/minerMetrics';
import { METRIC_RANGES } from '@/lib/constants';

/** Optional override from dashboard config (set by ConfigProvider). */
let metricRangesOverride = null;

export function setMetricRanges(ranges) {
  metricRangesOverride = ranges && typeof ranges === 'object' ? ranges : null;
}

function getRanges() {
  return metricRangesOverride ?? METRIC_RANGES;
}

/** Low-is-good: value ≤ max → accent (OK), else danger */
function okLowGood(value, max) {
  if (value == null) return null;
  return value <= max ? 'text-accent' : 'text-danger';
}

/** High-is-good: value ≥ min → accent (OK), else danger */
function okHighGood(value, min) {
  if (value == null) return null;
  return value >= min ? 'text-accent' : 'text-danger';
}

/** Tailwind text class for accent (fuchsia) when metric has no range-based color */
const DEFAULT_ACCENT_COLOR = 'text-accent';

function clamp01(v) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(100, v));
}

export function getMetricGaugePercent(miner, metric, efficiency = null) {
  if (!miner) return null;
  const r = getRanges();
  switch (metric) {
    case 'temp':
      return miner.temp != null ? clamp01((miner.temp / r.temp.gaugeMax) * 100) : null;
    case 'hashrate':
      return miner.hashRate != null ? clamp01((miner.hashRate / r.hashrate.gaugeMax) * 100) : null;
    case 'power':
      return miner.power != null ? clamp01((miner.power / r.power.gaugeMax) * 100) : null;
    case 'efficiency': {
      const j = efficiency ?? computeEfficiency(miner);
      if (j == null) return null;
      const max = r.efficiency.gaugeMax;
      return clamp01(((max - j) / max) * 100);
    }
    case 'current': {
      const a = miner.current != null ? miner.current / 1000 : null;
      return a != null ? clamp01((a / r.current.gaugeMax) * 100) : null;
    }
    case 'frequency':
      return miner.frequency != null ? clamp01((miner.frequency / r.frequency.gaugeMax) * 100) : null;
    case 'voltage':
      return miner.coreVoltageActual != null ? clamp01((miner.coreVoltageActual / r.voltage.gaugeMax) * 100) : null;
    case 'fanRpm':
      return miner.fanspeed != null ? clamp01(miner.fanspeed) : null;
    default:
      return null;
  }
}

/**
 * Returns the Tailwind color class for a metric given miner data.
 * @param {object} miner - Miner info object
 * @param {string} metric - One of: temp, hashrate, power, efficiency, current, frequency, voltage, fanRpm
 * @param {number} [efficiency] - Precomputed efficiency (J/TH) when metric === 'efficiency'
 */
export function getMetricColor(miner, metric, efficiency = null) {
  if (!miner) return DEFAULT_ACCENT_COLOR;

  const r = getRanges();
  let out = null;

  switch (metric) {
    case 'temp':
      out = okLowGood(miner.temp, r.temp.max);
      break;
    case 'hashrate':
      if (miner.hashRate == null || miner.hashRate === 0) return 'text-danger';
      out = okHighGood(miner.hashRate, r.hashrate.min);
      break;
    case 'power':
      out = okLowGood(miner.power, r.power.max);
      break;
    case 'efficiency': {
      const j = efficiency ?? computeEfficiency(miner);
      out = okLowGood(j, r.efficiency.max);
      break;
    }
    case 'current': {
      const currentA = miner.current != null ? miner.current / 1000 : null;
      out = okLowGood(currentA, r.current.max);
      break;
    }
    case 'frequency':
      out = okHighGood(miner.frequency, r.frequency.min);
      break;
    case 'voltage': {
      if (miner.coreVoltageActual == null || miner.coreVoltage == null) break;
      const diff = Math.abs(miner.coreVoltageActual - miner.coreVoltage);
      out = okLowGood(diff, r.voltage.maxMv);
      break;
    }
    case 'fanRpm':
      out = okLowGood(miner.fanspeed, r.fanRpm.maxPct);
      break;
    default:
      return DEFAULT_ACCENT_COLOR;
  }

  return out ?? DEFAULT_ACCENT_COLOR;
}
