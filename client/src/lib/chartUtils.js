import { useCallback, useEffect, useState } from 'react';
import { CHART_GRID_AXIS_COLORS } from '@/lib/constants.js';

/** Format timestamp for chart axis/tooltip in 24h format (e.g. "20:41") */
export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Persist which legend series are hidden in localStorage. */
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

/** Persist chart collapsed/expanded state in localStorage. */
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

/** Return grid/axis colors and axis font size for Recharts by theme.
 * Reads from CSS variables when in browser (--chart-axis-font-size matches --font-size-2xs);
 * uses constants as fallback (SSR/tests).
 */
export function getChartGridAxisColors(isDark) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const key = isDark ? 'dark' : 'light';
    const grid = style.getPropertyValue(`--chart-grid-${key}`).trim();
    const axis = style.getPropertyValue(`--chart-axis-${key}`).trim();
    const axisFontSizeRaw = style.getPropertyValue('--chart-axis-font-size').trim();
    const n = Number(axisFontSizeRaw);
    const axisFontSize = Number.isFinite(n) ? n : 10;
    if (grid && axis) return { grid, axis, axisFontSize };
  }
  return CHART_GRID_AXIS_COLORS[isDark ? 'dark' : 'light'];
}
