export default function AlertBanner({ alerts, onRequestPermission, onDismiss }) {
  if (!alerts?.length) return null;

  const critical = alerts.filter((a) => a.severity === 'critical');
  const isCritical = critical.length > 0;

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-xl border-l-4 border-l-danger dark:border-l-danger-dark bg-danger/10 dark:bg-danger-dark/10 border border-danger/20 dark:border-danger-dark/20 text-danger dark:text-danger-dark shadow-sm"
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-white leading-none bg-danger dark:bg-danger-dark"
            aria-hidden
          >
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
