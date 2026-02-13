import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMinerInfo } from '@/lib/api';
import {
  POLL_MINER_INTERVAL_MS,
  CHART_HISTORY_HR,
  CHART_HISTORY_TMP,
  CHART_HISTORY_PW,
  MAX_CHART_HISTORY,
  CHART_PERSIST_INTERVAL_MS,
  CHART_POINTS_1M,
  CHART_POINTS_10M,
  CHART_POINTS_1H,
} from '@/lib/constants';

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
  return arr.length > MAX_CHART_HISTORY ? arr.slice(-MAX_CHART_HISTORY) : arr;
}

function loadHashrateHistory() {
  return loadStored(CHART_HISTORY_HR, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
}

function loadTemperatureHistory() {
  return loadStored(CHART_HISTORY_TMP, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
}

function loadPowerHistory() {
  return loadStored(CHART_HISTORY_PW, (arr) =>
    arr[0] != null && typeof arr[0].time === 'number'
  );
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
  const lastPersistRef = useRef(0);

  const persistChartHistory = useCallback(() => {
    saveStored(CHART_HISTORY_HR, historyHashrateRef.current);
    saveStored(CHART_HISTORY_TMP, historyTemperatureRef.current);
    saveStored(CHART_HISTORY_PW, historyPowerRef.current);
    lastPersistRef.current = Date.now();
  }, []);

  const maybePersistChartHistory = useCallback(() => {
    if (Date.now() - lastPersistRef.current >= CHART_PERSIST_INTERVAL_MS) {
      persistChartHistory();
    }
  }, [persistChartHistory]);

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
      const bufHr = historyHashrateRef.current.slice(-(MAX_CHART_HISTORY - 1));
      const hashRate_1m = info.hashRate_1m ?? rollingAvg(bufHr, 'hashRate', CHART_POINTS_1M, instant);
      const hashRate_10m = info.hashRate_10m ?? rollingAvg(bufHr, 'hashRate', CHART_POINTS_10M, instant);
      const hashRate_1h = info.hashRate_1h ?? rollingAvg(bufHr, 'hashRate', CHART_POINTS_1H, instant);
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

      const bufTemp = historyTemperatureRef.current.slice(-(MAX_CHART_HISTORY - 1));
      const nextTemp = [
        ...bufTemp,
        { time: now, temp: info.temp, vrTemp: info.vrTemp },
      ];
      historyTemperatureRef.current = nextTemp;

      const bufPower = historyPowerRef.current.slice(-(MAX_CHART_HISTORY - 1));
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
      maybePersistChartHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maybePersistChartHistory]);

  useEffect(() => {
    poll();
    if (pausePolling) return;
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs, pausePolling]);

  // Persist chart history when tab is hidden or page is closing
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistChartHistory();
    };
    const onBeforeUnload = () => persistChartHistory();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [persistChartHistory]);

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
