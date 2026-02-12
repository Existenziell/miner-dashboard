import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMinerInfo } from '../lib/api';
import { POLL_MINER_INTERVAL_MS } from '../lib/constants';

const CHART_HISTORY_HASHRATE = 'chartHistory_hashrate';
const CHART_HISTORY_TEMPERATURE = 'chartHistory_temperature';
const CHART_HISTORY_POWER = 'chartHistory_power';
const LEGACY_CHART_HISTORY_KEY = 'chartHistory';
const MAX_HISTORY = 500; // cap per chart
const POINTS_1M = 6;   // 1 min at 10s
const POINTS_10M = 60;
const POINTS_1H = 360;

function parseStored(key) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadStored(key, validate) {
  const arr = parseStored(key);
  if (arr == null || arr.length === 0) return [];
  if (!validate(arr)) return [];
  return arr.length > MAX_HISTORY ? arr.slice(-MAX_HISTORY) : arr;
}

function loadLegacy() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_CHART_HISTORY_KEY) : null;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const first = parsed[0];
    if (first == null || typeof first.time !== 'number') return null;
    return parsed.length > MAX_HISTORY ? parsed.slice(-MAX_HISTORY) : parsed;
  } catch {
    return null;
  }
}

function loadHashrateHistory() {
  const fromKey = loadStored(CHART_HISTORY_HASHRATE, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
  if (fromKey.length > 0) return fromKey;
  const legacy = loadLegacy();
  if (!legacy) return [];
  return legacy.map((p) => ({
    time: p.time,
    hashRate: p.hashRate,
    hashRate_1m: p.hashRate_1m,
    hashRate_10m: p.hashRate_10m,
    hashRate_1h: p.hashRate_1h,
    hashRate_1d: p.hashRate_1d,
  }));
}

function loadTemperatureHistory() {
  const fromKey = loadStored(CHART_HISTORY_TEMPERATURE, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
  if (fromKey.length > 0) return fromKey;
  const legacy = loadLegacy();
  if (!legacy) return [];
  return legacy.map((p) => ({ time: p.time, temp: p.temp, vrTemp: p.vrTemp }));
}

function loadPowerHistory() {
  const fromKey = loadStored(CHART_HISTORY_POWER, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
  if (fromKey.length > 0) return fromKey;
  const legacy = loadLegacy();
  if (!legacy) return [];
  return legacy.map((p) => ({
    time: p.time,
    power: p.power,
    fanspeed: p.fanspeed,
    currentA: p.currentA,
    coreVoltageActual: p.coreVoltageActual,
  }));
}

function saveStored(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { /* ignore */ }
}

function rollingAvg(buffer, key, n, nextVal) {
  const slice = buffer.slice(-(n - 1));
  const vals = [...slice.map((p) => p[key]), nextVal].filter((v) => v != null && Number.isFinite(v));
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function useMinerData(intervalMs = POLL_MINER_INTERVAL_MS, pausePolling = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const historyHashrateRef = useRef(loadHashrateHistory());
  const historyTemperatureRef = useRef(loadTemperatureHistory());
  const historyPowerRef = useRef(loadPowerHistory());

  const poll = useCallback(async () => {
    try {
      const lastHr = historyHashrateRef.current;
      const last = lastHr.length ? lastHr[lastHr.length - 1] : null;
      const ts = last ? last.time : 0;
      const cur = Date.now();
      const info = await fetchMinerInfo({ ts, cur });
      setData(info);
      setError(null);

      const now = Date.now();
      const instant = info.hashRate != null && Number.isFinite(info.hashRate) ? info.hashRate : undefined;
      const bufHr = historyHashrateRef.current.slice(-(MAX_HISTORY - 1));
      const hashRate_1m = info.hashRate_1m ?? rollingAvg(bufHr, 'hashRate', POINTS_1M, instant);
      const hashRate_10m = info.hashRate_10m ?? rollingAvg(bufHr, 'hashRate', POINTS_10M, instant);
      const hashRate_1h = info.hashRate_1h ?? rollingAvg(bufHr, 'hashRate', POINTS_1H, instant);
      const hashRate_1d = info.hashRate_1d;

      const nextHr = [
        ...bufHr,
        {
          time: now,
          hashRate: instant,
          hashRate_1m,
          hashRate_10m,
          hashRate_1h,
          hashRate_1d,
        },
      ];
      historyHashrateRef.current = nextHr;
      saveStored(CHART_HISTORY_HASHRATE, nextHr);

      const bufTemp = historyTemperatureRef.current.slice(-(MAX_HISTORY - 1));
      const nextTemp = [
        ...bufTemp,
        { time: now, temp: info.temp, vrTemp: info.vrTemp },
      ];
      historyTemperatureRef.current = nextTemp;
      saveStored(CHART_HISTORY_TEMPERATURE, nextTemp);

      const bufPower = historyPowerRef.current.slice(-(MAX_HISTORY - 1));
      const nextPower = [
        ...bufPower,
        {
          time: now,
          power: info.power,
          fanspeed: info.fanspeed,
          currentA: info.current != null ? info.current / 1000 : undefined,
          coreVoltageActual: info.coreVoltageActual,
        },
      ];
      historyPowerRef.current = nextPower;
      saveStored(CHART_HISTORY_POWER, nextPower);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    if (pausePolling) return;
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs, pausePolling]);

  return {
    data,
    error,
    loading,
    historyHashrate: historyHashrateRef.current,
    historyTemperature: historyTemperatureRef.current,
    historyPower: historyPowerRef.current,
    refetch: poll,
  };
}
