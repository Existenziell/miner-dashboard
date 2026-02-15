/**
 * Tab state synced with URL query (?tab=settings|docs|api).
 * Valid tab ids: 'dashboard' | 'settings' | 'docs' | 'api'
 * Settings sub-tabs use ?tab=settings&section=setup|miner|pools|firmware|appearance
 */
import { SETTINGS_SECTION_KEY } from '@/lib/constants.js';

const VALID_SETTINGS_SECTIONS = new Set(['setup', 'miner', 'pools', 'firmware', 'appearance']);

function getStoredSettingsSection() {
  if (typeof window === 'undefined') return 'setup';
  try {
    const s = window.localStorage.getItem(SETTINGS_SECTION_KEY);
    if (VALID_SETTINGS_SECTIONS.has(s)) return s;
    return 'setup';
  } catch {
    return 'setup';
  }
}

export function getTabFromUrl() {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  if (t === 'settings') return 'settings';
  if (t === 'docs') return 'docs';
  if (t === 'api') return 'api';
  return 'dashboard';
}

export function setTabInUrl(tab) {
  const url = new URL(window.location.href);
  if (tab === 'dashboard') {
    url.searchParams.delete('tab');
    url.searchParams.delete('section');
  } else {
    url.searchParams.set('tab', tab);
    if (tab === 'settings') {
      const currentSection = url.searchParams.get('section');
      if (!VALID_SETTINGS_SECTIONS.has(currentSection)) {
        url.searchParams.set('section', getStoredSettingsSection());
      }
    } else {
      url.searchParams.delete('section');
    }
  }
  const newUrl = url.search ? `${url.pathname}?${url.searchParams}` : url.pathname;
  window.history.replaceState({ tab }, '', newUrl);
}

export function getSettingsSectionFromUrl() {
  if (typeof window === 'undefined') return 'setup';
  const params = new URLSearchParams(window.location.search);
  const s = params.get('section');
  if (VALID_SETTINGS_SECTIONS.has(s)) return s;
  return 'setup';
}

export function setSettingsSectionInUrl(section) {
  if (!VALID_SETTINGS_SECTIONS.has(section)) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get('tab') !== 'settings') return;
  url.searchParams.set('section', section);
  const newUrl = `${url.pathname}?${url.searchParams}`;
  window.history.replaceState({ tab: 'settings', section }, '', newUrl);
  try {
    window.localStorage.setItem(SETTINGS_SECTION_KEY, section);
  } catch {
    // ignore
  }
}
