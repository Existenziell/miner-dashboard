import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMinerInfo } from '../lib/api';

const MAX_HISTORY = 360; // ~1 hour at 10s intervals

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

      // Append to history buffer
      const now = Date.now();
      historyRef.current = [
        ...historyRef.current.slice(-(MAX_HISTORY - 1)),
        {
          time: now,
          hashRate: info.hashRate,
          hashRate_1m: info.hashRate_1m,
          hashRate_10m: info.hashRate_10m,
          hashRate_1h: info.hashRate_1h,
          hashRate_1d: info.hashRate_1d,
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
