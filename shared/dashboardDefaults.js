/**
 * Single source of truth for dashboard config defaults.
 * Used by server (config load/merge, validation) and client (fallback when GET /api/config fails).
 */
export const DASHBOARD_DEFAULTS = {
  minerIp: '',
  defaultExpectedHashrateGh: 6000,
  pollMinerIntervalMs: 10_000,
  pollNetworkIntervalMs: 60_000,
  metricRanges: {
    hashrate: { greenMin: 5950, orangeMin: 5500, gaugeMax: 7000 },
    efficiency: { greenMax: 20, orangeMax: 25, gaugeMax: 30 },
    temp: { greenMax: 55.5, orangeMax: 65, gaugeMax: 85 },
    fanRpm: { orangeMinPct: 65, orangeMaxPct: 75 },
    current: { greenMax: 9.4, orangeMax: 9.75, gaugeMax: 10.5 },
    frequency: { greenMin: 700, orangeMin: 650, gaugeMax: 850 },
    voltage: { greenMv: 20, orangeMv: 50, gaugeMax: 1400 },
    power: { greenMax: 115, orangeMax: 117.5, gaugeMax: 130 },
  },
};
