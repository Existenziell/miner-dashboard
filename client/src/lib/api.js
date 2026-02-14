import { parseMinerSettings } from 'shared/schemas/minerApi.js';

const BASE = '';

export async function fetchDashboardConfig() {
  const res = await fetch(`${BASE}/api/config`);
  if (!res.ok) throw new Error(`Config API error: ${res.status}`);
  return res.json();
}

export async function patchDashboardConfig(partial) {
  const res = await fetch(`${BASE}/api/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  });
  if (!res.ok) {
    let msg = `Config PATCH error: ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) msg += ` — ${data.detail}`;
      else if (data.error) msg += ` — ${data.error}`;
      else if (data.details) msg += ` — ${data.details.join(', ')}`;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMinerInfo(opts = {}) {
  const { ts, cur } = opts;
  const url = new URL(`${BASE}/api/miner/info`, window.location.origin);
  if (ts != null) url.searchParams.set('ts', String(ts));
  if (cur != null) url.searchParams.set('cur', String(cur));
  const res = await fetch(url.pathname + url.search);
  if (!res.ok) {
    let msg = `Miner API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data.error && data.detail) msg = `${data.error}. ${data.detail}`;
      else if (data.detail) msg = data.detail;
      else if (data.error) msg = data.error;
    } catch {
      // ignore non-JSON response
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMinerAsic() {
  const res = await fetch(`${BASE}/api/miner/asic`);
  if (!res.ok) throw new Error(`Miner ASIC API error: ${res.status}`);
  return res.json();
}

export async function fetchNetworkStatus() {
  const res = await fetch(`${BASE}/api/network/status`);
  if (!res.ok) throw new Error(`Network API error: ${res.status}`);
  return res.json();
}

export async function patchMinerSettings(settings) {
  const { success, payload, error } = parseMinerSettings(settings);
  if (!success) {
    throw new Error(`Validation failed: ${error}`);
  }
  const body = Object.keys(payload).length === 0 ? {} : payload;
  const res = await fetch(`${BASE}/api/miner/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Miner PATCH error: ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) msg += ` — ${data.detail}`;
      else if (data.error) msg += ` — ${data.error}`;
    } catch {
      // ignore non-JSON or empty error response
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function restartMiner() {
  const res = await fetch(`${BASE}/api/miner/restart`, { method: 'POST' });
  if (!res.ok) throw new Error(`Miner restart error: ${res.status}`);
  return res.json();
}

export async function shutdownMiner() {
  const res = await fetch(`${BASE}/api/miner/shutdown`, { method: 'POST' });
  if (!res.ok) throw new Error(`Miner shutdown error: ${res.status}`);
  return res.json();
}
