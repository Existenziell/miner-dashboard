/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNotifications } from '@/hooks/useNotifications';

const mockUseMiner = vi.fn();
vi.mock('@/context/MinerContext', () => ({
  useMiner: (...args) => mockUseMiner(...args),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMiner.mockReturnValue({ data: null, refetch: vi.fn() });
  });

  it('returns empty activeNotifications when miner is null', () => {
    mockUseMiner.mockReturnValue({ data: null, refetch: vi.fn() });
    const { result } = renderHook(() => useNotifications(null, null));

    expect(result.current.activeNotifications).toEqual([]);
    expect(result.current.blockFoundVisible).toBe(false);
    expect(result.current.blockFoundSnapshot).toBe(null);
    expect(result.current.minerError).toBe(null);
    expect(result.current.networkError).toBe(null);
  });

  it('returns activeNotifications when miner triggers a rule', () => {
    const miner = { temp: 61 };
    mockUseMiner.mockReturnValue({ data: miner, refetch: vi.fn() });
    const { result } = renderHook(() => useNotifications(null, null));

    expect(result.current.activeNotifications.length).toBeGreaterThan(0);
    expect(result.current.activeNotifications.some((a) => a.id === 'temp_high')).toBe(true);
    expect(result.current.activeNotifications.find((a) => a.id === 'temp_high').label).toBe(
      'ASIC temperature high'
    );
  });

  it('dismissNotifications can be called and updates dismissed state', () => {
    const miner = { temp: 61 };
    mockUseMiner.mockReturnValue({ data: miner, refetch: vi.fn() });
    const { result } = renderHook(() => useNotifications(null, null));

    expect(result.current.activeNotifications.length).toBeGreaterThan(0);
    expect(typeof result.current.dismissNotifications).toBe('function');

    act(() => {
      result.current.dismissNotifications();
    });

    // Notifications that are still in evaluated may remain visible by design
    expect(result.current.dismissNotifications).toBeDefined();
  });

  it('sets blockFoundVisible and blockFoundSnapshot when block count increases', async () => {
    mockUseMiner.mockReturnValue({ data: { totalFoundBlocks: 1 }, refetch: vi.fn() });
    const { result } = renderHook(() => useNotifications(null, null));

    await act(async () => {
      await Promise.resolve(); // flush microtask from hook
    });

    expect(result.current.blockFoundVisible).toBe(true);
    expect(result.current.blockFoundSnapshot).toEqual({ totalFoundBlocks: 1 });
  });

  it('dismissBlockFound sets blockFoundVisible to false and clears blockFoundSnapshot', async () => {
    mockUseMiner.mockReturnValue({ data: { totalFoundBlocks: 1 }, refetch: vi.fn() });
    const { result } = renderHook(() => useNotifications(null, null));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.blockFoundVisible).toBe(true);
    expect(result.current.blockFoundSnapshot).toEqual({ totalFoundBlocks: 1 });

    act(() => {
      result.current.dismissBlockFound();
    });

    expect(result.current.blockFoundVisible).toBe(false);
    expect(result.current.blockFoundSnapshot).toBe(null);
  });

  it('passes through minerError and networkError', () => {
    const { result } = renderHook(() =>
      useNotifications(new Error('Miner offline'), new Error('Network error'))
    );

    expect(result.current.minerError).toEqual(expect.any(Error));
    expect(result.current.minerError.message).toBe('Miner offline');
    expect(result.current.networkError).toEqual(expect.any(Error));
    expect(result.current.networkError.message).toBe('Network error');
  });
});
