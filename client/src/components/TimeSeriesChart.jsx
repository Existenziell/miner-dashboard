/**
 * Series shape: { key: string, name: string, color: string, width?: number, axis?: string }
 */
export function ClickableLegend({ series, hidden, onToggle }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
      {series.map((s) => {
        const off = hidden.has(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onToggle(s.key)}
            className="legend-btn"
            style={{ opacity: off ? 0.35 : 1 }}
          >
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-standalone">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Card shell for time-series charts: title, collapse, loading state.
 * @param {string} title - Chart title
 * @param {boolean} loading - Show loading placeholder
 * @param {string} loadingMessage - Message when loading
 * @param {boolean} collapsed - Whether chart is collapsed
 * @param {() => void} onToggleCollapsed - Toggle collapse
 * @param {React.ReactNode} children - Content when not loading and expanded (legend + chart)
 */
export function ChartCard({ title, loading, loadingMessage, collapsed, onToggleCollapsed, children }) {
  if (loading) {
    return (
      <div className="card">
        <div className="bg-surface-light dark:bg-surface-light-dark -mx-5 -mt-5 px-5 py-3 rounded-t-xl mb-4">
          <h3 className="text-lg font-semibold text-body m-0">{title}</h3>
        </div>
        <div className="h-72 flex items-center justify-center">
          <span className="text-muted-standalone text-sm">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="-mx-5 -mt-5 mb-4 min-w-0">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="w-full text-left bg-surface-light dark:bg-surface-light-dark px-5 py-3 rounded-t-xl flex items-center justify-between gap-2 cursor-pointer border-0 focus:outline-none"
          aria-expanded={!collapsed}
        >
          <h3 className="text-lg font-semibold text-body m-0">{title}</h3>
          <span className="text-muted-standalone text-sm shrink-0">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}
