/**
 * Reusable "Pending changes" block: list of from → to changes and a Reset button.
 */
export function PendingChanges({ changes, onReset, title = 'Pending changes' }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div className="pending-changes">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="label font-semibold text-normal">{title}</p>
        <button
          type="button"
          onClick={onReset}
          className="text-link text-sm"
        >
          Reset
        </button>
      </div>
      <ul className="text-sm text-normal space-y-1">
        {changes.map((c) => (
          <li key={c.label}>
            <span className="text-muted">{c.label}:</span>{' '}
            <span className="line-through opacity-75">{c.from}</span>
            <span className="mx-1">→</span>
            <span className="text-accent font-medium">{c.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
