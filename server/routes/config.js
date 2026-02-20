import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { getConfig, updateAndSave, getConfigDir } from '../config/dashboardConfig.js';
import { DASHBOARD_DEFAULTS } from '../config/dashboardDefaults.js';
import { isValidHexColor } from '../../shared/hexColor.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 } }); // 500KB

const MINER_IMAGE_FILE_PATTERN = /^miner-image\.(jpe?g|png|gif|webp)$/i;
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

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

function validateMinerImageVisible(value) {
  if (value === undefined) return null;
  if (typeof value !== 'boolean') return 'minerImageVisible must be a boolean';
  return null;
}

function validateMinerImageFile(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'minerImageFile must be a string';
  if (value === '') return null;
  if (!MINER_IMAGE_FILE_PATTERN.test(value)) {
    return 'minerImageFile must be miner-image.jpg, .jpeg, .png, .gif, or .webp';
  }
  return null;
}

function validateMinerImageFilename(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'minerImageFilename must be a string';
  if (value.length > 255) return 'minerImageFilename must be at most 255 characters';
  return null;
}

// GET /api/config/miner-image — serve the miner image file
router.get('/miner-image', (req, res) => {
  const config = getConfig();
  const minerImageFile = (config.minerImageFile || '').trim();
  if (!minerImageFile || !MINER_IMAGE_FILE_PATTERN.test(minerImageFile)) {
    return res.status(404).end();
  }
  const filePath = path.join(getConfigDir(), minerImageFile);
  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }
  const ext = path.extname(minerImageFile).toLowerCase();
  const contentType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.sendFile(path.resolve(filePath), (err) => {
    if (err && !res.headersSent) res.status(500).end();
  });
});

// POST /api/config/miner-image — upload miner image (multipart)
router.post('/miner-image', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file || !file.buffer) {
    return res.status(400).json({ error: 'Missing file', detail: 'Upload an image (multipart field: file).' });
  }
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Invalid file', detail: 'File must be an image (JPEG, PNG, GIF, or WebP).' });
  }
  const ext = MIME_TO_EXT[file.mimetype] || (file.mimetype === 'image/jpeg' ? 'jpg' : path.extname(file.originalname || '').slice(1) || 'jpg');
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase()) ? ext : 'jpg';
  const filename = `miner-image.${safeExt}`;
  const displayName = (req.body.filename && typeof req.body.filename === 'string') ? req.body.filename.trim().slice(0, 255) : (file.originalname || filename);
  const configDir = getConfigDir();
  const filePath = path.join(configDir, filename);
  try {
    const previous = getConfig();
    if ((previous.minerImageFile || '').trim() && previous.minerImageFile !== filename) {
      const oldPath = path.join(configDir, previous.minerImageFile);
      if (MINER_IMAGE_FILE_PATTERN.test(previous.minerImageFile) && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    fs.writeFileSync(filePath, file.buffer);
    const updated = updateAndSave({ minerImageFile: filename, minerImageFilename: displayName });
    res.json(updated);
  } catch (err) {
    console.error('Miner image save failed:', err.message);
    res.status(500).json({ error: 'Failed to save miner image', detail: err.message });
  }
});

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
  if (body.pollSystemIntervalMs !== undefined) {
    const e = validateNumber(body.pollSystemIntervalMs, 1000, 300_000, 'pollSystemIntervalMs');
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
  const minerImageVisibleErr = validateMinerImageVisible(body.minerImageVisible);
  if (minerImageVisibleErr) errors.push(minerImageVisibleErr);
  const minerImageFileErr = validateMinerImageFile(body.minerImageFile);
  if (minerImageFileErr) errors.push(minerImageFileErr);
  const minerImageFilenameErr = validateMinerImageFilename(body.minerImageFilename);
  if (minerImageFilenameErr) errors.push(minerImageFilenameErr);

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const previous = getConfig();
    const updated = updateAndSave(body);
    if (body.minerImageFile === '' && (previous.minerImageFile || '').trim().length > 0) {
      const oldPath = path.join(getConfigDir(), previous.minerImageFile);
      try {
        if (MINER_IMAGE_FILE_PATTERN.test(previous.minerImageFile) && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') {
          console.warn('Could not delete old miner image file:', oldPath, unlinkErr.message);
        }
      }
    }
    res.json(updated);
  } catch (err) {
    console.error('Config save failed:', err.message);
    res.status(500).json({ error: 'Failed to save config', detail: err.message });
  }
});

export default router;
