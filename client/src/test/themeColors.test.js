import { describe, it, expect } from 'vitest';
import { CHART_GRID_AXIS_COLORS } from '../lib/constants.js';
import { getChartGridAxisColors } from '../lib/chartUtils.js';

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
