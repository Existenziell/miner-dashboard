import { computeEfficiency } from './minerMetrics';
import { METRIC_RANGES } from './constants';

/** Low-is-good: value ≤ greenMax → success, ≤ orangeMax → warning, else danger */
function colorLowGood(value, greenMax, orangeMax) {
  if (value == null) return null;
  if (value <= greenMax) return 'text-success';
  if (value <= orangeMax) return 'text-warning';
  return 'text-danger';
}

/** High-is-good: value ≥ greenMin → success, ≥ orangeMin → warning, else danger */
function colorHighGood(value, greenMin, orangeMin) {
  if (value == null) return null;
  if (value >= greenMin) return 'text-success';
  if (value >= orangeMin) return 'text-warning';
  return 'text-danger';
}

/** Tailwind text class for accent (fuchsia) when metric has no range-based color */
const DEFAULT_ACCENT_COLOR = 'text-accent';

function clamp01(v) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(100, v));
}

export function getMetricGaugePercent(miner, metric, efficiency = null) {
  if (!miner) return null;
  const r = METRIC_RANGES;
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

  const r = METRIC_RANGES;
  let out = null;

  switch (metric) {
    case 'temp':
      out = colorLowGood(miner.temp, r.temp.greenMax, r.temp.orangeMax);
      break;
    case 'hashrate':
      if (miner.hashRate == null || miner.hashRate === 0) return 'text-danger';
      out = colorHighGood(miner.hashRate, r.hashrate.greenMin, r.hashrate.orangeMin);
      break;
    case 'power':
      out = colorLowGood(miner.power, r.power.greenMax, r.power.orangeMax);
      break;
    case 'efficiency': {
      const j = efficiency ?? computeEfficiency(miner);
      out = colorLowGood(j, r.efficiency.greenMax, r.efficiency.orangeMax);
      break;
    }
    case 'current': {
      const currentA = miner.current != null ? miner.current / 1000 : null;
      out = colorLowGood(currentA, r.current.greenMax, r.current.orangeMax);
      break;
    }
    case 'frequency':
      out = colorHighGood(miner.frequency, r.frequency.greenMin, r.frequency.orangeMin);
      break;
    case 'voltage': {
      if (miner.coreVoltageActual == null || miner.coreVoltage == null) break;
      const diff = Math.abs(miner.coreVoltageActual - miner.coreVoltage);
      out = colorLowGood(diff, r.voltage.greenMv, r.voltage.orangeMv);
      break;
    }
    case 'fanRpm':
      out = colorLowGood(miner.fanspeed, r.fanRpm.orangeMinPct - 1, r.fanRpm.orangeMaxPct);
      break;
    default:
      return DEFAULT_ACCENT_COLOR;
  }

  return out ?? DEFAULT_ACCENT_COLOR;
}
