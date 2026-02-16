/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMinerWifi } from '@/hooks/useMinerWifi';

const mockPatchMinerSettings = vi.fn();

vi.mock('@/lib/api', () => ({
  patchMinerSettings: (...args) => mockPatchMinerSettings(...args),
}));

describe('useMinerWifi', () => {
  const refetch = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty WiFi state when miner is null', () => {
    const { result } = renderHook(() => useMinerWifi(null, refetch, onError));

    expect(result.current.wifi.hostname).toBe('');
    expect(result.current.wifi.wifiSsid).toBe('');
    expect(result.current.wifi.wifiPassword).toBe('');
    expect(result.current.status.changes).toEqual([]);
    expect(result.current.status.hasChanges).toBe(false);
    expect(result.current.status.saving).toBe(false);
    expect(result.current.validation.isFormValid).toBe(true);
  });

  it('syncs state from miner when miner is provided', () => {
    const miner = { hostname: 'bitaxe', ssid: 'MyNetwork' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    expect(result.current.wifi.hostname).toBe('bitaxe');
    expect(result.current.wifi.wifiSsid).toBe('MyNetwork');
    expect(result.current.wifi.wifiPassword).toBe('');
  });

  it('computes changes when hostname or SSID is edited', () => {
    const miner = { hostname: 'bitaxe', ssid: 'OldSSID' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setHostname('miner1');
      result.current.wifi.setWifiSsid('NewSSID');
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.status.changes).toHaveLength(2);
    expect(result.current.status.changes.find((c) => c.label === 'Hostname')).toEqual({
      label: 'Hostname',
      from: 'bitaxe',
      to: 'miner1',
    });
    expect(result.current.status.changes.find((c) => c.label === 'WiFi network (SSID)')).toEqual({
      label: 'WiFi network (SSID)',
      from: 'OldSSID',
      to: 'NewSSID',
    });
  });

  it('includes WiFi password in changes when password is set', () => {
    const miner = { hostname: 'bitaxe', ssid: 'Net' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setWifiPassword('secret123');
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.status.changes.find((c) => c.label === 'WiFi password')).toEqual({
      label: 'WiFi password',
      from: '—',
      to: '•••',
    });
  });

  it('revert() restores state to baseline', () => {
    const miner = { hostname: 'bitaxe', ssid: 'MyNet' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setHostname('other');
      result.current.wifi.setWifiSsid('OtherNet');
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revert();
    });

    expect(result.current.wifi.hostname).toBe('bitaxe');
    expect(result.current.wifi.wifiSsid).toBe('MyNet');
    expect(result.current.status.hasChanges).toBe(false);
  });

  it('save() calls patchMinerSettings with hostname and ssid and refetch', async () => {
    const miner = { hostname: 'bitaxe', ssid: 'MyNet' };
    mockPatchMinerSettings.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setHostname('miner1');
      result.current.wifi.setWifiSsid('NewNet');
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).toHaveBeenCalledWith({
      hostname: 'miner1',
      ssid: 'NewNet',
    });
    expect(refetch).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'WiFi saved.' });
  });

  it('save() includes wifiPass when password is set', async () => {
    const miner = { hostname: 'bitaxe', ssid: 'MyNet' };
    mockPatchMinerSettings.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setWifiPassword('pass1234');
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).toHaveBeenCalledWith({
      hostname: 'bitaxe',
      ssid: 'MyNet',
      wifiPass: 'pass1234',
    });
  });

  it('reports validation error for invalid hostname (non-alphanumeric)', () => {
    const miner = { hostname: 'bitaxe', ssid: '' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setHostname('invalid name!');
    });

    expect(result.current.validation.isFormValid).toBe(false);
    expect(result.current.validation.validation.hostnameError).toContain('alphanumeric');
  });

  it('save() does not call patchMinerSettings when WiFi validation fails', async () => {
    const miner = { hostname: 'bitaxe', ssid: 'Net' };
    const { result } = renderHook(() => useMinerWifi(miner, refetch, onError));

    act(() => {
      result.current.wifi.setHostname('bad name!');
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).not.toHaveBeenCalled();
    expect(result.current.status.message?.type).toBe('error');
  });
});
