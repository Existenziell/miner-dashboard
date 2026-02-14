/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMinerDevice } from '@/hooks/useMinerDevice';

const mockPatchMinerSettings = vi.fn();
const mockRestartMiner = vi.fn();
const mockShutdownMiner = vi.fn();
const mockFetchMinerAsic = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchMinerAsic: (...args) => mockFetchMinerAsic(...args),
  patchMinerSettings: (...args) => mockPatchMinerSettings(...args),
  restartMiner: (...args) => mockRestartMiner(...args),
  shutdownMiner: (...args) => mockShutdownMiner(...args),
}));

describe('useMinerDevice', () => {
  const refetch = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMinerAsic.mockResolvedValue(null);
  });

  it('returns device state with defaults when miner is null', () => {
    const { result } = renderHook(() => useMinerDevice(null, refetch, onError));

    expect(result.current.frequency).toBe(600);
    expect(result.current.coreVoltage).toBe(1150);
    expect(result.current.overheatTemp).toBe(70);
    expect(result.current.fanAuto).toBe(false);
    expect(result.current.pidTargetTemp).toBe(55);
    expect(result.current.manualFanSpeed).toBe(100);
    expect(result.current.autoScreenOff).toBe(false);
    expect(result.current.flipScreen).toBe(false);
    expect(result.current.baseline).toBe(null);
    expect(result.current.changes).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.message).toBe(null);
    expect(result.current.isFormValid).toBe(true);
  });

  it('syncs state from miner when miner is provided', () => {
    const miner = {
      frequency: 700,
      coreVoltage: 1200,
      overheat_temp: 65,
      autofanspeed: 2,
      pidTargetTemp: 58,
      manualFanSpeed: 80,
      autoscreenoff: 1,
      flipscreen: 1,
    };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    expect(result.current.frequency).toBe(700);
    expect(result.current.coreVoltage).toBe(1200);
    expect(result.current.overheatTemp).toBe(65);
    expect(result.current.fanAuto).toBe(true);
    expect(result.current.pidTargetTemp).toBe(58);
    expect(result.current.manualFanSpeed).toBe(80);
    expect(result.current.autoScreenOff).toBe(true);
    expect(result.current.flipScreen).toBe(true);
    expect(result.current.baseline).not.toBe(null);
    expect(result.current.baseline.frequency).toBe(700);
  });

  it('computes changes when frequency is edited', async () => {
    const miner = { frequency: 700, coreVoltage: 1150, overheat_temp: 70 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.setFrequency(750);
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes).toHaveLength(1);
    expect(result.current.changes[0]).toEqual({
      label: 'Frequency',
      from: '700 MHz',
      to: '750 MHz',
    });
  });

  it('revert() restores state to baseline', async () => {
    const miner = { frequency: 700, coreVoltage: 1200, overheat_temp: 70 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setFrequency(750);
      result.current.setOverheatTemp(65);
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.revert();
    });

    expect(result.current.frequency).toBe(700);
    expect(result.current.overheatTemp).toBe(70);
    expect(result.current.hasChanges).toBe(false);
  });

  it('save() calls patchMinerSettings with device payload and refetch', async () => {
    const miner = {
      frequency: 700,
      coreVoltage: 1200,
      overheat_temp: 70,
      autofanspeed: 2,
      pidTargetTemp: 55,
      manualFanSpeed: 100,
      autoscreenoff: 0,
      flipscreen: 0,
    };
    mockPatchMinerSettings.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    act(() => {
      result.current.setFrequency(725);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchMinerSettings).toHaveBeenCalledWith({
      frequency: 725,
      coreVoltage: 1200,
      overheat_temp: 70,
      autofanspeed: 2,
      pidTargetTemp: 55,
      autoscreenoff: false,
      flipscreen: false,
    });
    expect(refetch).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Device settings saved.' });
  });

  it('reports validation errors for out-of-range overheat and PID temp', async () => {
    const miner = { frequency: 700, overheat_temp: 70, pidTargetTemp: 55 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setOverheatTemp(30);
      result.current.setPidTargetTemp(90);
    });

    expect(result.current.isFormValid).toBe(false);
    expect(result.current.validationErrors.some((e) => e.id === 'overheatTemp')).toBe(true);
    expect(result.current.validationErrors.some((e) => e.id === 'pidTargetTemp')).toBe(true);
  });

  it('handleRestart calls restartMiner and refetch', async () => {
    mockRestartMiner.mockResolvedValue({});
    const miner = { frequency: 700 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    await act(async () => {
      await result.current.handleRestart();
    });

    expect(mockRestartMiner).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Miner restarting…' });
  });

  it('handleShutdown calls shutdownMiner and refetch', async () => {
    mockShutdownMiner.mockResolvedValue({});
    const miner = { frequency: 700 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    await act(async () => {
      await result.current.handleShutdown();
    });

    expect(mockShutdownMiner).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Miner shutting down…' });
  });

  it('save() does not call patchMinerSettings when device validation fails', async () => {
    const miner = { frequency: 700, overheat_temp: 70, pidTargetTemp: 55 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    act(() => {
      result.current.setOverheatTemp(30);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchMinerSettings).not.toHaveBeenCalled();
    expect(result.current.message?.type).toBe('error');
  });
});
