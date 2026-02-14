/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMinerPools } from '@/hooks/useMinerPools';
import { DEFAULT_STRATUM_PORT } from '@/lib/constants';

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

    expect(result.current.primaryStratumPort).toBe(DEFAULT_STRATUM_PORT);
    expect(result.current.fallbackStratumPort).toBe(DEFAULT_STRATUM_PORT);
    expect(result.current.poolMode).toBe('failover');
    expect(result.current.changes).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.POOL_MODE_OPTIONS).toHaveLength(2);
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

    expect(result.current.primaryStratumPort).toBe(3333);
    expect(result.current.primaryStratumUser).toBe('bc1q...');
    expect(result.current.poolMode).toBe('failover');
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

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.setPoolMode('dual');
    });
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changes.some((c) => c.label === 'Pool mode')).toBe(true);

    act(() => {
      result.current.setPoolMode('failover');
      result.current.setStratumTcpKeepalive(true);
    });
    expect(result.current.changes.some((c) => c.label === 'Stratum TCP Keepalive')).toBe(true);
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
      result.current.setPoolMode('dual');
      result.current.setPrimaryStratumUser('other');
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.revert();
    });

    expect(result.current.poolMode).toBe('failover');
    expect(result.current.primaryStratumUser).toBe('user');
    expect(result.current.hasChanges).toBe(false);
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
      result.current.setStratumTcpKeepalive(false);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchMinerSettings).toHaveBeenCalled();
    const call = mockPatchMinerSettings.mock.calls[0][0];
    expect(call.stratum_keep).toBe(false);
    expect(refetch).toHaveBeenCalled();
    expect(result.current.message).toEqual({ type: 'success', text: 'Pools saved.' });
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
      result.current.setPrimaryPoolKey('other');
      result.current.setPrimaryCustomURL('');
    });

    expect(result.current.isFormValid).toBe(false);
    expect(result.current.validationErrors.some((e) => e.id === 'primaryCustomURL')).toBe(true);
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
      await result.current.save();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.message).toEqual({ type: 'error', text: 'Network error' });
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
      result.current.setPrimaryPoolKey('other');
      result.current.setPrimaryCustomURL('');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockPatchMinerSettings).not.toHaveBeenCalled();
    expect(result.current.message?.type).toBe('error');
  });
});
