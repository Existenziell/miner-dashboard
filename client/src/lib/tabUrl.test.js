import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTabFromUrl, setTabInUrl } from './tabUrl.js';

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

    it('sets tab=settings in URL', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/', pathname: '/' });
      setTabInUrl('settings');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'settings' }, '', '/?tab=settings');
    });

    it('sets tab=docs in URL', () => {
      const { replaceState } = mockWindow({ href: 'http://localhost/', pathname: '/' });
      setTabInUrl('docs');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'docs' }, '', '/?tab=docs');
    });

    it('replaces existing tab param when switching to settings', () => {
      const { replaceState } = mockWindow({
        href: 'http://localhost/?tab=docs',
        pathname: '/',
      });
      setTabInUrl('settings');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'settings' }, '', '/?tab=settings');
    });

    it('removes tab param but keeps other params when switching to dashboard', () => {
      const { replaceState } = mockWindow({
        href: 'http://localhost/?tab=settings&other=1',
        pathname: '/',
      });
      setTabInUrl('dashboard');
      expect(replaceState).toHaveBeenCalledWith({ tab: 'dashboard' }, '', '/?other=1');
    });
  });
});
