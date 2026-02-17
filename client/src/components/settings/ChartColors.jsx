import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { normalizeHex } from '@/lib/colorUtils';
import { IconCheckmark } from '@/components/Icons';

export function ChartColors({
  chart,
  chartColors,
  chartVisible,
  setChartColorValue,
  setChartVisible,
  isDragActive,
  onToggleVisible,
  sortable = true,
}) {
  const sortableResult = useSortable({ id: chart.id, disabled: !sortable });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  const style = sortable
    ? { transform: CSS.Transform.toString(transform), transition: isDragActive ? transition : 'none' }
    : undefined;

  const visibleOnDashboard = chartVisible[chart.id] !== false;
  const seriesColors = chartColors[chart.id] ?? DASHBOARD_DEFAULTS.chartColors[chart.id];

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={`border border-default rounded-md px-4 py-3 space-y-1 flex flex-col ${visibleOnDashboard ? '' : 'opacity-50'} ${sortable && isDragging ? 'opacity-0 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-sm font-medium text-normal">{chart.label}</p>
        <div className="flex items-center gap-3 shrink-0">
          {onToggleVisible != null && (
            <label className="cursor-pointer" title="Show on dashboard">
              <input
                type="checkbox"
                checked={visibleOnDashboard}
                onChange={(e) => setChartVisible(chart.id, e.target.checked)}
                className="checkbox-input"
                aria-label={`Show ${chart.label} on dashboard`}
              />
              <span className="checkbox-box shrink-0" aria-hidden>
                <IconCheckmark className="checkbox-check" />
              </span>
            </label>
          )}
          {sortable && (
            <div
              className="cursor-grab active:cursor-grabbing touch-none text-muted hover:text-normal p-1 -m-1"
              aria-label={`Drag to reorder ${chart.label}`}
              {...attributes}
              {...listeners}
            >
              <span className="select-none text-lg leading-none" aria-hidden="true">⋮⋮</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {chart.series.map(({ key, label }) => {
          const value = seriesColors[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id][key];
          const effective = normalizeHex(value, DASHBOARD_DEFAULTS.chartColors[chart.id][key]);
          return (
            <div key={key} className="flex items-center gap-2 min-w-0">
              <input
                type="color"
                value={effective}
                onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                className="w-8 h-8 rounded border border-default cursor-pointer bg-transparent shrink-0"
                aria-label={`${chart.label} ${label} color`}
              />
              <input
                id={`chart-${chart.id}-${key}`}
                type="text"
                value={seriesColors[key] ?? ''}
                onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                placeholder={DASHBOARD_DEFAULTS.chartColors[chart.id][key]}
                className="input text-sm max-w-24 min-w-0 font-mono"
                aria-label={`${chart.label} ${label} hex`}
              />
              <label
                className="text-xs text-muted shrink-0 text-left w-16"
                htmlFor={`chart-${chart.id}-${key}`}
              >
                {label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
