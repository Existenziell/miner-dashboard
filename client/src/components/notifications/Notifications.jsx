import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { SHOW_BLOCK_FOUND_PREVIEW_EVENT } from '@/lib/blockFoundPreview';
import BlockFoundOverlay from '@/components/notifications/BlockFoundOverlay';
import NotificationBanner from '@/components/notifications/NotificationBanner';

/** Fake block details for the Settings preview so the overlay looks like a real block was found. */
function getFakeBlockDetails() {
  return {
    id: '00000000000000000001a2b3c4d5e6f7890abcdef1234567890abcdef12345678',
    height: 890142,
    timestamp: Math.floor(Date.now() / 1000) - 45,
    tx_count: 2847,
    size: 1_675_000,
    weight: 3_980_000,
  };
}

/**
 * Dashboard-level notifications: block found (full-screen celebration), metric notifications, connection errors.
 */
export default function Notifications({ minerError, networkError }) {
  const {
    activeNotifications,
    dismissNotifications,
    blockFoundVisible,
    blockFoundSnapshot,
    dismissBlockFound,
  } = useNotifications(minerError, networkError);

  const [previewFromSettings, setPreviewFromSettings] = useState(false);
  const showCelebration = blockFoundVisible || previewFromSettings;

  useEffect(() => {
    const onRequest = () => setPreviewFromSettings(true);
    window.addEventListener(SHOW_BLOCK_FOUND_PREVIEW_EVENT, onRequest);
    return () => window.removeEventListener(SHOW_BLOCK_FOUND_PREVIEW_EVENT, onRequest);
  }, []);

  const handleCelebrationDismiss = () => {
    if (blockFoundVisible) dismissBlockFound();
    if (previewFromSettings) setPreviewFromSettings(false);
  };

  const celebrationSnapshot =
    blockFoundSnapshot ?? (previewFromSettings ? { totalFoundBlocks: 1 } : null);

  const blockDetailsOverride = previewFromSettings ? getFakeBlockDetails() : null;

  return (
    <>
      {minerError && (
        <NotificationBanner
          type="warning"
          dismissable={false}
          message="Cannot reach miner:"
          summary={minerError}
        />
      )}
      {networkError && (
        <NotificationBanner
          type="warning"
          dismissable={false}
          message={`Network data unavailable: ${networkError}`}
        />
      )}
      {showCelebration && (
        <BlockFoundOverlay
          onDismiss={handleCelebrationDismiss}
          blockFoundSnapshot={celebrationSnapshot}
          blockDetailsOverride={blockDetailsOverride}
        />
      )}
      <NotificationBanner
        type="warning"
        dismissable
        onDismiss={dismissNotifications}
        items={activeNotifications}
      />
    </>
  );
}
