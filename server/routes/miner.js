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

const MAX_HOSTNAME_LENGTH = 64;
const MAX_WIFI_SSID_LENGTH = 32;
const MIN_WIFI_PASSWORD_LENGTH = 8;
const MAX_WIFI_PASSWORD_LENGTH = 63;

const ALLOWED_SETTINGS_KEYS = new Set([
  'frequency',
  'coreVoltage',
  'overheat_temp',
  'autofanspeed',
  'pidTargetTemp',
  'manualFanSpeed',
  'autoscreenoff',
  'flipscreen',
  'hostname',
  'ssid',
  'wifiPass',
  'stratumURL',
  'stratumPort',
  'stratumUser',
  'stratumPassword',
  'stratumTLS',
  'fallbackStratumURL',
  'fallbackStratumPort',
  'fallbackStratumUser',
  'fallbackStratumPassword',
  'fallbackStratumTLS',
  'poolMode',
  'stratumTcpKeepalive',
  'stratum_keep',
  'stratumExtranonceSubscribe',
  'fallbackStratumExtranonceSubscribe',
  'stratumEnonceSubscribe',
  'fallbackStratumEnonceSubscribe',
]);

const MAX_STRATUM_URL_LENGTH = 512;
const MAX_STRATUM_USER_LENGTH = 128;
const MAX_STRATUM_PASSWORD_LENGTH = 128;
const MIN_PORT = 1;
const MAX_PORT = 65535;

function toBool(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return undefined;
}

function validateSettings(body) {
  const payload = {};
  const errors = [];

  for (const key of Object.keys(body)) {
    if (!ALLOWED_SETTINGS_KEYS.has(key)) continue;
    const value = body[key];
    switch (key) {
      case 'frequency':
      case 'coreVoltage':
      case 'overheat_temp':
      case 'pidTargetTemp':
      case 'manualFanSpeed': {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          errors.push(`${key}: must be a number`);
          break;
        }
        payload[key] = n;
        break;
      }
      case 'stratumPort':
      case 'fallbackStratumPort': {
        const n = Number(value);
        if (!Number.isFinite(n) || n < MIN_PORT || n > MAX_PORT) {
          errors.push(`${key}: must be a number between ${MIN_PORT} and ${MAX_PORT}`);
          break;
        }
        payload[key] = Math.floor(n);
        break;
      }
      case 'autofanspeed':
      case 'autoscreenoff':
      case 'flipscreen':
      case 'stratumTLS':
      case 'fallbackStratumTLS': {
        const b = toBool(value);
        if (b === undefined) {
          errors.push(`${key}: must be boolean or 0/1`);
          break;
        }
        payload[key] = b;
        break;
      }
      case 'stratumURL':
      case 'fallbackStratumURL': {
        if (value !== '' && value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value).trim();
        if (s.length > MAX_STRATUM_URL_LENGTH) {
          errors.push(`${key}: max length ${MAX_STRATUM_URL_LENGTH}`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'stratumUser':
      case 'fallbackStratumUser': {
        if (value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value).trim();
        if (s.length > MAX_STRATUM_USER_LENGTH) {
          errors.push(`${key}: max length ${MAX_STRATUM_USER_LENGTH}`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'stratumPassword':
      case 'fallbackStratumPassword': {
        if (value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value).trim();
        if (s.length > MAX_STRATUM_PASSWORD_LENGTH) {
          errors.push(`${key}: max length ${MAX_STRATUM_PASSWORD_LENGTH}`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'poolMode': {
        const s = value != null ? String(value).trim().toLowerCase() : '';
        const allowed = ['failover', 'dual', '0', '1'];
        if (s !== '' && !allowed.includes(s)) {
          errors.push(`${key}: must be one of failover, dual`);
          break;
        }
        payload[key] = s || 'failover';
        break;
      }
      case 'hostname': {
        if (value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value).trim();
        if (s.length > MAX_HOSTNAME_LENGTH) {
          errors.push(`${key}: max length ${MAX_HOSTNAME_LENGTH}`);
          break;
        }
        if (s !== '' && !/^[a-zA-Z0-9-]+$/.test(s)) {
          errors.push(`${key}: alphanumeric and hyphens only`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'ssid': {
        if (value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value).trim();
        if (s.length > MAX_WIFI_SSID_LENGTH) {
          errors.push(`${key}: max length ${MAX_WIFI_SSID_LENGTH}`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'wifiPass': {
        if (value != null && typeof value !== 'string') {
          errors.push(`${key}: must be a string`);
          break;
        }
        const s = value == null ? '' : String(value);
        if (s.length > 0 && (s.length < MIN_WIFI_PASSWORD_LENGTH || s.length > MAX_WIFI_PASSWORD_LENGTH)) {
          errors.push(`${key}: when set, length must be ${MIN_WIFI_PASSWORD_LENGTH}-${MAX_WIFI_PASSWORD_LENGTH}`);
          break;
        }
        payload[key] = s;
        break;
      }
      case 'stratumTcpKeepalive':
      case 'stratum_keep':
      case 'stratumExtranonceSubscribe':
      case 'fallbackStratumExtranonceSubscribe':
      case 'stratumEnonceSubscribe':
      case 'fallbackStratumEnonceSubscribe': {
        const b = toBool(value);
        if (b === undefined) {
          errors.push(`${key}: must be boolean or 0/1`);
          break;
        }
        payload[key] = b;
        break;
      }
      default:
        payload[key] = value;
    }
  }

  return { payload, errors };
}

// PATCH /api/miner/settings -> miner's PATCH /api/system
router.patch('/settings', async (req, res) => {
  try {
    const { payload, errors } = validateSettings(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', detail: errors.join('; ') });
    }
    const response = await fetch(`http://${MINER_IP()}/api/system`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
