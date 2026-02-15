/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSetup } from '@/hooks/useSetup';

const mockPatchDashboardConfig = vi.fn();

vi.mock('@/lib/api', () => ({
  patchDashboardConfig: (...args) => mockPatchDashboardConfig(...args),
}));

describe('useSetup', () => {
  const refetchConfig = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state from config', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    expect(result.current.minerIp).toBe('192.168.1.1');
    expect(result.current.expectedHashrateGh).toBe(1000);
    expect(result.current.pollMinerMs).toBe(5000);
    expect(result.current.pollNetworkMs).toBe(30000);
    expect(result.current.changes).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('computes changes when miner IP is edited', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.setMinerIp('10.0.0.5');
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes).toHaveLength(1);
    expect(result.current.changes[0].label).toBe('Miner IP');
    expect(result.current.changes[0].to).toBe('10.0.0.5');
  });

  it('revert() restores state to config', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.setMinerIp('10.0.0.5');
      result.current.setExpectedHashrateGh(2000);
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.revert();
    });

    expect(result.current.minerIp).toBe('192.168.1.1');
    expect(result.current.expectedHashrateGh).toBe(1000);
    expect(result.current.hasChanges).toBe(false);
  });

  it('save() calls patchDashboardConfig and refetchConfig', async () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
    };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.setMinerIp('10.0.0.5');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith({
      minerIp: '10.0.0.5',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
    });
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Settings saved.' });
  });
});
