import { Router } from 'express';
import { getConfig, updateAndSave } from '../config/dashboardConfig.js';
import { DASHBOARD_DEFAULTS } from '../config/dashboardDefaults.js';
import { isValidHexColor } from '../../shared/hexColor.js';

const router = Router();

function validateNumber(value, min, max, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (min != null && n < min) return `${label} must be at least ${min}`;
  if (max != null && n > max) return `${label} must be at most ${max}`;
  return null;
}

const KNOWN_METRICS = new Set(Object.keys(DASHBOARD_DEFAULTS.metricRanges));

function validateMetricRanges(ranges) {
  if (ranges == null) return null;
  if (typeof ranges !== 'object') return 'metricRanges must be an object';
  for (const key of Object.keys(ranges)) {
    if (!KNOWN_METRICS.has(key)) return `Unknown metric: ${key}`;
    const m = ranges[key];
    if (typeof m !== 'object' || m === null) return `metricRanges.${key} must be an object`;
  }
  return null;
}

function validateMetricOrder(order) {
  if (order === undefined) return null;
  if (!Array.isArray(order)) return 'metricOrder must be an array';
  if (order.length !== KNOWN_METRICS.size) {
    return `metricOrder must contain exactly ${KNOWN_METRICS.size} metric ids`;
  }
  const seen = new Set();
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    if (typeof id !== 'string') return `metricOrder[${i}] must be a string`;
    if (!KNOWN_METRICS.has(id)) return `metricOrder: unknown metric "${id}"`;
    if (seen.has(id)) return `metricOrder: duplicate metric "${id}"`;
    seen.add(id);
  }
  return null;
}

function validateAccentColor(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'accentColor must be a string';
  if (value === '') return null;
  if (!isValidHexColor(value)) return 'accentColor must be a hex color (e.g. #d946ef) or empty';
  return null;
}

function validateChartColors(value) {
  if (value === undefined) return null;
  if (typeof value !== 'object' || value === null) return 'chartColors must be an object';
  const knownCharts = Object.keys(DASHBOARD_DEFAULTS.chartColors);
  for (const chartKey of Object.keys(value)) {
    if (!knownCharts.includes(chartKey)) return `chartColors: unknown chart "${chartKey}"`;
    const chart = value[chartKey];
    if (typeof chart !== 'object' || chart === null) return `chartColors.${chartKey} must be an object`;
    const knownSeries = Object.keys(DASHBOARD_DEFAULTS.chartColors[chartKey]);
    for (const seriesKey of Object.keys(chart)) {
      if (!knownSeries.includes(seriesKey)) return `chartColors.${chartKey}: unknown series "${seriesKey}"`;
      if (typeof chart[seriesKey] !== 'string' || !isValidHexColor(chart[seriesKey])) {
        return `chartColors.${chartKey}.${seriesKey} must be a hex color`;
      }
    }
  }
  return null;
}

function validateGaugeVisible(value) {
  if (value === undefined) return null;
  if (typeof value !== 'object' || value === null) return 'gaugeVisible must be an object';
  for (const key of Object.keys(value)) {
    if (!KNOWN_METRICS.has(key)) return `gaugeVisible: unknown metric "${key}"`;
    if (typeof value[key] !== 'boolean') return `gaugeVisible.${key} must be a boolean`;
  }
  return null;
}

const KNOWN_CHARTS = new Set(Object.keys(DASHBOARD_DEFAULTS.chartColors));

function validateChartOrder(order) {
  if (order === undefined) return null;
  if (!Array.isArray(order)) return 'chartOrder must be an array';
  if (order.length !== KNOWN_CHARTS.size) {
    return `chartOrder must contain exactly ${KNOWN_CHARTS.size} chart ids`;
  }
  const seen = new Set();
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    if (typeof id !== 'string') return `chartOrder[${i}] must be a string`;
    if (!KNOWN_CHARTS.has(id)) return `chartOrder: unknown chart "${id}"`;
    if (seen.has(id)) return `chartOrder: duplicate chart "${id}"`;
    seen.add(id);
  }
  return null;
}

function validateChartVisible(value) {
  if (value === undefined) return null;
  if (typeof value !== 'object' || value === null) return 'chartVisible must be an object';
  for (const key of Object.keys(value)) {
    if (!KNOWN_CHARTS.has(key)) return `chartVisible: unknown chart "${key}"`;
    if (typeof value[key] !== 'boolean') return `chartVisible.${key} must be a boolean`;
  }
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
  const orderErr = validateMetricOrder(body.metricOrder);
  if (orderErr) errors.push(orderErr);
  const chartOrderErr = validateChartOrder(body.chartOrder);
  if (chartOrderErr) errors.push(chartOrderErr);
  const accentErr = validateAccentColor(body.accentColor);
  if (accentErr) errors.push(accentErr);
  const chartErr = validateChartColors(body.chartColors);
  if (chartErr) errors.push(chartErr);
  const gaugeVisibleErr = validateGaugeVisible(body.gaugeVisible);
  if (gaugeVisibleErr) errors.push(gaugeVisibleErr);
  const chartVisibleErr = validateChartVisible(body.chartVisible);
  if (chartVisibleErr) errors.push(chartVisibleErr);

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
