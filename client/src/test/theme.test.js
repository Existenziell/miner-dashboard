/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { getChartGridAxisColors } from '@/lib/chartUtils.js';
import { CHART_GRID_AXIS_COLORS, THEME_KEY } from '@/lib/constants.js';

// —— Chart grid/axis colors (theme-derived) —————————————————————————————————

describe('CHART_GRID_AXIS_COLORS', () => {
  it('defines light theme with grid and axis hex colors', () => {
    expect(CHART_GRID_AXIS_COLORS.light).toEqual({ grid: '#d1d5db', axis: '#9ca3af' });
  });

  it('defines dark theme with grid and axis hex colors', () => {
    expect(CHART_GRID_AXIS_COLORS.dark).toEqual({ grid: '#333366', axis: '#666688' });
  });
});

describe('getChartGridAxisColors', () => {
  it('returns dark colors when isDark is true', () => {
    expect(getChartGridAxisColors(true)).toEqual(CHART_GRID_AXIS_COLORS.dark);
  });

  it('returns light colors when isDark is false', () => {
    expect(getChartGridAxisColors(false)).toEqual(CHART_GRID_AXIS_COLORS.light);
  });

  it('returns light colors for falsy isDark', () => {
    expect(getChartGridAxisColors(undefined)).toEqual(CHART_GRID_AXIS_COLORS.light);
    expect(getChartGridAxisColors(null)).toEqual(CHART_GRID_AXIS_COLORS.light);
    expect(getChartGridAxisColors(0)).toEqual(CHART_GRID_AXIS_COLORS.light);
  });

  it('returns dark colors for truthy non-boolean', () => {
    expect(getChartGridAxisColors(1)).toEqual(CHART_GRID_AXIS_COLORS.dark);
    expect(getChartGridAxisColors('yes')).toEqual(CHART_GRID_AXIS_COLORS.dark);
  });
});

// —— Dark/light theme toggle (ThemeProvider / useTheme) ——————————————————————

function wrapper({ children }) {
  return createElement(ThemeProvider, null, children);
}

describe('useTheme (dark/light toggle)', () => {
  const matchMediaMock = vi.fn();
  let localStorageStore = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore = {};
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: (key) => localStorageStore[key] ?? null,
        setItem: (key, value) => {
          localStorageStore[key] = value;
        },
        clear: () => {
          localStorageStore = {};
        },
      },
    });
  });

  it('defaults to system when no stored preference', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');
    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('resolves system to dark when prefers-color-scheme: dark', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');
    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('uses stored light mode and applies light theme', () => {
    localStorageStore[THEME_KEY] = 'light';
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('light');
    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('uses stored dark mode and applies dark theme', () => {
    localStorageStore[THEME_KEY] = 'dark';
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setMode("light") switches to light and updates DOM', async () => {
    localStorageStore[THEME_KEY] = 'dark';
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolved).toBe('dark');

    await act(() => {
      result.current.setMode('light');
    });
    expect(result.current.mode).toBe('light');
    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorageStore[THEME_KEY]).toBe('light');
  });

  it('setMode("dark") switches to dark and updates DOM', async () => {
    localStorageStore[THEME_KEY] = 'light';
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolved).toBe('light');

    await act(() => {
      result.current.setMode('dark');
    });
    expect(result.current.mode).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorageStore[THEME_KEY]).toBe('dark');
  });

  it('cycle() goes system → light → dark → system', async () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');

    await act(() => {
      result.current.cycle();
    });
    expect(result.current.mode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await act(() => {
      result.current.cycle();
    });
    expect(result.current.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await act(() => {
      result.current.cycle();
    });
    expect(result.current.mode).toBe('system');
    expect(result.current.resolved).toBe('light');
  });
});
