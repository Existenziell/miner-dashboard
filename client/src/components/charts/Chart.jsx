import { formatTime } from '@/lib/chartUtils';

/** Recharts tooltip wrapper: time label + list of series values. */
export function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-card">
      <div className="text-muted-standalone text-xs mb-1">{formatTime(label)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatValue(entry)}
        </div>
      ))}
    </div>
  );
}

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

/** Card shell for time-series charts: title, collapse, loading state. */
export function ChartCard({ title, loading, loadingMessage, collapsed, onToggleCollapsed, children }) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">{title}</h3>
          </div>
        </div>
        <div className="h-72 flex items-center justify-center">
          <span className="text-muted-standalone text-sm">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card${collapsed ? ' card--collapsed' : ''}`}>
      <div className="card-header-wrapper">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`card-header cursor-pointer border-0 focus:outline-none${collapsed ? ' rounded-b-md' : ''}`}
          aria-expanded={!collapsed}
        >
          <h3 className="card-header-title">{title}</h3>
          <span className="text-muted-standalone text-sm shrink-0">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}
