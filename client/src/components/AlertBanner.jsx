export default function AlertBanner({ alerts, onRequestPermission, onDismiss }) {
  if (!alerts?.length) return null;

  const critical = alerts.filter((a) => a.severity === 'critical');
  const isCritical = critical.length > 0;

  return (
    <div role="alert" className="banner-danger">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="banner-icon banner-icon-danger" aria-hidden>
            !
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-current">
              {isCritical ? 'Critical' : 'Warning'}
              {alerts.length > 1 && ` · ${alerts.length} issues`}
            </p>
            <ul className="mt-1.5 list-none space-y-1 text-sm opacity-95">
              {alerts.map((a) => (
                <li key={a.id}>
                  {a.label}
                  {a.detail && <span className="opacity-90"> — {a.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRequestPermission && (
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
            aria-label="Dismiss alert"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
