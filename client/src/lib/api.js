const BASE = '';

export async function fetchMinerInfo() {
  const res = await fetch(`${BASE}/api/miner/info`);
  if (!res.ok) throw new Error(`Miner API error: ${res.status}`);
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
  const res = await fetch(`${BASE}/api/miner/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Miner PATCH error: ${res.status}`);
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
