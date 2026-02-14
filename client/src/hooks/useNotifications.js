import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMiner } from '@/context/MinerContext';
import { BROWSER_NOTIFICATION_COOLDOWN_MS } from '@/lib/constants';
import { evaluateNotifications } from '@/lib/notificationRules';

function showBrowserNotification(title, body, tag = 'miner-notification') {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(title, { body, tag });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // ignore notification errors
    }
  }
}

function getNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

// Merge evaluated (current) + sticky (ever seen); keep in list until user dismisses (no expiry)
// If a notification is currently in evaluated (re-triggered), show it again even if previously dismissed
function buildDisplayed(evaluated, sticky, dismissedIds) {
  const evaluatedIds = new Set(evaluated.map((a) => a.id));
  const byId = new Map(evaluated.map((a) => [a.id, a]));
  for (const [id, entry] of Object.entries(sticky)) {
    if (!byId.has(id)) byId.set(id, entry);
  }
  return [...byId.values()].filter((a) => !dismissedIds.has(a.id) || evaluatedIds.has(a.id));
}

/**
 * Single hook for all notification state: miner connection errors, metric notifications,
 * block-found banner, browser notifications (OS notifications when permitted). Uses miner data from context.
 */
function getShowAllNotificationsFromUrl() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('notifications') === 'all' || params.get('alerts') === 'all';
}

export function useNotifications(minerError, networkError) {
  const { data: miner } = useMiner();
  const showAllNotifications = getShowAllNotificationsFromUrl();

  const lastFiredRef = useRef({});
  const prevActiveIdsRef = useRef(new Set());
  const stickyRef = useRef({});
  const displayedRef = useRef([]);
  const prevBlockCountRef = useRef(null);

  // When ?alerts=all we only force the success (block found) banner; metric list uses real miner data
  const evaluated = useMemo(() => evaluateNotifications(miner), [miner]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [blockFoundVisible, setBlockFoundVisible] = useState(false);

  // Update sticky from evaluated and compute displayed list (all in one effect to avoid cascading setState)
  useEffect(() => {
    const sticky = stickyRef.current;
    for (const a of evaluated) {
      sticky[a.id] = { id: a.id, label: a.label, severity: a.severity, detail: a.detail };
    }
    const displayed = buildDisplayed(evaluated, sticky, dismissedIds);
    setActiveNotifications(displayed);
    displayedRef.current = displayed;
  }, [evaluated, dismissedIds]);

  const dismissNotifications = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      for (const a of displayedRef.current) next.add(a.id);
      return next;
    });
  }, []);

  // Browser (OS) notification when a metric notification triggers (throttled by cooldown)
  useEffect(() => {
    if (evaluated.length === 0) {
      prevActiveIdsRef.current = new Set();
      return;
    }

    const now = Date.now();
    const activeIds = new Set(evaluated.map((a) => a.id));
    const prevIds = prevActiveIdsRef.current;

    for (const notification of evaluated) {
      const justTriggered = !prevIds.has(notification.id);
      const lastFired = lastFiredRef.current[notification.id] ?? 0;
      const cooldownPassed = now - lastFired >= BROWSER_NOTIFICATION_COOLDOWN_MS;

      if (justTriggered || cooldownPassed) {
        lastFiredRef.current[notification.id] = now;
        const title = `Miner: ${notification.label}`;
        const body = notification.detail ? `${notification.detail}` : 'Check dashboard.';
        getNotificationPermission().then((perm) => {
          if (perm === 'granted') showBrowserNotification(title, body, `miner-${notification.id}`);
        });
      }
    }

    prevActiveIdsRef.current = activeIds;
  }, [evaluated]);

  // Block found: show banner and OS notification when block count increases (works when tab in background)
  useEffect(() => {
    if (!miner) return;
    const raw = miner.totalFoundBlocks ?? miner.foundBlocks;
    const count = typeof raw === 'number' ? raw : (miner.blockFound ? 1 : 0);
    const prev = prevBlockCountRef.current;
    if (typeof count === 'number' && count > 0 && (prev == null || count > prev)) {
      queueMicrotask(() => setBlockFoundVisible(true));
      getNotificationPermission().then((perm) => {
        if (perm === 'granted') {
          showBrowserNotification('Block found!', 'Your miner found a block.', 'block-found');
        }
      });
    }
    prevBlockCountRef.current = count;
  }, [miner]);

  const dismissBlockFound = useCallback(() => setBlockFoundVisible(false), []);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showPermissionPrompt =
    typeof Notification !== 'undefined' && Notification.permission === 'default';

  // When ?notifications=all, show success banner(s) too for UI testing
  const blockFoundVisibleForRender = blockFoundVisible || showAllNotifications;

  return {
    minerError,
    networkError,
    activeNotifications,
    dismissNotifications,
    blockFoundVisible: blockFoundVisibleForRender,
    dismissBlockFound,
    requestNotificationPermission,
    showPermissionPrompt,
  };
}
