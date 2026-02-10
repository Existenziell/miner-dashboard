export default function BlockFoundBanner({ onDismiss }) {
  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-xl border-l-4 border-l-success dark:border-l-success-dark bg-success/10 dark:bg-success-dark/10 border border-success/20 dark:border-success-dark/20 text-success dark:text-success-dark shadow-sm"
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white bg-success dark:bg-success-dark"
            aria-hidden
          >
            ✓
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-current">Block found!</p>
            <p className="mt-0.5 text-sm opacity-95">Your miner found a block.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="btn-ghost-sm shrink-0"
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
