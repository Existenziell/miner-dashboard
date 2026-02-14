/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNetworkData } from '@/hooks/useNetworkData';

const mockFetchNetworkStatus = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchNetworkStatus: (...args) => mockFetchNetworkStatus(...args),
}));

describe('useNetworkData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading true and null data', () => {
    mockFetchNetworkStatus.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useNetworkData(60_000));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('sets data and clears loading after successful fetch', async () => {
    const networkStatus = { blockHeight: 900000 };
    mockFetchNetworkStatus.mockResolvedValue(networkStatus);

    const { result } = renderHook(() => useNetworkData(60_000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(networkStatus);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetchNetworkStatus).toHaveBeenCalled();
  });

  it('sets error and clears loading when fetch fails', async () => {
    mockFetchNetworkStatus.mockRejectedValue(new Error('Network unavailable'));

    const { result } = renderHook(() => useNetworkData(60_000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Network unavailable');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
  });

  it('polls at the given interval', async () => {
    vi.useFakeTimers();
    const networkStatus1 = { blockHeight: 900000 };
    const networkStatus2 = { blockHeight: 900001 };
    mockFetchNetworkStatus
      .mockResolvedValueOnce(networkStatus1)
      .mockResolvedValueOnce(networkStatus2);

    const { result } = renderHook(() => useNetworkData(5000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(networkStatus1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockFetchNetworkStatus).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(networkStatus2);

    vi.useRealTimers();
  });
});
