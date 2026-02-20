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
      pollSystemIntervalMs: 5000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    expect(result.current.connection.minerIp).toBe('192.168.1.1');
    expect(result.current.connection.expectedHashrateGh).toBe(1000);
    expect(result.current.connection.pollMinerMs).toBe(5000);
    expect(result.current.connection.pollNetworkMs).toBe(30000);
    expect(result.current.connection.pollSystemMs).toBe(5000);
    expect(result.current.status.changes).toEqual([]);
    expect(result.current.status.hasChanges).toBe(false);
    expect(result.current.status.saving).toBe(false);
  });

  it('computes changes when miner IP is edited', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setMinerIp('10.0.0.5');
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.status.hasMinerSettingsChanges).toBe(true);
    expect(result.current.status.minerSettingsChanges).toHaveLength(1);
    expect(result.current.status.minerSettingsChanges[0].label).toBe('Miner IP');
    expect(result.current.status.minerSettingsChanges[0].to).toBe('10.0.0.5');
  });

  it('revert() restores state to config', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setMinerIp('10.0.0.5');
      result.current.connection.setExpectedHashrateGh(2000);
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revert();
    });

    expect(result.current.connection.minerIp).toBe('192.168.1.1');
    expect(result.current.connection.expectedHashrateGh).toBe(1000);
    expect(result.current.status.hasChanges).toBe(false);
  });

  it('computes polling changes when poll interval is edited', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setPollSystemMs(10000);
    });

    expect(result.current.status.hasPollingChanges).toBe(true);
    expect(result.current.status.pollingChanges).toHaveLength(1);
    expect(result.current.status.pollingChanges[0].label).toBe('System poll interval');
    expect(result.current.status.pollingChanges[0].to).toBe('10000 ms');
  });

  it('revertPolling() restores only poll fields', () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setPollMinerMs(15000);
      result.current.connection.setMinerIp('10.0.0.1');
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revertPolling();
    });

    expect(result.current.connection.pollMinerMs).toBe(5000);
    expect(result.current.connection.pollNetworkMs).toBe(30000);
    expect(result.current.connection.pollSystemMs).toBe(5000);
    expect(result.current.connection.minerIp).toBe('10.0.0.1');
    expect(result.current.status.hasMinerSettingsChanges).toBe(true);
    expect(result.current.status.hasPollingChanges).toBe(false);
  });

  it('saveMinerSettings() patches only miner settings', async () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setMinerIp('10.0.0.5');
    });

    await act(async () => {
      await result.current.actions.saveMinerSettings();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith({
      minerIp: '10.0.0.5',
      defaultExpectedHashrateGh: 1000,
    });
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Settings saved.' });
  });

  it('savePolling() patches only poll intervals', async () => {
    const config = {
      minerIp: '192.168.1.1',
      defaultExpectedHashrateGh: 1000,
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 5000,
    };
    mockPatchDashboardConfig.mockResolvedValue({});
    const { result } = renderHook(() => useSetup(config, refetchConfig, onError));

    act(() => {
      result.current.connection.setPollSystemMs(8000);
    });

    await act(async () => {
      await result.current.actions.savePolling();
    });

    expect(mockPatchDashboardConfig).toHaveBeenCalledWith({
      pollMinerIntervalMs: 5000,
      pollNetworkIntervalMs: 30000,
      pollSystemIntervalMs: 8000,
    });
    expect(refetchConfig).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Settings saved.' });
  });
});
