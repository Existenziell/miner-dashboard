import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMinerInfo } from '../lib/api';

const CHART_HISTORY_KEY = 'minerDashboard_chartHistory';
const MAX_HISTORY = 500; // cap for in-memory and localStorage
const POINTS_1M = 6;   // 1 min at 10s
const POINTS_10M = 60;
const POINTS_1H = 360;

function loadStoredHistory() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CHART_HISTORY_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    const first = parsed[0];
    if (first == null || typeof first.time !== 'number') return [];
    return parsed.length > MAX_HISTORY ? parsed.slice(-MAX_HISTORY) : parsed;
  } catch {
    return [];
  }
}

function rollingAvg(buffer, key, n, nextVal) {
  const slice = buffer.slice(-(n - 1));
  const vals = [...slice.map((p) => p[key]), nextVal].filter((v) => v != null && Number.isFinite(v));
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function useMinerData(intervalMs = 10_000, pausePolling = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef(loadStoredHistory());

  const poll = useCallback(async () => {
    try {
      const cur = Date.now();
      const last = historyRef.current.length ? historyRef.current[historyRef.current.length - 1] : null;
      const ts = last ? last.time : 0;
      const info = await fetchMinerInfo({ ts, cur });
      setData(info);
      setError(null);

      const buf = historyRef.current.slice(-(MAX_HISTORY - 1));
      const instant = info.hashRate != null && Number.isFinite(info.hashRate) ? info.hashRate : undefined;

      // Prefer miner-provided averages when present; otherwise derive from our history
      const hashRate_1m = info.hashRate_1m ?? rollingAvg(buf, 'hashRate', POINTS_1M, instant);
      const hashRate_10m = info.hashRate_10m ?? rollingAvg(buf, 'hashRate', POINTS_10M, instant);
      const hashRate_1h = info.hashRate_1h ?? rollingAvg(buf, 'hashRate', POINTS_1H, instant);
      const hashRate_1d = info.hashRate_1d; // miner-only; we don't have 24h of data to derive

      const next = [
        ...buf,
        {
          time: Date.now(),
          hashRate: instant,
          hashRate_1m,
          hashRate_10m,
          hashRate_1h,
          hashRate_1d,
          temp: info.temp,
          vrTemp: info.vrTemp,
          power: info.power,
          fanspeed: info.fanspeed,
        },
      ];
      historyRef.current = next;
      try {
        localStorage.setItem(CHART_HISTORY_KEY, JSON.stringify(next));
      } catch { /* ignore localStorage */ }
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

  return { data, error, loading, history: historyRef.current, refetch: poll };
}
