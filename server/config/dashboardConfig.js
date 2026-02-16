import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DASHBOARD_DEFAULTS } from './dashboardDefaults.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_DIR = path.join(__dirname, '..', '..');
const DEFAULT_PATH = path.join(CONFIG_DIR, 'config', 'dashboard.json');

function getConfigPath() {
  return DEFAULT_PATH;
}

function deepMergeMetricRanges(defaults, fromFile) {
  if (!fromFile || typeof fromFile !== 'object') return { ...defaults };
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (fromFile[key] && typeof fromFile[key] === 'object') {
      out[key] = { ...defaults[key], ...fromFile[key] };
    }
  }
  return out;
}

function deepMergeChartColors(defaults, fromFile) {
  if (!fromFile || typeof fromFile !== 'object') return { ...defaults };
  const out = {};
  for (const chartKey of Object.keys(defaults)) {
    const d = defaults[chartKey];
    const f = fromFile[chartKey];
    if (typeof d !== 'object' || d === null) continue;
    out[chartKey] = { ...d };
    if (f && typeof f === 'object') {
      for (const seriesKey of Object.keys(f)) {
        if (d[seriesKey] !== undefined && typeof f[seriesKey] === 'string') {
          out[chartKey][seriesKey] = f[seriesKey];
        }
      }
    }
  }
  return out;
}

const DEFAULT_METRIC_ORDER = DASHBOARD_DEFAULTS.metricOrder;
const KNOWN_METRICS = new Set(Object.keys(DASHBOARD_DEFAULTS.metricRanges));

function mergeMetricOrder(fromFile) {
  if (!Array.isArray(fromFile) || fromFile.length !== KNOWN_METRICS.size) {
    return [...DEFAULT_METRIC_ORDER];
  }
  const seen = new Set();
  for (const id of fromFile) {
    if (typeof id !== 'string' || !KNOWN_METRICS.has(id) || seen.has(id)) {
      return [...DEFAULT_METRIC_ORDER];
    }
    seen.add(id);
  }
  return [...fromFile];
}

function mergeGaugeVisible(fromFile) {
  const defaults = Object.fromEntries([...KNOWN_METRICS].map((id) => [id, true]));
  if (!fromFile || typeof fromFile !== 'object') return defaults;
  for (const id of KNOWN_METRICS) {
    if (typeof fromFile[id] === 'boolean') {
      defaults[id] = fromFile[id];
    }
  }
  return defaults;
}

const KNOWN_CHARTS = new Set(Object.keys(DASHBOARD_DEFAULTS.chartColors));
const DEFAULT_CHART_ORDER = DASHBOARD_DEFAULTS.chartOrder;

function mergeChartOrder(fromFile) {
  if (!Array.isArray(fromFile) || fromFile.length !== KNOWN_CHARTS.size) {
    return [...DEFAULT_CHART_ORDER];
  }
  const seen = new Set();
  for (const id of fromFile) {
    if (typeof id !== 'string' || !KNOWN_CHARTS.has(id) || seen.has(id)) {
      return [...DEFAULT_CHART_ORDER];
    }
    seen.add(id);
  }
  return [...fromFile];
}

function mergeChartVisible(fromFile) {
  const defaults = Object.fromEntries([...KNOWN_CHARTS].map((id) => [id, true]));
  if (!fromFile || typeof fromFile !== 'object') return defaults;
  for (const id of KNOWN_CHARTS) {
    if (typeof fromFile[id] === 'boolean') {
      defaults[id] = fromFile[id];
    }
  }
  return defaults;
}

function mergeWithDefaults(fileObj) {
  if (!fileObj || typeof fileObj !== 'object') return { ...DASHBOARD_DEFAULTS };
  const metricRanges = deepMergeMetricRanges(
    DASHBOARD_DEFAULTS.metricRanges,
    fileObj.metricRanges
  );
  const chartColors = deepMergeChartColors(
    DASHBOARD_DEFAULTS.chartColors,
    fileObj.chartColors
  );
  const metricOrder = mergeMetricOrder(fileObj.metricOrder);
  const chartOrder = mergeChartOrder(fileObj.chartOrder);
  const gaugeVisible = mergeGaugeVisible(fileObj.gaugeVisible);
  const chartVisible = mergeChartVisible(fileObj.chartVisible);
  return {
    ...DASHBOARD_DEFAULTS,
    ...fileObj,
    metricRanges,
    chartColors,
    metricOrder,
    chartOrder,
    gaugeVisible,
    chartVisible,
  };
}

const ALLOWED_KEYS = new Set(Object.keys(DASHBOARD_DEFAULTS));
function onlyAllowed(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => ALLOWED_KEYS.has(k)));
}

let inMemoryConfig = onlyAllowed(mergeWithDefaults(null));

function loadFromFile() {
  const filePath = getConfigPath();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    inMemoryConfig = onlyAllowed(mergeWithDefaults(parsed));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Dashboard config: could not read', filePath, err.message);
    }
    inMemoryConfig = onlyAllowed({ ...DASHBOARD_DEFAULTS });
  }
}

export function getConfig() {
  return { ...inMemoryConfig };
}

/** Miner IP: env overrides config file (for deployment). */
export function getMinerIp() {
  const fromEnv = process.env.MINER_IP?.trim();
  if (fromEnv) return fromEnv;
  return inMemoryConfig.minerIp?.trim() ?? '';
}

export function updateAndSave(partial) {
  const next = mergeWithDefaults({ ...inMemoryConfig, ...partial });
  inMemoryConfig = onlyAllowed(next);
  const filePath = getConfigPath();
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(inMemoryConfig, null, 2), 'utf8');
  } catch (err) {
    console.error('Dashboard config: could not write', filePath, err.message);
    throw err;
  }
  return getConfig();
}

loadFromFile();
