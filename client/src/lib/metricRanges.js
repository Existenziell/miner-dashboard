import { computeEfficiency } from './minerMetrics';

/**
 * Metric range settings:
 *
 * | Metric            | Green        | Orange       | Red          |
 * |-------------------|--------------|--------------|--------------|
 * | ASIC Temperature  | 0–55.5 °C    | >55.5–65 °C  | >65 °C       |
 * | Hashrate          | >6 TH/s      | ≤6 TH/s      | 0            |
 * | Power             | ≤100 W       | 101–112 W    | >112 W       |
 * | Efficiency        | ≤20 J/TH     | 21–25 J/TH   | >25 J/TH     |
 * | Input Current     | ≤7.75 A      | 7.76–9 A     | >9 A         |
 * | ASIC Frequency    | ≤90% of max  | 91–95% of max| >95% of max  |
 * | ASIC Voltage      | 20 mV of set | 21–50 mV off | >50 mV off   |
 * | Fan Speed         | <50% of max  | 50–75%       | >75% of max   |
 *
 * Returns Tailwind color classes: text-success (green), text-warning (orange), text-danger (red).
 */

const TEMP_GREEN_MAX = 55.5;
const TEMP_ORANGE_MAX = 65;
function tempColor(temp) {
  if (temp == null) return null;
  if (temp <= TEMP_GREEN_MAX) return 'text-success';
  if (temp <= TEMP_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

export const DEFAULT_EXPECTED_HASHRATE_GH = 6000;

const HASHRATE_GREEN_MIN_GH = 6000; // 6 TH/s – green at or above this
function hashrateColor(hashRate) {
  if (hashRate == null || hashRate === 0) return 'text-danger';
  if (hashRate >= HASHRATE_GREEN_MIN_GH) return 'text-success';
  return 'text-warning';
}

const POWER_GREEN_MAX = 100;
const POWER_ORANGE_MAX = 112;  // red only above 112 W
function powerColor(power) {
  if (power == null) return null;
  if (power <= POWER_GREEN_MAX) return 'text-success';
  if (power <= POWER_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

const EFF_GREEN_MAX = 20;
const EFF_ORANGE_MAX = 25;
function efficiencyColor(jPerTh) {
  if (jPerTh == null) return null;
  if (jPerTh <= EFF_GREEN_MAX) return 'text-success';
  if (jPerTh <= EFF_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

const CURRENT_GREEN_MAX = 7.75;
const CURRENT_ORANGE_MAX = 9;  // red only above 9 A
function currentColor(currentA) {
  if (currentA == null) return null;
  if (currentA <= CURRENT_GREEN_MAX) return 'text-success';
  if (currentA <= CURRENT_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

const FREQUENCY_GREEN_MIN_MHZ = 700;   // green above 700 MHz
const FREQUENCY_ORANGE_MIN_MHZ = 650;  // orange 650–699, red below 650
function frequencyColor(frequency) {
  if (frequency == null) return null;
  if (frequency >= FREQUENCY_GREEN_MIN_MHZ) return 'text-success';   // high = good
  if (frequency >= FREQUENCY_ORANGE_MIN_MHZ) return 'text-warning';
  return 'text-danger';   // low = bad
}

const VOLTAGE_MV_GREEN = 20;
const VOLTAGE_MV_ORANGE = 50;
function voltageColor(actualMv, setMv) {
  if (actualMv == null || setMv == null) return null;
  const diff = Math.abs(actualMv - setMv);
  if (diff <= VOLTAGE_MV_GREEN) return 'text-success';
  if (diff <= VOLTAGE_MV_ORANGE) return 'text-warning';
  return 'text-danger';
}

const FAN_PCT_ORANGE_MAX = 75;  // red only above 75%
function fanSpeedColor(fanspeedPct) {
  if (fanspeedPct == null) return null;
  if (fanspeedPct < 50) return 'text-success';
  if (fanspeedPct <= FAN_PCT_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

/** Tailwind text class for accent (fuchsia) when metric has no range-based color */
const DEFAULT_ACCENT_COLOR = 'text-accent';

/** Gauge fill scale: 0–100 for ring fill. Uses same ranges as color logic where applicable. */
const TEMP_GAUGE_MAX = 85;
const POWER_GAUGE_MAX = 120;
const EFF_GAUGE_MAX = 30;
const CURRENT_GAUGE_MAX = 10;
const HASHRATE_GAUGE_MAX_GH = 7000;   // 7 TH/s
const VOLTAGE_GAUGE_MAX_MV = 1300;
const FREQUENCY_GAUGE_MAX = 850;
const VOLTAGE_DIFF_GAUGE_MAX_MV = 50;

function clamp01(v) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(100, v));
}

export function getMetricGaugePercent(miner, metric, efficiency = null) {
  if (!miner) return null;
  switch (metric) {
    case 'temp':
      return miner.temp != null ? clamp01((miner.temp / TEMP_GAUGE_MAX) * 100) : null;
    case 'hashrate':
      return miner.hashRate != null ? clamp01((miner.hashRate / HASHRATE_GAUGE_MAX_GH) * 100) : null;
    case 'power':
      return miner.power != null ? clamp01((miner.power / POWER_GAUGE_MAX) * 100) : null;
    case 'efficiency': {
      const j = efficiency ?? computeEfficiency(miner);
      if (j == null) return null;
      return clamp01(((EFF_GAUGE_MAX - j) / EFF_GAUGE_MAX) * 100);
    }
    case 'current': {
      const a = miner.current != null ? miner.current / 1000 : null;
      return a != null ? clamp01((a / CURRENT_GAUGE_MAX) * 100) : null;
    }
    case 'frequency':
      return miner.frequency != null ? clamp01((miner.frequency / FREQUENCY_GAUGE_MAX) * 100) : null;
    case 'voltage':
      return miner.coreVoltageActual != null ? clamp01((miner.coreVoltageActual / VOLTAGE_GAUGE_MAX_MV) * 100) : null;
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

  switch (metric) {
    case 'temp':
      return tempColor(miner.temp) ?? DEFAULT_ACCENT_COLOR;
    case 'hashrate':
      return hashrateColor(miner.hashRate);
    case 'power':
      return powerColor(miner.power) ?? DEFAULT_ACCENT_COLOR;
    case 'efficiency':
      return efficiencyColor(efficiency ?? computeEfficiency(miner)) ?? DEFAULT_ACCENT_COLOR;
    case 'current':
      return currentColor(miner.current != null ? miner.current / 1000 : null) ?? DEFAULT_ACCENT_COLOR;
    case 'frequency':
      return frequencyColor(miner.frequency) ?? DEFAULT_ACCENT_COLOR;
    case 'voltage':
      return voltageColor(miner.coreVoltageActual, miner.coreVoltage) ?? DEFAULT_ACCENT_COLOR;
    case 'fanRpm':
      return fanSpeedColor(miner.fanspeed) ?? DEFAULT_ACCENT_COLOR;
    default:
      return DEFAULT_ACCENT_COLOR;
  }
}
