import { useMiner } from '../context/MinerContext';
import { useAlerts } from '../hooks/useAlerts';
import NotificationBanner from './NotificationBanner';

const TEST_NOTIFICATIONS =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('testNotifications') === '1';

const MOCK_ALERTS = [
  { id: 'temp_high', label: 'ASIC temperature high', detail: '65.0°C', severity: 'warning' },
  { id: 'reject_rate', label: 'High reject rate', detail: '8.0% rejected', severity: 'critical' },
];

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

  if (TEST_NOTIFICATIONS) {
    return (
      <>
        <div className="alert-box-danger">Cannot reach miner: Connection refused (test)</div>
        <div className="alert-box-warning">Network data unavailable: Failed to fetch (test)</div>
        <NotificationBanner
          variant="success"
          title="Block found!"
          summary="Your miner found a block."
          onDismiss={() => {}}
        />
        <NotificationBanner
          variant="saved"
          title="Settings saved"
          summary="Your settings have been saved."
          onDismiss={() => {}}
        />
        <NotificationBanner
          variant="danger"
          alerts={MOCK_ALERTS}
          onDismiss={() => {}}
          onRequestPermission={showPermissionPrompt ? requestNotificationPermission : undefined}
        />
      </>
    );
  }

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
