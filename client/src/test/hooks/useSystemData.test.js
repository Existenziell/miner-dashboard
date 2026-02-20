/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSystemData } from '@/hooks/useSystemData';

const mockFetchSystemStatus = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchSystemStatus: (...args) => mockFetchSystemStatus(...args),
}));

describe('useSystemData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading true and null data', () => {
    mockFetchSystemStatus.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useSystemData(5000));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('sets data and clears loading after successful fetch', async () => {
    const systemStatus = { loadAvg: [1, 0.5, 0.3], cpuCount: 4, uptimeSeconds: 3600 };
    mockFetchSystemStatus.mockResolvedValue(systemStatus);

    const { result } = renderHook(() => useSystemData(5000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(systemStatus);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetchSystemStatus).toHaveBeenCalled();
  });

  it('sets error and clears loading when fetch fails', async () => {
    mockFetchSystemStatus.mockRejectedValue(new Error('System unavailable'));

    const { result } = renderHook(() => useSystemData(5000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('System unavailable');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
  });

  it('polls at the given interval', async () => {
    vi.useFakeTimers();
    const status1 = { loadAvg: [1, 1, 1], cpuCount: 4 };
    const status2 = { loadAvg: [2, 2, 2], cpuCount: 4 };
    mockFetchSystemStatus
      .mockResolvedValueOnce(status1)
      .mockResolvedValueOnce(status2);

    const { result } = renderHook(() => useSystemData(5000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(status1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetchSystemStatus).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(status2);

    vi.useRealTimers();
  });
});
