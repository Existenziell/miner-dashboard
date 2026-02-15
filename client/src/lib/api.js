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

export async function fetchFirmwareReleases(opts = {}) {
  const { includePrereleases = false } = opts;
  const url = new URL(`${BASE}/api/firmware/releases`, window.location.origin);
  url.searchParams.set('includePrereleases', String(includePrereleases));
  const res = await fetch(url.pathname + url.search);
  if (!res.ok) {
    let msg = `Releases error: ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) msg += ` — ${data.detail}`;
      else if (data.error) msg += ` — ${data.error}`;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Fetch checksum for an asset (e.g. from release asset checksumUrl). Returns SHA256 hex string or null. */
export async function fetchFirmwareChecksum(checksumUrl) {
  if (!checksumUrl) return null;
  const res = await fetch(checksumUrl);
  if (!res.ok) return null;
  const text = await res.text();
  const match = text.trim().match(/^([a-fA-F0-9]{64})\s/) || text.trim().match(/^([a-fA-F0-9]{64})$/);
  return match ? match[1].toLowerCase() : null;
}

/** Download firmware from URL and verify checksum. Returns { blob, computedSha256, expectedSha256, checksumVerified }. Does not flash. */
export async function downloadFirmwareFromUrl(payload) {
  const { url, expectedSha256 } = payload;
  const res = await fetch(`${BASE}/api/firmware/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, expectedSha256 }),
  });
  if (!res.ok) {
    let msg = 'Firmware download failed';
    let body = null;
    try {
      body = await res.json();
      if (body.detail) msg = body.detail;
      else if (body.error) msg = body.error;
    } catch {
      // ignore
    }
    const err = new Error(msg);
    if (body && (body.checksumVerified !== undefined || body.computedSha256 != null)) {
      err.installErrorBody = body;
    }
    throw err;
  }
  const blob = await res.blob();
  const computedSha256 = res.headers.get('X-Computed-Sha256') || null;
  const expectedFromHeader = res.headers.get('X-Expected-Sha256') || null;
  const checksumVerified = res.headers.get('X-Checksum-Verified') === 'true';
  return {
    blob,
    computedSha256,
    expectedSha256: expectedFromHeader || expectedSha256 || null,
    checksumVerified,
  };
}

export async function installFirmwareFromUrl(payload) {
  const { url, keepSettings = false, expectedSha256 } = payload;
  const res = await fetch(`${BASE}/api/miner/firmware/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, keepSettings, expectedSha256 }),
  });
  if (!res.ok) {
    let msg = 'Firmware install failed';
    let body = null;
    try {
      body = await res.json();
      if (body.detail) msg = body.detail;
      else if (body.error) msg = body.error;
    } catch {
      // ignore
    }
    const err = new Error(msg);
    if (body && (body.checksumVerified !== undefined || body.computedSha256 != null)) {
      err.installErrorBody = body;
    }
    throw err;
  }
  return res.json();
}

/** type: 'firmware' | 'www' */
export async function flashFirmwareFile(file, type = 'firmware') {
  const form = new FormData();
  form.append('file', file);
  const url = new URL(`${BASE}/api/miner/firmware/flash`, window.location.origin);
  url.searchParams.set('type', type);
  const res = await fetch(url.pathname + url.search, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    let msg = 'Flash failed';
    try {
      const data = await res.json();
      if (data.detail) msg = data.detail;
      else if (data.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}
