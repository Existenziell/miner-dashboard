import { useState, useCallback, useEffect } from 'react';

/** Format timestamp for chart axis/tooltip (e.g. "20:41") */
export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Persist which legend series are hidden in localStorage.
 * @param {string} storageKey - localStorage key (e.g. 'chartLegend_power')
 * @param {Set<string>} seriesKeys - valid series keys
 * @returns {{ hidden: Set<string>, toggle: (key: string) => void }}
 */
export function useChartLegend(storageKey, seriesKeys) {
  const loadStored = useCallback(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((k) => seriesKeys.has(k)));
    } catch {
      return new Set();
    }
  }, [storageKey, seriesKeys]);

  const [hidden, setHidden] = useState(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(hidden)));
    } catch { /* ignore localStorage */ }
  }, [storageKey, hidden]);

  const toggle = useCallback((key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { hidden, toggle };
}
