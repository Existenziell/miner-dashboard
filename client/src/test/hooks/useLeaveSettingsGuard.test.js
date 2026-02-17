/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLeaveSettingsGuard } from '@/hooks/useLeaveSettingsGuard';

describe('useLeaveSettingsGuard', () => {
  const setActiveTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls setActiveTab immediately when not on settings', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('dashboard', setActiveTab, false)
    );

    act(() => {
      result.current.onTabChange('docs');
    });

    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith('docs', undefined);
    expect(result.current.showLeaveConfirm).toBe(false);
  });

  it('calls setActiveTab immediately when on settings but no pending changes', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, false)
    );

    act(() => {
      result.current.onTabChange('dashboard');
    });

    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith('dashboard', undefined);
    expect(result.current.showLeaveConfirm).toBe(false);
  });

  it('does not call setActiveTab when leaving settings with pending changes', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, true)
    );

    act(() => {
      result.current.onTabChange('dashboard');
    });

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.showLeaveConfirm).toBe(true);
    expect(result.current.leaveTargetTab).toEqual({ tab: 'dashboard', options: undefined });
  });

  it('confirmLeave passes stored options to setActiveTab', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, true)
    );

    act(() => {
      result.current.onTabChange('docs', { section: 'appearance' });
    });
    expect(setActiveTab).not.toHaveBeenCalled();

    act(() => {
      result.current.confirmLeave();
    });

    expect(setActiveTab).toHaveBeenCalledWith('docs', { section: 'appearance' });
  });

  it('calls setActiveTab when switching to another settings section (same tab)', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, true)
    );

    act(() => {
      result.current.onTabChange('settings', { section: 'miner' });
    });

    expect(setActiveTab).toHaveBeenCalledWith('settings', { section: 'miner' });
    expect(result.current.showLeaveConfirm).toBe(false);
  });

  it('confirmLeave calls setActiveTab with stored target and clears state', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, true)
    );

    act(() => {
      result.current.onTabChange('api');
    });
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.showLeaveConfirm).toBe(true);

    act(() => {
      result.current.confirmLeave();
    });

    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith('api', undefined);
    expect(result.current.showLeaveConfirm).toBe(false);
    expect(result.current.leaveTargetTab).toBeNull();
  });

  it('cancelLeave clears state without calling setActiveTab', () => {
    const { result } = renderHook(() =>
      useLeaveSettingsGuard('settings', setActiveTab, true)
    );

    act(() => {
      result.current.onTabChange('docs');
    });
    expect(result.current.showLeaveConfirm).toBe(true);

    act(() => {
      result.current.cancelLeave();
    });

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.showLeaveConfirm).toBe(false);
    expect(result.current.leaveTargetTab).toBeNull();
  });
});
