import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMinerInfo } from '../lib/api';

const MAX_HISTORY = 360; // ~1 hour at 10s intervals
const POINTS_1M = 6;   // 1 min at 10s
const POINTS_10M = 60;
const POINTS_1H = 360;

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
  const historyRef = useRef([]);

  const poll = useCallback(async () => {
    try {
      const info = await fetchMinerInfo();
      setData(info);
      setError(null);

      const buf = historyRef.current.slice(-(MAX_HISTORY - 1));
      const instant = info.hashRate != null && Number.isFinite(info.hashRate) ? info.hashRate : undefined;

      // Prefer miner-provided averages when present; otherwise derive from our history
      const hashRate_1m = info.hashRate_1m ?? rollingAvg(buf, 'hashRate', POINTS_1M, instant);
      const hashRate_10m = info.hashRate_10m ?? rollingAvg(buf, 'hashRate', POINTS_10M, instant);
      const hashRate_1h = info.hashRate_1h ?? rollingAvg(buf, 'hashRate', POINTS_1H, instant);
      const hashRate_1d = info.hashRate_1d; // miner-only; we don't have 24h of data to derive

      historyRef.current = [
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
