/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDashboard } from '@/hooks/useDashboard';

const mockPatchDashboardConfig = vi.fn();

vi.mock('@/lib/api', () => ({
  patchDashboardConfig: (...args) => mockPatchDashboardConfig(...args),
}));

describe('useDashboard', () => {
  const refetchConfig = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial metricRanges from config', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges };
    const { result } = renderHook(() => useDashboard(config, refetchConfig, onError));

    expect(result.current.metricRanges).toEqual(metricRanges);
    expect(result.current.changes).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('computes hasChanges and changes when a metric range is edited', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges };
    const { result } = renderHook(() => useDashboard(config, refetchConfig, onError));

    act(() => {
      result.current.setMetricRangeValue('hashrate', 'gaugeMax', 8000);
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.metricRanges.hashrate.gaugeMax).toBe(8000);
    expect(result.current.changes.length).toBeGreaterThan(0);
  });

  it('revert() restores metricRanges to config', () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges };
    const { result } = renderHook(() => useDashboard(config, refetchConfig, onError));

    act(() => {
      result.current.setMetricRangeValue('hashrate', 'gaugeMax', 8000);
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.revert();
    });

    expect(result.current.metricRanges.hashrate.gaugeMax).toBe(7000);
    expect(result.current.hasChanges).toBe(false);
  });

  it('save() calls patchDashboardConfig with metricRanges and refetchConfig', async () => {
    const metricRanges = { hashrate: { min: 5500, gaugeMax: 7000 } };
    const config = { metricRanges };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useDashboard(config, refetchConfig, onError));

    act(() => {
      result.current.setMetricRangeValue('hashrate', 'gaugeMax', 7500);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith({
      metricRanges: expect.objectContaining({ hashrate: expect.objectContaining({ gaugeMax: 7500 }) }),
    });
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Metric ranges saved.' });
  });
});
