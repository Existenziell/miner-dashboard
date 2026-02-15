/**
 * Reusable "Pending changes" block: list of from → to changes and a Reset button.
 */
export function PendingChanges({ changes, onReset, title = 'Pending changes' }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div className="highlight-box">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="label font-semibold text-body">{title}</p>
        <button
          type="button"
          onClick={onReset}
          className="link-text text-body cursor-pointer"
        >
          Reset
        </button>
      </div>
      <ul className="text-sm text-body space-y-1">
        {changes.map((c) => (
          <li key={c.label}>
            <span className="text-muted dark:text-muted-dark">{c.label}:</span>{' '}
            <span className="line-through opacity-75">{c.from}</span>
            <span className="mx-1">→</span>
            <span className="text-accent font-medium">{c.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
