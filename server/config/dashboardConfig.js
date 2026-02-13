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

function mergeWithDefaults(fileObj) {
  if (!fileObj || typeof fileObj !== 'object') return { ...DASHBOARD_DEFAULTS };
  const metricRanges = deepMergeMetricRanges(
    DASHBOARD_DEFAULTS.metricRanges,
    fileObj.metricRanges
  );
  return {
    ...DASHBOARD_DEFAULTS,
    ...fileObj,
    metricRanges,
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
