/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_KEY } from '@/lib/constants';

export const THEME_MODES = ['light', 'light-high-contrast', 'dark', 'dark-high-contrast'];

function applyTheme(mode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = mode === 'dark' || mode === 'dark-high-contrast';
  const isHighContrast = mode === 'light-high-contrast' || mode === 'dark-high-contrast';
  root.classList.toggle('dark', isDark);
  root.classList.toggle('high-contrast', isHighContrast);
}

export function getResolvedTheme(mode) {
  if (mode === 'light' || mode === 'light-high-contrast') return 'light';
  return 'dark';
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_KEY);
    return THEME_MODES.includes(stored) ? stored : 'light';
  });

  const resolved = getResolvedTheme(mode);

  useEffect(() => {
    applyTheme(mode);
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  const cycle = useCallback(() => {
    setModeState((prev) => {
      const i = THEME_MODES.indexOf(prev);
      return THEME_MODES[(i + 1) % THEME_MODES.length];
    });
  }, []);

  const setMode = useCallback((next) => {
    if (THEME_MODES.includes(next)) setModeState(next);
  }, []);

  const value = { mode, resolved, setMode, cycle };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
