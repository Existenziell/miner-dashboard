import { Router } from 'express';

const router = Router();

const MINER_IP = () => process.env.MINER_IP || '192.168.1.3';

// Proxy GET /api/miner/info -> miner's /api/system/info
router.get('/info', async (_req, res) => {
  try {
    const response = await fetch(`http://${MINER_IP()}/api/system/info`);
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

// Proxy GET /api/miner/asic -> miner's /api/system/asic (frequency/voltage options)
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
