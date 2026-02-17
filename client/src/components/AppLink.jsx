import { setTabInUrl } from '@/lib/tabUrl';

function shouldInterceptClick(e, target) {
  // Only intercept unmodified left-clicks on same-tab navigation.
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false;
  if (target && target !== '_self') return false;
  return true;
}

function parseTabTargetFromHref(href) {
  if (!href || typeof window === 'undefined') return null;

  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  // External links should behave like normal anchors.
  if (url.origin !== window.location.origin) return null;
  // Only handle same-path navigation (tabs/sections live on one page).
  if (url.pathname !== window.location.pathname) return null;
  // Don't hijack hash links (e.g. in-page anchors).
  if (url.hash) return null;

  const tab = url.searchParams.get('tab') ?? 'dashboard';
  const section = url.searchParams.get('section');

  if (tab !== 'dashboard' && tab !== 'settings' && tab !== 'docs' && tab !== 'api') return null;
  return { tab, section };
}

export default function AppLink({ href, onClick, target, ...props }) {
  return (
    <a
      href={href}
      target={target}
      onClick={(e) => {
        onClick?.(e);
        if (!shouldInterceptClick(e, target)) return;

        const targetFromHref = parseTabTargetFromHref(href);
        if (!targetFromHref) return;

        e.preventDefault();

        if (targetFromHref.tab === 'settings' && targetFromHref.section) {
          setTabInUrl('settings', { section: targetFromHref.section });
        } else {
          setTabInUrl(targetFromHref.tab);
        }

        // `replaceState` doesn't fire popstate; trigger a synthetic one so listeners
        // (e.g. App tab state) sync immediately without a full reload.
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
      {...props}
    />
  );
}
