/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMinerPools } from '@/hooks/useMinerPools';
import { DEFAULT_STRATUM_PORT, POOL_MODE_OPTIONS } from '@/lib/constants';

const mockPatchMinerSettings = vi.fn();

vi.mock('@/lib/api', () => ({
  patchMinerSettings: (...args) => mockPatchMinerSettings(...args),
}));

describe('useMinerPools', () => {
  const refetch = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns pool state with defaults when miner is null', () => {
    const { result } = renderHook(() => useMinerPools(null, refetch, onError));

    expect(result.current.primary.primaryStratumPort).toBe(DEFAULT_STRATUM_PORT);
    expect(result.current.fallback.fallbackStratumPort).toBe(DEFAULT_STRATUM_PORT);
    expect(result.current.mode.poolMode).toBe('failover');
    expect(result.current.status.changes).toEqual([]);
    expect(result.current.status.hasChanges).toBe(false);
    expect(result.current.status.saving).toBe(false);
    expect(POOL_MODE_OPTIONS).toHaveLength(2);
  });

  it('syncs state from miner when miner has pool config', () => {
    const miner = {
      stratumURL: 'stratum+tcp://btc.viabtc.io',
      stratumPort: 3333,
      stratumUser: 'bc1q...',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
      stratumTLS: false,
      fallbackStratumTLS: false,
      stratumEnonceSubscribe: 1,
      fallbackStratumEnonceSubscribe: 0,
    };
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    expect(result.current.primary.primaryStratumPort).toBe(3333);
    expect(result.current.primary.primaryStratumUser).toBe('bc1q...');
    expect(result.current.mode.poolMode).toBe('failover');
  });

  it('computes changes when pool mode or stratum keepalive is edited', () => {
    const miner = {
      stratumURL: 'stratum+tcp://btc.viabtc.io',
      stratumPort: 3333,
      stratumUser: '',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
    };
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    expect(result.current.status.hasChanges).toBe(false);

    act(() => {
      result.current.mode.setPoolMode('dual');
    });
    expect(result.current.status.hasChanges).toBe(true);
    expect(result.current.status.changes.some((c) => c.label === 'Pool mode')).toBe(true);

    act(() => {
      result.current.mode.setPoolMode('failover');
      result.current.mode.setStratumTcpKeepalive(true);
    });
    expect(result.current.status.changes.some((c) => c.label === 'Stratum TCP Keepalive')).toBe(true);
  });

  it('revert() restores state to baseline', () => {
    const miner = {
      stratumURL: 'stratum+tcp://btc.viabtc.io',
      stratumPort: 3333,
      stratumUser: 'user',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
    };
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    act(() => {
      result.current.mode.setPoolMode('dual');
      result.current.primary.setPrimaryStratumUser('other');
    });
    expect(result.current.status.hasChanges).toBe(true);

    act(() => {
      result.current.actions.revert();
    });

    expect(result.current.mode.poolMode).toBe('failover');
    expect(result.current.primary.primaryStratumUser).toBe('user');
    expect(result.current.status.hasChanges).toBe(false);
  });

  it('save() calls patchMinerSettings with pool payload and refetch', async () => {
    const miner = {
      stratumURL: 'stratum+tcp://btc.viabtc.io',
      stratumPort: 3333,
      stratumUser: 'bc1q...',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 1,
    };
    mockPatchMinerSettings.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    act(() => {
      result.current.mode.setStratumTcpKeepalive(false);
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).toHaveBeenCalled();
    const call = mockPatchMinerSettings.mock.calls[0][0];
    expect(call.stratum_keep).toBe(false);
    expect(refetch).toHaveBeenCalled();
    expect(result.current.status.message).toEqual({ type: 'success', text: 'Pools saved.' });
  });

  it('reports validation error when primary pool is "other" and URL is empty', () => {
    const miner = {
      stratumURL: '',
      stratumPort: 3333,
      stratumUser: '',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
    };
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    act(() => {
      result.current.primary.setPrimaryPoolKey('other');
      result.current.primary.setPrimaryCustomURL('');
    });

    expect(result.current.validation.isFormValid).toBe(false);
    expect(result.current.validation.validationErrors.some((e) => e.id === 'primaryCustomURL')).toBe(true);
  });

  it('calls onError when save() fails', async () => {
    const miner = {
      stratumURL: 'stratum+tcp://btc.viabtc.io',
      stratumPort: 3333,
      stratumUser: '',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
    };
    mockPatchMinerSettings.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    await act(async () => {
      await result.current.actions.save();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.status.message).toEqual({ type: 'error', text: 'Network error' });
  });

  it('save() does not call patchMinerSettings when pool form is invalid', async () => {
    const miner = {
      stratumURL: '',
      stratumPort: 3333,
      stratumUser: '',
      stratumPassword: '',
      fallbackStratumURL: '',
      fallbackStratumPort: 3333,
      fallbackStratumUser: '',
      fallbackStratumPassword: '',
      poolMode: 'failover',
      stratum_keep: 0,
    };
    const { result } = renderHook(() => useMinerPools(miner, refetch, onError));

    act(() => {
      result.current.primary.setPrimaryPoolKey('other');
      result.current.primary.setPrimaryCustomURL('');
    });

    await act(async () => {
      await result.current.actions.save();
    });

    expect(mockPatchMinerSettings).not.toHaveBeenCalled();
    expect(result.current.status.message?.type).toBe('error');
  });
});
