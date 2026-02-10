export default function BlockFoundBanner({ onDismiss }) {
  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-xl border-l-4 border-l-green-500 bg-green-500/10 border border-green-500/20 text-green-800 dark:text-green-200 shadow-sm"
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white"
            aria-hidden
            style={{ backgroundColor: 'var(--c-success)' }}
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
          className="rounded-lg border border-current/30 bg-transparent px-3 py-1.5 text-sm font-medium opacity-90 hover:opacity-100 hover:bg-current/10 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
