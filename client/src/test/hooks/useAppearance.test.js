/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAppearance } from '@/hooks/useAppearance';

const mockPatchDashboardConfig = vi.fn();

vi.mock('@/lib/api', () => ({
  patchDashboardConfig: (...args) => mockPatchDashboardConfig(...args),
}));

describe('useAppearance', () => {
  const refetchConfig = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial metricRanges and colors from config', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    expect(result.current.gauges.metricRanges).toEqual(metricRanges);
    expect(result.current.accent.accentColor).toBe('#6366f1');
    expect(result.current.charts.chartColors).toBeDefined();
    expect(result.current.status.changes).toEqual([]);
    expect(result.current.status.hasChanges).toBe(false);
    expect(result.current.status.saving).toBe(false);
  });

  it('computes hasChanges and changes when a metric range is edited', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    act(() => {
      result.current.gauges.setMetricRangeValue('hashrate', 'gaugeMax', 8000);
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.gauges.metricRanges.hashrate.gaugeMax).toBe(8000);
    expect(result.current.status.changes.length).toBeGreaterThan(0);
  });

  it('computes hasChanges when accent color is edited', () => {
    const config = { metricRanges: {}, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    act(() => {
      result.current.accent.setAccentColor('#22c55e');
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.accent.accentColor).toBe('#22c55e');
    expect(result.current.status.changes.some((c) => c.label === 'Accent color')).toBe(true);
  });

  it('revert() restores metricRanges and colors to config', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    act(() => {
      result.current.gauges.setMetricRangeValue('hashrate', 'gaugeMax', 8000);
      result.current.accent.setAccentColor('#22c55e');
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revert();
    });

    expect(result.current.gauges.metricRanges.hashrate.gaugeMax).toBe(7000);
    expect(result.current.accent.accentColor).toBe('#6366f1');
    expect(result.current.status.hasChanges).toBe(false);
  });

  it('save() calls patchDashboardConfig with metricRanges, metricOrder, accentColor and refetchConfig', async () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges, accentColor: '#6366f1', chartColors: {} };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    act(() => {
      result.current.gauges.setMetricRangeValue('hashrate', 'gaugeMax', 7500);
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metricRanges: expect.objectContaining({ hashrate: expect.objectContaining({ gaugeMax: 7500 }) }),
        metricOrder: expect.any(Array),
        chartOrder: expect.any(Array),
        accentColor: expect.any(String),
      })
    );
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Appearance saved.' });
  });

  it('returns metricOrder from config and setMetricOrder updates order', () => {
    const metricOrder = ['power', 'hashrate', 'efficiency', 'temp', 'fanRpm', 'current', 'frequency', 'voltage'];
    const config = { metricRanges: {}, metricOrder, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    expect(result.current.gauges.metricOrder).toEqual(metricOrder);

    act(() => {
      result.current.gauges.setMetricOrder(['hashrate', 'power', 'efficiency', 'temp', 'fanRpm', 'current', 'frequency', 'voltage']);
    });

    expect(result.current.gauges.metricOrder[0]).toBe('hashrate');
    expect(result.current.gauges.metricOrder[1]).toBe('power');
    expect(result.current.status.hasChanges).toBe(true);
  });

  it('returns chartOrder from config and setChartOrder updates order', () => {
    const chartOrder = ['power', 'hashrate', 'temperature'];
    const config = { metricRanges: {}, metricOrder: [], chartOrder, accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useAppearance(config, refetchConfig, onError));

    expect(result.current.charts.chartOrder).toEqual(chartOrder);

    act(() => {
      result.current.charts.setChartOrder(['hashrate', 'temperature', 'power']);
    });

    expect(result.current.charts.chartOrder[0]).toBe('hashrate');
    expect(result.current.charts.chartOrder[1]).toBe('temperature');
    expect(result.current.charts.chartOrder[2]).toBe('power');
    expect(result.current.status.hasChanges).toBe(true);
  });
});
