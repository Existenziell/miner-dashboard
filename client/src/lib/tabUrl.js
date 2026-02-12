/**
 * Tab state synced with URL query (?tab=settings|docs|api).
 * Valid tab ids: 'dashboard' | 'settings' | 'docs' | 'api'
 */

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
  if (tab === 'dashboard') url.searchParams.delete('tab');
  else url.searchParams.set('tab', tab);
  const newUrl = url.search ? `${url.pathname}?${url.searchParams}` : url.pathname;
  window.history.replaceState({ tab }, '', newUrl);
}
