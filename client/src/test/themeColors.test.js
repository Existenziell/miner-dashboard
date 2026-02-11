import { describe, it, expect } from 'vitest';
import { CHART_COLORS, getChartColors } from '../lib/themeColors.js';

describe('CHART_COLORS', () => {
  it('defines light theme with grid and axis hex colors', () => {
    expect(CHART_COLORS.light).toEqual({ grid: '#d1d5db', axis: '#9ca3af' });
  });

  it('defines dark theme with grid and axis hex colors', () => {
    expect(CHART_COLORS.dark).toEqual({ grid: '#333366', axis: '#666688' });
  });
});

describe('getChartColors', () => {
  it('returns dark colors when isDark is true', () => {
    expect(getChartColors(true)).toEqual(CHART_COLORS.dark);
  });

  it('returns light colors when isDark is false', () => {
    expect(getChartColors(false)).toEqual(CHART_COLORS.light);
  });

  it('returns light colors for falsy isDark', () => {
    expect(getChartColors(undefined)).toEqual(CHART_COLORS.light);
    expect(getChartColors(null)).toEqual(CHART_COLORS.light);
    expect(getChartColors(0)).toEqual(CHART_COLORS.light);
  });

  it('returns dark colors for truthy non-boolean', () => {
    expect(getChartColors(1)).toEqual(CHART_COLORS.dark);
    expect(getChartColors('yes')).toEqual(CHART_COLORS.dark);
  });
});
