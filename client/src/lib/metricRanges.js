/**
 * Metric range settings:
 *
 * | Metric            | Green        | Orange       | Red          |
 * |-------------------|--------------|--------------|--------------|
 * | ASIC Temperature  | 0–55 °C      | 56–65 °C     | >65 °C       |
 * | Hashrate          | ≥80%         | <80%         | 0            |
 * | Power             | ≤100 W       | 101–110 W    | >110 W       |
 * | Efficiency        | ≤20 J/TH     | 21–25 J/TH   | >25 J/TH     |
 * | Input Current     | ≤7.75 A      | 7.76–8 A     | >8 A         |
 * | ASIC Frequency    | ≤90% of max  | 91–95% of max| >95% of max  |
 * | ASIC Voltage      | 20 mV of set | 21–50 mV off | >50 mV off   |
 * | Fan Speed         | ≥50% of max  | 30–50%       | <30%         |
 *
 * Returns Tailwind color classes: text-success (green), text-warning (orange), text-danger (red).
 * Expected hashrate default: 6000 GH/s (6 TH/s) when miner does not report it.
 */

function tempColor(temp) {
  if (temp == null) return null;
  if (temp <= 55) return 'text-success';
  if (temp <= 65) return 'text-warning';
  return 'text-danger';
}

export const DEFAULT_EXPECTED_HASHRATE_GH = 6000;

// Hashrate: 0 = red; < 80% of expected = orange, else green
function hashrateColor(hashRate, expectedHashrate) {
  if (hashRate == null || hashRate === 0) return 'text-danger';
  const expected = expectedHashrate != null && expectedHashrate > 0 ? expectedHashrate : DEFAULT_EXPECTED_HASHRATE_GH;
  const pct = (hashRate / expected) * 100;
  if (pct < 80) return 'text-warning';
  return 'text-success';
}

const POWER_GREEN_MAX = 100;
const POWER_ORANGE_MAX = 110;
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

// Input current (A): ≤7.75 green, 7.76–8 orange, >8 red
const CURRENT_GREEN_MAX = 7.75;
const CURRENT_ORANGE_MAX = 8;
function currentColor(currentA) {
  if (currentA == null) return null;
  if (currentA <= CURRENT_GREEN_MAX) return 'text-success';
  if (currentA <= CURRENT_ORANGE_MAX) return 'text-warning';
  return 'text-danger';
}

const FREQUENCY_MAX_MHZ = 800;
const FREQUENCY_GREEN_MAX_PCT = 0.9;  // 720 MHz
const FREQUENCY_ORANGE_MAX_PCT = 0.95; // 760 MHz
function frequencyColor(frequency) {
  if (frequency == null) return null;
  const greenMax = FREQUENCY_MAX_MHZ * FREQUENCY_GREEN_MAX_PCT;
  const orangeMax = FREQUENCY_MAX_MHZ * FREQUENCY_ORANGE_MAX_PCT;
  if (frequency <= greenMax) return 'text-success';
  if (frequency <= orangeMax) return 'text-warning';
  return 'text-danger';
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

const FAN_PCT_GREEN_MIN = 50;
const FAN_PCT_ORANGE_MIN = 30;
function fanSpeedColor(fanspeedPct) {
  if (fanspeedPct == null) return null;
  if (fanspeedPct >= FAN_PCT_GREEN_MIN) return 'text-success';
  if (fanspeedPct >= FAN_PCT_ORANGE_MIN) return 'text-warning';
  return 'text-danger';
}

const DEFAULT_COLOR = 'text-btc-orange';

/**
 * Returns the Tailwind color class for a metric given miner data.
 * @param {object} miner - Miner info object
 * @param {string} metric - One of: temp, hashrate, power, efficiency, current, frequency, voltage, fanRpm
 * @param {number} [efficiency] - Precomputed efficiency (J/TH) when metric === 'efficiency'
 */
export function getMetricColor(miner, metric, efficiency = null) {
  if (!miner) return DEFAULT_COLOR;

  switch (metric) {
    case 'temp':
      return tempColor(miner.temp) ?? DEFAULT_COLOR;
    case 'hashrate':
      return hashrateColor(miner.hashRate, miner.expectedHashrate);
    case 'power':
      return powerColor(miner.power) ?? DEFAULT_COLOR;
    case 'efficiency':
      return efficiencyColor(efficiency ?? (miner.power != null && miner.hashRate ? miner.power / (miner.hashRate / 1000) : null)) ?? DEFAULT_COLOR;
    case 'current':
      return currentColor(miner.current != null ? miner.current / 1000 : null) ?? DEFAULT_COLOR;
    case 'frequency':
      return frequencyColor(miner.frequency) ?? DEFAULT_COLOR;
    case 'voltage':
      return voltageColor(miner.coreVoltageActual, miner.coreVoltage) ?? DEFAULT_COLOR;
    case 'fanRpm':
      return fanSpeedColor(miner.fanspeed) ?? DEFAULT_COLOR;
    default:
      return DEFAULT_COLOR;
  }
}
