import { useState, useCallback, useEffect } from 'react';
import { CHART_GRID_AXIS_COLORS } from './constants.js';

/** Format timestamp for chart axis/tooltip in 24h format (e.g. "20:41") */
export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Persist which legend series are hidden in localStorage.
 * @param {string} storageKey - localStorage key
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

/**
 * Persist chart collapsed/expanded state in localStorage.
 * @param {string} storageKey - localStorage key
 * @returns {{ collapsed: boolean, toggleCollapsed: () => void }}
 */
export function useChartCollapsed(storageKey) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore localStorage errors (e.g. private mode)
      }
      return next;
    });
  }, [storageKey]);

  return { collapsed, toggleCollapsed };
}

/** Return grid/axis colors for Recharts by theme. */
export function getChartGridAxisColors(isDark) {
  return CHART_GRID_AXIS_COLORS[isDark ? 'dark' : 'light'];
}
