import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMiner } from '@/context/MinerContext';
import { evaluateNotifications } from '@/lib/notificationRules';

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
 * Hook for notification state: miner connection errors, metric notifications, block-found banner.
 * Uses miner data from context.
 */
export function useNotifications(minerError, networkError) {
  const { data: miner } = useMiner();

  const stickyRef = useRef({});
  const displayedRef = useRef([]);
  const prevBlockCountRef = useRef(null);

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

  // Block found: show banner when block count increases
  useEffect(() => {
    if (!miner) return;
    const raw = miner.totalFoundBlocks ?? miner.foundBlocks;
    const count = typeof raw === 'number' ? raw : (miner.blockFound ? 1 : 0);
    const prev = prevBlockCountRef.current;
    if (typeof count === 'number' && count > 0 && (prev == null || count > prev)) {
      queueMicrotask(() => setBlockFoundVisible(true));
    }
    prevBlockCountRef.current = count;
  }, [miner]);

  const dismissBlockFound = useCallback(() => setBlockFoundVisible(false), []);

  return {
    minerError,
    networkError,
    activeNotifications,
    dismissNotifications,
    blockFoundVisible,
    dismissBlockFound,
  };
}
