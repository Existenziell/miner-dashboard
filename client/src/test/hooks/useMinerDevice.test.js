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

    expect(result.current.asic.frequency).toBe(600);
    expect(result.current.asic.coreVoltage).toBe(1150);
    expect(result.current.tempFan.overheatTemp).toBe(70);
    expect(result.current.tempFan.fanAuto).toBe(false);
    expect(result.current.tempFan.pidTargetTemp).toBe(55);
    expect(result.current.tempFan.manualFanSpeed).toBe(100);
    expect(result.current.display.autoScreenOff).toBe(false);
    expect(result.current.display.flipScreen).toBe(false);
    expect(result.current.display.baseline).toBe(null);
    expect(result.current.status.changes).toEqual([]);
    expect(result.current.status.hasChanges).toBe(false);
    expect(result.current.status.saving).toBe(false);
    expect(result.current.status.message).toBe(null);
    expect(result.current.validation.isFormValid).toBe(true);
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

    expect(result.current.asic.frequency).toBe(700);
    expect(result.current.asic.coreVoltage).toBe(1200);
    expect(result.current.tempFan.overheatTemp).toBe(65);
    expect(result.current.tempFan.fanAuto).toBe(true);
    expect(result.current.tempFan.pidTargetTemp).toBe(58);
    expect(result.current.tempFan.manualFanSpeed).toBe(80);
    expect(result.current.display.autoScreenOff).toBe(true);
    expect(result.current.display.flipScreen).toBe(true);
    expect(result.current.display.baseline).not.toBe(null);
    expect(result.current.display.baseline.frequency).toBe(700);
  });

  it('computes changes when frequency is edited', async () => {
    const miner = { frequency: 700, coreVoltage: 1150, overheat_temp: 70 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status.hasChanges).toBe(false);

    act(() => {
      result.current.asic.setFrequency(750);
    });

    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.status.changes).toHaveLength(1);
    expect(result.current.status.changes[0]).toEqual({
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
      result.current.asic.setFrequency(750);
      result.current.tempFan.setOverheatTemp(65);
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revert();
    });

    expect(result.current.asic.frequency).toBe(700);
    expect(result.current.tempFan.overheatTemp).toBe(70);
    expect(result.current.status.hasChanges).toBe(false);
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
      result.current.asic.setFrequency(725);
    });

    await act(async () => {
      await result.current.actions.save();
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
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Device settings saved.' });
  });

  it('reports validation errors for out-of-range overheat and PID temp', async () => {
    const miner = { frequency: 700, overheat_temp: 70, pidTargetTemp: 55 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.tempFan.setOverheatTemp(30);
      result.current.tempFan.setPidTargetTemp(90);
    });

    expect(result.current.validation.isFormValid).toBe(false);
    expect(result.current.validation.validationErrors.some((e) => e.id === 'overheatTemp')).toBe(true);
    expect(result.current.validation.validationErrors.some((e) => e.id === 'pidTargetTemp')).toBe(true);
  });

  it('handleRestart calls restartMiner and refetch', async () => {
    mockRestartMiner.mockResolvedValue({});
    const miner = { frequency: 700 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    await act(async () => {
      await result.current.actions.handleRestart();
    });

    expect(mockRestartMiner).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Miner restarting…' });
  });

  it('handleShutdown calls shutdownMiner and refetch', async () => {
    mockShutdownMiner.mockResolvedValue({});
    const miner = { frequency: 700 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    await act(async () => {
      await result.current.actions.handleShutdown();
    });

    expect(mockShutdownMiner).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Miner shutting down…' });
  });

  it('save() does not call patchMinerSettings when device validation fails', async () => {
    const miner = { frequency: 700, overheat_temp: 70, pidTargetTemp: 55 };
    const { result } = renderHook(() => useMinerDevice(miner, refetch, onError));

    act(() => {
      result.current.tempFan.setOverheatTemp(30);
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).not.toHaveBeenCalled();
    expect(result.current.status.message?.type).toBe('error');
  });
});
