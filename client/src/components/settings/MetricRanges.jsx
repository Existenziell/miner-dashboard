import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { IconCheckmark } from '@/components/Icons';

export function MetricRanges({
  metric,
  metricRanges,
  setMetricRangeValue,
  METRIC_LABELS,
  METRIC_KEY_LABELS,
  isDragActive,
  visibleOnDashboard,
  onToggleVisible,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragActive ? transition : 'none',
  };

  const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
  const values = metricRanges[metric] ?? {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md px-4 py-3 space-y-2 min-h-[150px] border border-default ${visibleOnDashboard === false ? 'opacity-50' : ''} ${isDragging ? 'opacity-0 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-normal capitalize min-w-0">
          {METRIC_LABELS[metric] ?? metric}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {onToggleVisible != null && (
            <label className="cursor-pointer" title="Show on dashboard">
              <input
                type="checkbox"
                checked={visibleOnDashboard !== false}
                onChange={(e) => onToggleVisible(metric, e.target.checked)}
                className="checkbox-input"
                aria-label={`Show ${METRIC_LABELS[metric] ?? metric} on dashboard`}
              />
              <span className="checkbox-box shrink-0" aria-hidden>
                <IconCheckmark className="checkbox-check" />
              </span>
            </label>
          )}
          <div
            className="cursor-grab active:cursor-grabbing touch-none text-muted hover:text-normal p-1 -m-1"
            aria-label={`Drag to reorder ${METRIC_LABELS[metric] ?? metric}`}
            {...attributes}
            {...listeners}
          >
            <span className="select-none text-lg leading-none" aria-hidden="true">⋮⋮</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <label className="text-xs text-muted shrink-0 min-w-[100px]" htmlFor={`metric-${metric}-${key}`}>
              {METRIC_KEY_LABELS[key] ?? key}
            </label>
            <input
              id={`metric-${metric}-${key}`}
              type="number"
              step={key.includes('Mv') || key.includes('Pct') ? 1 : 0.1}
              value={values[key] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') return;
                const num = Number(v);
                if (!Number.isNaN(num)) setMetricRangeValue(metric, key, num);
              }}
              className="input text-sm w-24"
              aria-label={`${METRIC_LABELS[metric] ?? metric} ${METRIC_KEY_LABELS[key] ?? key}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
