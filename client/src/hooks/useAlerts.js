import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { evaluateAlerts } from '@/lib/alerts';
import { ALERT_COOLDOWN_MS, NOTIFICATION_AUTO_CLOSE_MS } from '@/lib/constants';

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const duration = 2.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth'; // raw, siren-like

    // Siren: frequency sweeps up and down (wail)
    const low = 400;
    const high = 900;
    osc.frequency.setValueAtTime(low, now);
    osc.frequency.linearRampToValueAtTime(high, now + 0.45);
    osc.frequency.linearRampToValueAtTime(low, now + 0.9);
    osc.frequency.linearRampToValueAtTime(high, now + 1.35);
    osc.frequency.linearRampToValueAtTime(low, now + 1.8);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.setValueAtTime(0.25, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // ignore if AudioContext not supported or autoplay blocked
  }
}

function showBrowserNotification(title, body, tag = 'miner-alert') {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(title, { body, tag });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      setTimeout(() => n.close(), NOTIFICATION_AUTO_CLOSE_MS);
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
// If an alert is currently in evaluated (re-triggered), show it again even if previously dismissed
function buildDisplayed(evaluated, sticky, dismissedIds) {
  const evaluatedIds = new Set(evaluated.map((a) => a.id));
  const byId = new Map(evaluated.map((a) => [a.id, a]));
  for (const [id, entry] of Object.entries(sticky)) {
    if (!byId.has(id)) byId.set(id, entry);
  }
  return [...byId.values()].filter((a) => !dismissedIds.has(a.id) || evaluatedIds.has(a.id));
}

export function useAlerts(minerData, { minerError, networkError } = {}) {
  const lastFiredRef = useRef({});
  const prevActiveIdsRef = useRef(new Set());
  const stickyRef = useRef({});
  const displayedRef = useRef([]);
  const prevBlockCountRef = useRef(null);

  const evaluated = useMemo(() => evaluateAlerts(minerData), [minerData]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [blockFoundVisible, setBlockFoundVisible] = useState(false);

  // Update sticky from evaluated and compute displayed list (all in one effect to avoid cascading setState)
  useEffect(() => {
    const sticky = stickyRef.current;
    for (const a of evaluated) {
      sticky[a.id] = { id: a.id, label: a.label, severity: a.severity, detail: a.detail };
    }
    const displayed = buildDisplayed(evaluated, sticky, dismissedIds);
    setActiveAlerts(displayed);
    displayedRef.current = displayed;
  }, [evaluated, dismissedIds]);

  const dismissAlerts = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      for (const a of displayedRef.current) next.add(a.id);
      return next;
    });
  }, []);

  // Sound + notification when an alert actually triggers
  useEffect(() => {
    if (evaluated.length === 0) {
      prevActiveIdsRef.current = new Set();
      return;
    }

    const now = Date.now();
    const activeIds = new Set(evaluated.map((a) => a.id));
    const prevIds = prevActiveIdsRef.current;

    for (const alert of evaluated) {
      const justTriggered = !prevIds.has(alert.id);
      const lastFired = lastFiredRef.current[alert.id] ?? 0;
      const cooldownPassed = now - lastFired >= ALERT_COOLDOWN_MS;

      if (justTriggered || cooldownPassed) {
        lastFiredRef.current[alert.id] = now;
        const title = `Miner: ${alert.label}`;
        const body = alert.detail ? `${alert.detail}` : 'Check dashboard.';
        getNotificationPermission().then((perm) => {
          if (perm === 'granted') showBrowserNotification(title, body, `miner-${alert.id}`);
        });
        playAlertSound();
      }
    }

    prevActiveIdsRef.current = activeIds;
  }, [evaluated]);

  // Block found: show banner and play sound when block count increases
  useEffect(() => {
    if (!minerData) return;
    const raw = minerData.totalFoundBlocks ?? minerData.foundBlocks;
    const count = typeof raw === 'number' ? raw : (minerData.blockFound ? 1 : 0);
    const prev = prevBlockCountRef.current;
    if (typeof count === 'number' && count > 0 && (prev == null || count > prev)) {
      queueMicrotask(() => setBlockFoundVisible(true));
      playAlertSound();
    }
    prevBlockCountRef.current = count;
  }, [minerData]);

  const dismissBlockFound = useCallback(() => setBlockFoundVisible(false), []);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    activeAlerts,
    dismissAlerts,
    blockFoundVisible,
    dismissBlockFound,
    requestNotificationPermission,
    minerError,
    networkError,
  };
}
