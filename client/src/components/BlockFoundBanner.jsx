export default function BlockFoundBanner({ onDismiss }) {
  return (
    <div role="alert" className="banner-success">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="banner-icon banner-icon-success text-lg" aria-hidden>
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
