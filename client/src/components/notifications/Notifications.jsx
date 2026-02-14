import { useNotifications } from '@/hooks/useNotifications';
import NotificationBanner from '@/components/notifications/NotificationBanner';

/**
 * Dashboard-level notifications: block found, metric notifications, connection errors.
 * All use the shared NotificationBanner (success / warning, dismissable or not).
 */
export default function Notifications({ minerError, networkError }) {
  const {
    activeNotifications,
    dismissNotifications,
    blockFoundVisible,
    dismissBlockFound,
    requestNotificationPermission,
    showPermissionPrompt,
  } = useNotifications(minerError, networkError);

  return (
    <>
      {minerError && (
        <NotificationBanner
          type="warning"
          dismissable={false}
          message={`Cannot reach miner: `}
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
      {blockFoundVisible && (
        <NotificationBanner
          type="success"
          dismissable
          onDismiss={dismissBlockFound}
          title="Block found!"
          summary="Your miner found a block."
        />
      )}
      <NotificationBanner
        type="warning"
        dismissable
        onDismiss={dismissNotifications}
        items={activeNotifications}
        action={
          showPermissionPrompt ? (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="link-text font-medium opacity-90 hover:opacity-100 transition-opacity text-current"
            >
              Enable browser notifications
            </button>
          ) : null
        }
      />
    </>
  );
}
