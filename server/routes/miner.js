import { Router } from 'express';

const router = Router();

const MINER_IP = () => process.env.MINER_IP;

// Proxy GET /api/miner/info -> miner's /api/system/info (optional query: ts, cur)
router.get('/info', async (req, res) => {
  try {
    const { ts, cur } = req.query;
    const url = new URL(`http://${MINER_IP()}/api/system/info`);
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
  try {
    const response = await fetch(`http://${MINER_IP()}/api/system/asic`);
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
  try {
    const response = await fetch(`http://${MINER_IP()}/api/system`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const text = await response.text();
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
  try {
    const response = await fetch(`http://${MINER_IP()}/api/system/restart`, {
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
  try {
    const response = await fetch(`http://${MINER_IP()}/api/system/shutdown`, {
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

export default router;
