import { useMiner } from '@/context/MinerContext';
import { useAlerts } from '@/hooks/useAlerts';
import NotificationBanner from '@/components/notifications/NotificationBanner';

/**
 * Dashboard-level notifications: block found, metric alerts, connection errors.
 * For inline feedback (e.g. "saved" after form submit) use a short toast in the page.
 */
export default function Notifications({ activeTab, minerError, networkError }) {
  const { data: miner } = useMiner();
  const {
    activeAlerts,
    dismissAlerts,
    blockFoundVisible,
    dismissBlockFound,
    requestNotificationPermission,
  } = useAlerts(miner, { minerError, networkError });

  // Miner error shows on all tabs; rest only on dashboard
  if (activeTab !== 'dashboard') {
    return minerError ? (
      <div className="alert-box-danger">Cannot reach miner: {minerError}</div>
    ) : null;
  }

  const showPermissionPrompt =
    typeof Notification !== 'undefined' && Notification.permission === 'default';

  return (
    <>
      {minerError && (
        <div className="alert-box-danger">Cannot reach miner: {minerError}</div>
      )}
      {networkError && (
        <div className="alert-box-warning">Network data unavailable: {networkError}</div>
      )}
      {blockFoundVisible && (
        <NotificationBanner
          variant="success"
          title="Block found!"
          summary="Your miner found a block."
          onDismiss={dismissBlockFound}
        />
      )}
      <NotificationBanner
        variant="danger"
        alerts={activeAlerts}
        onDismiss={dismissAlerts}
        onRequestPermission={showPermissionPrompt ? requestNotificationPermission : undefined}
      />
    </>
  );
}
