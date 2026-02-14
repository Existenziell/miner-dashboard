/**
 * Banner for dashboard-level notifications (block found, metric alerts).
 * variant: 'success' | 'danger'
 * - success: e.g. block found (title, summary, onDismiss)
 * - danger: metric alerts (alerts array, onDismiss, optional onRequestPermission)
 */
export default function NotificationBanner({
  variant,
  title,
  summary,
  alerts,
  onDismiss,
  onRequestPermission,
}) {
  const isSuccess = variant === 'success';
  const isDanger = variant === 'danger';

  if (isDanger && (!alerts?.length)) return null;

  const bannerClass = isSuccess ? 'banner-success' : 'banner-danger';
  const iconClass = isSuccess ? 'banner-icon-success' : 'banner-icon-danger';
  const icon = isSuccess ? '✓' : '!';

  const heading = isDanger
    ? (alerts.some((a) => a.severity === 'critical') ? 'Critical' : 'Warning') +
      (alerts.length > 1 ? ` · ${alerts.length} issues` : '')
    : title;

  return (
    <div role="alert" className={bannerClass}>
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`banner-icon ${iconClass} ${isSuccess ? 'text-lg' : ''}`} aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-current">{heading}</p>
            {isSuccess && summary && (
              <p className="mt-0.5 text-sm opacity-95">{summary}</p>
            )}
            {isDanger && (
              <ul className="mt-1.5 list-none space-y-1 text-sm opacity-95">
                {alerts.map((a) => (
                  <li key={a.id}>
                    {a.label}
                    {a.detail && <span className="opacity-90"> — {a.detail}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDanger && onRequestPermission && (
            <button
              type="button"
              onClick={onRequestPermission}
              className="link-text font-medium opacity-90 hover:opacity-100 transition-opacity text-current"
            >
              Enable browser alerts
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="btn-ghost-sm"
            aria-label={isSuccess ? 'Dismiss notification' : 'Dismiss alert'}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
