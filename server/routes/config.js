import { Router } from 'express';
import { getConfig, updateAndSave } from '../config/dashboardConfig.js';
import { DASHBOARD_DEFAULTS } from '../config/dashboardDefaults.js';

const router = Router();

function validateNumber(value, min, max, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (min != null && n < min) return `${label} must be at least ${min}`;
  if (max != null && n > max) return `${label} must be at most ${max}`;
  return null;
}

function validateMetricRanges(ranges) {
  if (ranges == null) return null;
  if (typeof ranges !== 'object') return 'metricRanges must be an object';
  const known = Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  for (const key of Object.keys(ranges)) {
    if (!known.includes(key)) return `Unknown metric: ${key}`;
    const m = ranges[key];
    if (typeof m !== 'object' || m === null) return `metricRanges.${key} must be an object`;
  }
  return null;
}

const HEX_COLOR = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
function validateAccentColor(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'accentColor must be a string';
  if (value === '') return null;
  if (!HEX_COLOR.test(value)) return 'accentColor must be a hex color (e.g. #d946ef) or empty';
  return null;
}

// GET /api/config
router.get('/', (_req, res) => {
  res.json(getConfig());
});

// PATCH /api/config
router.patch('/', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }

  const errors = [];

  if (body.minerIp !== undefined) {
    if (typeof body.minerIp !== 'string') errors.push('minerIp must be a string');
  }
  if (body.defaultExpectedHashrateGh !== undefined) {
    const e = validateNumber(body.defaultExpectedHashrateGh, 1, 100_000, 'defaultExpectedHashrateGh');
    if (e) errors.push(e);
  }
  if (body.pollMinerIntervalMs !== undefined) {
    const e = validateNumber(body.pollMinerIntervalMs, 1000, 300_000, 'pollMinerIntervalMs');
    if (e) errors.push(e);
  }
  if (body.pollNetworkIntervalMs !== undefined) {
    const e = validateNumber(body.pollNetworkIntervalMs, 5000, 600_000, 'pollNetworkIntervalMs');
    if (e) errors.push(e);
  }
  const mrErr = validateMetricRanges(body.metricRanges);
  if (mrErr) errors.push(mrErr);
  const accentErr = validateAccentColor(body.accentColor);
  if (accentErr) errors.push(accentErr);

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const updated = updateAndSave(body);
    res.json(updated);
  } catch (err) {
    console.error('Config save failed:', err.message);
    res.status(500).json({ error: 'Failed to save config', detail: err.message });
  }
});

export default router;
