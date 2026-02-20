/**
 * Single source of truth for dashboard config defaults.
 * Used by server (config load/merge, validation) and client (fallback when GET /api/config fails).
 */
export const DASHBOARD_DEFAULTS = {
  minerIp: '',
  defaultExpectedHashrateGh: 6000,
  pollMinerIntervalMs: 10_000,
  pollNetworkIntervalMs: 60_000,
  pollSystemIntervalMs: 20_000,
  accentColor: '#06b6d4',
  chartColors: {
    power: { power: '#d946ef', currentA: '#06b6d4' },
    temperature: { temp: '#d946ef', vrTemp: '#06b6d4' },
    hashrate: {
      hashRate: '#d946ef',
      hashRate_1m: '#06b6d4',
      hashRate_10m: '#eff2bd',
      hashRate_1h: '#16a34a',
      hashRate_1d: '#f7931a',
    },
  },
  chartOrder: ['hashrate', 'temperature', 'power'],
  chartVisible: {
    hashrate: true,
    temperature: true,
    power: true,
  },
  metricRanges: {
    hashrate: { min: 5900, gaugeMax: 7000 },
    efficiency: { max: 25, gaugeMax: 30 },
    temp: { max: 60, gaugeMax: 100 },
    fanRpm: { maxPct: 75 },
    current: { max: 9.5, gaugeMax: 11 },
    frequency: { min: 650, gaugeMax: 900 },
    voltage: { maxMv: 50, gaugeMax: 1500 },
    power: { max: 115, gaugeMax: 130 },
  },
  metricOrder: [
    'hashrate',
    'temp',
    'fanRpm',
    'efficiency',
    'frequency',
    'voltage',
    'current',
    'power',
  ],
  gaugeVisible: {
    hashrate: true,
    temp: true,
    fanRpm: true,
    efficiency: true,
    frequency: true,
    voltage: true,
    current: true,
    power: true,
  },
  minerImageVisible: true,
  minerImageFile: '',
  minerImageFilename: '',
  sectionVisible: {
    shares: true,
    bitcoinNetwork: true,
    system: true,
    miningOdds: true,
    poolSettings: true,
  },
};
