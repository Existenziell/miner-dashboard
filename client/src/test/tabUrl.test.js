import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTabFromUrl, setTabInUrl, getSettingsSectionFromUrl, setSettingsSectionInUrl } from '../lib/tabUrl.js';

const _originalWindow = globalThis.window;
const _originalLocation = globalThis.location;
const _originalHistory = globalThis.history;

function mockWindow({ search = '', href = 'http://localhost/', pathname = '/' } = {}) {
  const replaceState = vi.fn();
  const win = {
    location: { search, href, pathname },
    history: { replaceState },
  };
  vi.stubGlobal('window', win);
  return { win, replaceState };
}

describe('tabUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', _originalWindow);
    vi.stubGlobal('location', _originalLocation);
    vi.stubGlobal('history', _originalHistory);
  });

  describe('getTabFromUrl', () => {
    it('returns dashboard when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getTabFromUrl()).toBe('dashboard');
    });

    it('returns dashboard when no search params', () => {
      mockWindow({ search: '' });
      expect(getTabFromUrl()).toBe('dashboard');
    });

    it('returns dashboard when tab param is missing', () => {
      mockWindow({ search: '?other=1' });
      expect(getTabFromUrl()).toBe('dashboard');
    });

    it('returns settings when tab=settings', () => {
      mockWindow({ search: '?tab=settings' });
      expect(getTabFromUrl()).toBe('settings');
    });

    it('returns docs when tab=docs', () => {
      mockWindow({ search: '?tab=docs' });
      expect(getTabFromUrl()).toBe('docs');
    });

    it('returns dashboard for invalid tab value', () => {
      mockWindow({ search: '?tab=invalid' });
      expect(getTabFromUrl()).toBe('dashboard');
    });

    it('returns dashboard when tab=dashboard (explicit)', () => {
      mockWindow({ search: '?tab=dashboard' });
      expect(getTabFromUrl()).toBe('dashboard');
    });
  });

  describe('setTabInUrl', () => {
    it('removes tab param and uses pathname only for dashboard', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/', pathname: '/' });
      setTabInUrl('dashboard');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'dashboard' }, '', '/');
    });

    it('sets tab=settings and section=miner in URL', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/', pathname: '/' });
      setTabInUrl('settings');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'settings' }, '', '/?tab=settings&section=miner');
    });

    it('sets tab=docs in URL', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/', pathname: '/' });
      setTabInUrl('docs');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'docs' }, '', '/?tab=docs');
    });

    it('replaces existing tab param when switching to settings and adds section=miner', () => {
      const { replaceState } = mockWindow({
        href: 'http://localhost/?tab=docs',
        pathname: '/',
      });
      setTabInUrl('settings');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'settings' }, '', '/?tab=settings&section=miner');
    });

    it('removes tab and section when switching to dashboard', () => {
      const { replaceState } = mockWindow({
        href: 'http://localhost/?tab=settings&section=pools',
        pathname: '/',
      });
      setTabInUrl('dashboard');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'dashboard' }, '', '/');
    });

    it('removes tab param but keeps other params when switching to dashboard', () => {
      const { replaceState } = mockWindow({
        href: 'http://localhost/?tab=settings&section=miner&other=1',
        pathname: '/',
      });
      setTabInUrl('dashboard');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'dashboard' }, '', '/?other=1');
    });
  });

  describe('getSettingsSectionFromUrl', () => {
    it('returns miner when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getSettingsSectionFromUrl()).toBe('miner');
    });

    it('returns miner when section param is missing', () => {
      mockWindow({ search: '', href: 'http://localhost/' });
      expect(getSettingsSectionFromUrl()).toBe('miner');
    });

    it('returns miner when section param is invalid', () => {
      mockWindow({ search: '?tab=settings&section=invalid', href: 'http://localhost/?tab=settings&section=invalid' });
      expect(getSettingsSectionFromUrl()).toBe('miner');
    });

    it('returns section when valid (miner, pools, dashboard)', () => {
      mockWindow({ search: '?tab=settings&section=miner', href: 'http://localhost/?tab=settings&section=miner' });
      expect(getSettingsSectionFromUrl()).toBe('miner');
      mockWindow({ search: '?tab=settings&section=pools', href: 'http://localhost/?tab=settings&section=pools' });
      expect(getSettingsSectionFromUrl()).toBe('pools');
      mockWindow({ search: '?tab=settings&section=dashboard', href: 'http://localhost/?tab=settings&section=dashboard' });
      expect(getSettingsSectionFromUrl()).toBe('dashboard');
    });
  });

  describe('setSettingsSectionInUrl', () => {
    it('does nothing when current tab is not settings', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/?tab=docs', pathname: '/' });
      setSettingsSectionInUrl('pools');
      expect(replaceState).not.toHaveBeenCalled();
    });

    it('sets section param when on settings tab', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/?tab=settings&section=miner', pathname: '/' });
      setSettingsSectionInUrl('pools');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'settings', section: 'pools' }, '', '/?tab=settings&section=pools');
    });

    it('does nothing for invalid section', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/?tab=settings', pathname: '/' });
      setSettingsSectionInUrl('invalid');
      expect(replaceState).not.toHaveBeenCalled();
    });
  });
});
