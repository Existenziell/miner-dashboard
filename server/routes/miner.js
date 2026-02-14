import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { getMinerIp } from '../config/dashboardConfig.js';
import { parseMinerSettings } from '../../shared/schemas/minerApi.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function getMinerOr502(res) {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
    return null;
  }
  return MINER_IP;
}

/** Parse SHA256 from a checksum file (first token or line). */
function parseSha256FromChecksumContent(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^([a-fA-F0-9]{64})\s/);
  if (match) return match[1].toLowerCase();
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

// Proxy GET /api/miner/info -> miner's /api/system/info (optional query: ts, cur)
router.get('/info', async (req, res) => {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    return res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
  }
  try {
    const { ts, cur } = req.query;
    const url = new URL(`http://${MINER_IP}/api/system/info`);
    if (ts != null) url.searchParams.set('ts', String(ts));
    if (cur != null) url.searchParams.set('cur', String(cur));
    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Miner API error', status: response.status });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Failed to reach miner:', err.message);
    res.status(502).json({ error: 'Cannot reach miner', detail: err.message });
  }
});

// Proxy GET /api/miner/asic -> miner's /api/system/asic (frequency/voltage options).
// Expected miner API response fields used by the dashboard:
//   frequencyOptions: number[]   - official frequency steps (MHz)
//   voltageOptions: number[]    - official voltage steps (mV)
//   defaultFrequency: number    - default frequency (MHz)
//   defaultVoltage: number      - default core voltage (mV)
//   absMinFrequency: number     - board min frequency (MHz), optional
//   absMaxFrequency: number     - board max frequency (MHz), e.g. 800
//   absMinVoltage: number       - board min core voltage (mV), optional
//   absMaxVoltage: number       - board max core voltage (mV), e.g. 1200 or 1400
router.get('/asic', async (_req, res) => {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    return res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
  }
  try {
    const response = await fetch(`http://${MINER_IP}/api/system/asic`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Miner ASIC API error', status: response.status });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Failed to reach miner:', err.message);
    res.status(502).json({ error: 'Cannot reach miner', detail: err.message });
  }
});

// PATCH /api/miner/settings -> miner's PATCH /api/system
router.patch('/settings', async (req, res) => {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    return res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
  }
  try {
    const { success, payload, error } = parseMinerSettings(req.body);
    if (!success) {
      return res.status(400).json({ error: 'Validation failed', detail: error });
    }
    if (Object.keys(payload).length === 0) {
      return res.json({ success: true });
    }
    const response = await fetch(`http://${MINER_IP}/api/system`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 400) {
        console.error('Miner PATCH 400 — payload:', JSON.stringify(payload), '— miner response:', text);
      }
      return res.status(response.status).json({ error: 'Miner PATCH error', detail: text });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update miner settings:', err.message);
    res.status(502).json({ error: 'Cannot reach miner', detail: err.message });
  }
});

// POST /api/miner/restart -> miner's POST /api/system/restart
router.post('/restart', async (_req, res) => {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    return res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
  }
  try {
    const response = await fetch(`http://${MINER_IP}/api/system/restart`, {
      method: 'POST',
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Miner restart error' });
    }
    res.json({ success: true, message: 'Miner restarting...' });
  } catch (err) {
    console.error('Failed to restart miner:', err.message);
    res.status(502).json({ error: 'Cannot reach miner', detail: err.message });
  }
});

// POST /api/miner/shutdown -> miner's POST /api/system/shutdown
router.post('/shutdown', async (_req, res) => {
  const MINER_IP = getMinerIp();
  if (!MINER_IP) {
    return res.status(502).json({ error: 'Miner address not configured', detail: 'Set miner IP in Dashboard Settings or in .env (MINER_IP).' });
  }
  try {
    const response = await fetch(`http://${MINER_IP}/api/system/shutdown`, {
      method: 'POST',
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Miner shutdown error' });
    }
    res.json({ success: true, message: 'Miner shutting down...' });
  } catch (err) {
    console.error('Failed to shutdown miner:', err.message);
    res.status(502).json({ error: 'Cannot reach miner', detail: err.message });
  }
});

// POST /api/miner/firmware/install — download from URL, verify checksum, then forward to miner
router.post('/firmware/install', async (req, res) => {
  const MINER_IP = getMinerOr502(res);
  if (!MINER_IP) return;
  const { url, keepSettings, expectedSha256 } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url', detail: 'Body must include url (firmware download URL).' });
  }
  try {
    const firmwareRes = await fetch(url);
    if (!firmwareRes.ok) {
      return res.status(502).json({ error: 'Firmware download failed', detail: `HTTP ${firmwareRes.status}` });
    }
    const buffer = Buffer.from(await firmwareRes.arrayBuffer());
    const computedSha256 = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();

    let expected = expectedSha256 && String(expectedSha256).trim().toLowerCase();
    if (!expected) {
      const checksumUrl = url.endsWith('.sha256') ? null : `${url}.sha256`;
      if (checksumUrl) {
        const csRes = await fetch(checksumUrl);
        if (csRes.ok) {
          const text = await csRes.text();
          expected = parseSha256FromChecksumContent(text);
        }
      }
    }
    if (expected && computedSha256 !== expected) {
      return res.status(400).json({
        error: 'Checksum mismatch',
        detail: 'Firmware file does not match the expected SHA256. Download may be corrupted or tampered.',
        checksumVerified: false,
        computedSha256,
        expectedSha256: expected,
      });
    }

    const form = new FormData();
    form.append('file', new Blob([buffer]), 'firmware.bin');
    if (keepSettings) form.append('keepSettings', '1');

    const updateRes = await fetch(`http://${MINER_IP}/api/update`, {
      method: 'POST',
      body: form,
    });
    if (!updateRes.ok) {
      const text = await updateRes.text();
      return res.status(updateRes.status).json({ error: 'Miner update error', detail: text || `HTTP ${updateRes.status}` });
    }
    res.json({
      success: true,
      message: 'Firmware install started. Device may reboot.',
      checksumVerified: !!expected,
      computedSha256: expected ? computedSha256 : undefined,
      expectedSha256: expected || undefined,
    });
  } catch (err) {
    console.error('Firmware install failed:', err.message);
    res.status(502).json({ error: 'Install failed', detail: err.message });
  }
});

// POST /api/miner/firmware/flash — multipart file upload, forward to miner (type=firmware | www)
router.post('/firmware/flash', upload.single('file'), async (req, res) => {
  const MINER_IP = getMinerOr502(res);
  if (!MINER_IP) return;
  const file = req.file;
  if (!file || !file.buffer) {
    return res.status(400).json({ error: 'Missing file', detail: 'Upload a file (multipart field: file).' });
  }
  const type = (req.query.type || req.body?.type || 'firmware').toLowerCase();
  try {
    const form = new FormData();
    const name = file.originalname || (type === 'www' ? 'www.bin' : 'firmware.bin');
    form.append('file', new Blob([file.buffer]), name);

    const endpoint = type === 'www' ? '/api/www/update' : '/api/update';
    const updateRes = await fetch(`http://${MINER_IP}${endpoint}`, {
      method: 'POST',
      body: form,
    });
    if (!updateRes.ok) {
      const text = await updateRes.text();
      return res.status(updateRes.status).json({ error: 'Miner flash error', detail: text || `HTTP ${updateRes.status}` });
    }
    res.json({ success: true, message: type === 'www' ? 'WWW upload started.' : 'Firmware flash started. Device may reboot.' });
  } catch (err) {
    console.error('Firmware flash failed:', err.message);
    res.status(502).json({ error: 'Flash failed', detail: err.message });
  }
});

export default router;
