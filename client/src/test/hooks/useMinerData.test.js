/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMinerData } from '@/hooks/useMinerData';

const mockFetchMinerInfo = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchMinerInfo: (...args) => mockFetchMinerInfo(...args),
}));

describe('useMinerData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('starts with loading true and null data', () => {
    mockFetchMinerInfo.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useMinerData(60_000));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('sets data and clears loading after successful fetch', async () => {
    const minerInfo = { hashRate: 6000, temp: 55, power: 90 };
    mockFetchMinerInfo.mockResolvedValue(minerInfo);

    const { result } = renderHook(() => useMinerData(60_000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(minerInfo);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetchMinerInfo).toHaveBeenCalled();
  });

  it('sets error when fetch fails', async () => {
    mockFetchMinerInfo.mockRejectedValue(new Error('Miner unreachable'));

    const { result } = renderHook(() => useMinerData(60_000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Miner unreachable');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
  });

  it('exposes refetch that triggers poll', async () => {
    const minerInfo = { hashRate: 6000 };
    mockFetchMinerInfo.mockResolvedValue(minerInfo);

    const { result } = renderHook(() => useMinerData(60_000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(minerInfo);

    const updatedInfo = { hashRate: 6500 };
    mockFetchMinerInfo.mockResolvedValue(updatedInfo);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(updatedInfo);
    expect(mockFetchMinerInfo).toHaveBeenCalledTimes(2);
  });

  it('when pausePolling is true, only initial poll runs', async () => {
    vi.useFakeTimers();
    mockFetchMinerInfo.mockResolvedValue({ hashRate: 6000 });

    renderHook(() => useMinerData(5000, true));

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchMinerInfo).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(mockFetchMinerInfo).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
