/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useColor } from '@/hooks/useColor';

const mockPatchDashboardConfig = vi.fn();

vi.mock('@/lib/api', () => ({
  patchDashboardConfig: (...args) => mockPatchDashboardConfig(...args),
}));

describe('useColor', () => {
  const refetchConfig = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial accent and chart colors from config', () => {
    const config = {
      accentColor: '#6366f1',
      chartColors: {},
    };
    const { result } = renderHook(() => useColor(config, refetchConfig, onError));

    expect(result.current.accentColor).toBe('#6366f1');
    expect(result.current.chartColors).toBeDefined();
    expect(result.current.changes).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('computes hasChanges and changes when accent color is edited', () => {
    const config = { accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useColor(config, refetchConfig, onError));

    act(() => {
      result.current.setAccentColor('#22c55e');
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.accentColor).toBe('#22c55e');
    expect(result.current.changes.some((c) => c.label === 'Accent color')).toBe(true);
  });

  it('revert() restores accent and chart colors to config', () => {
    const config = { accentColor: '#6366f1', chartColors: {} };
    const { result } = renderHook(() => useColor(config, refetchConfig, onError));

    act(() => {
      result.current.setAccentColor('#22c55e');
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.revert();
    });

    expect(result.current.accentColor).toBe('#6366f1');
    expect(result.current.hasChanges).toBe(false);
  });

  it('save() calls patchDashboardConfig and refetchConfig', async () => {
    const config = { accentColor: '#6366f1', chartColors: {} };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useColor(config, refetchConfig, onError));

    act(() => {
      result.current.setAccentColor('#22c55e');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: expect.any(String) })
    );
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Colors saved.' });
  });
});
