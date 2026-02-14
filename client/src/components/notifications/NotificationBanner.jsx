import { IconWarning, IconSuccess } from '@/components/Icons';

const NOTIFICATION_CLASS = {
  success: 'notification-success',
  warning: 'notification-warning',
};

/**
 * Shared notification banner. Use for connection errors, block found, metric notifications.
 *
 * @param {object} props
 * @param {'success'|'warning'} props.type - success (green), warning (amber)
 * @param {boolean} props.dismissable - show Dismiss button when true
 * @param {() => void} [props.onDismiss] - called when Dismiss is clicked (required if dismissable)
 * @param {string} [props.message] - single-line content (e.g. "Cannot reach miner: ...")
 * @param {string} [props.title] - heading (used with summary or items)
 * @param {string} [props.summary] - subtitle below title
 * @param {{ id: string, label: string, detail?: string }[]} [props.items] - list (e.g. metric notifications).
 * @param {React.ReactNode} [props.action] - optional slot (e.g. "Enable browser notifications" button)
 */
export default function NotificationBanner({
  type,
  dismissable,
  onDismiss,
  message,
  title,
  summary,
  items,
  action,
}) {
  if (items && items.length === 0) return null;

  const notificationClass = NOTIFICATION_CLASS[type] ?? NOTIFICATION_CLASS.warning;
  const isSuccess = type === 'success';

  const heading =
    title ??
    (type === 'warning' && items?.length
      ? (items.some((a) => a.severity === 'critical') ? 'Critical' : 'Warning') +
        (items.length > 1 ? ` · ${items.length} issues` : '')
      : null);

  return (
    <div role="alert" className={notificationClass}>
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 flex items-center text-current" aria-hidden>
            {isSuccess ? (
              <IconSuccess className="w-8 h-8" />
            ) : (
              <IconWarning className="w-6 h-6" />
            )}
          </span>
          <div className="min-w-0">
            {(heading || message) && (
              <p className="font-semibold text-current">
                {heading ?? message}
              </p>
            )}
            {summary && (
              <p className="mt-0.5 text-sm opacity-95">{summary}</p>
            )}
            {items?.length > 0 && (
              <ul className="mt-1.5 list-none space-y-1 text-sm opacity-95">
                {items.map((a) => (
                  <li key={a.id}>
                    {a.label}
                    {a.detail != null && a.detail !== '' && (
                      <span className="opacity-90"> — {a.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {(dismissable || action) && (
          <div className="flex items-center gap-2 shrink-0">
            {action}
            {dismissable && (
              <button
                type="button"
                onClick={onDismiss}
                className="btn-ghost-sm"
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
