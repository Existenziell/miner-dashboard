import { useLayoutEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useAppearanceContext } from '@/context/AppearanceContext';
import { useTheme } from '@/context/ThemeContext';
import { THEME_MODES } from '@/context/ThemeContext';
import { normalizeHex } from '@/lib/colorUtils';
import { ThemeIcon } from '@/components/Icons';
import { Field } from '@/components/settings/Field';

function MetricRangeCard({
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
                <svg
                  className="checkbox-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12l5 5 9-9" />
                </svg>
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

const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  'light-high-contrast': 'Light (high contrast)',
  'dark-high-contrast': 'Dark (high contrast)',
};

function ThemePreviewCard({ themeId, isSelected, onSelect, previewClassName, useDarkVariant }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(themeId)}
      className={`theme-preview-card w-full text-left rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark ${isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-edge dark:border-edge-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
      aria-pressed={isSelected}
      aria-label={`Theme: ${THEME_LABELS[themeId]}. Click to select.`}
    >
      <div className={`rounded-md overflow-hidden ${previewClassName} ${useDarkVariant ? 'dark' : ''}`}>
        <div className="h-7 bg-surface-light border-b border-edge" />
        <div className="p-2 space-y-1.5 bg-surface-card min-h-[52px]">
          <div className="h-2 rounded w-full bg-fg opacity-100" />
          <div className="h-1.5 rounded w-4/5 bg-muted opacity-100" />
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2 px-2 bg-surface-light border-t border-edge">
          <ThemeIcon mode={themeId} className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-xs font-medium text-fg dark:text-fg-dark truncate">{THEME_LABELS[themeId]}</span>
        </div>
      </div>
    </button>
  );
}

function ChartColorCard({
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
                <svg
                  className="checkbox-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12l5 5 9-9" />
                </svg>
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

export function TabAppearance() {
  const { mode, setMode } = useTheme();
  const {
    metricRanges,
    metricOrder,
    setMetricOrder,
    setMetricRangeValue,
    gaugeVisible,
    setGaugeVisible,
    chartVisible,
    setChartVisible,
    chartOrder,
    setChartOrder,
    METRIC_LABELS,
    METRIC_KEY_LABELS,
    accentColor,
    setAccentColor,
    chartColors,
    setChartColorValue,
    effectiveAccent,
    CHART_COLOR_SPEC,
  } = useAppearanceContext();

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dropZoneRect, setDropZoneRect] = useState(null);
  const cellRefs = useRef([]);

  const [chartActiveId, setChartActiveId] = useState(null);
  const [chartOverId, setChartOverId] = useState(null);
  const [chartDropZoneRect, setChartDropZoneRect] = useState(null);
  const chartCellRefs = useRef([]);

  const order = metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  const overIndex = overId != null ? order.indexOf(overId) : -1;
  const showDropZone = activeId != null && overId !== activeId && overIndex >= 0;

  const chartOrderList = chartOrder ?? DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id);
  const chartOverIndex = chartOverId != null ? chartOrderList.indexOf(chartOverId) : -1;
  const chartShowDropZone = chartActiveId != null && chartOverId !== chartActiveId && chartOverIndex >= 0;

  useLayoutEffect(() => {
    if (!showDropZone || overIndex < 0 || !cellRefs.current[overIndex]) {
      queueMicrotask(() => setDropZoneRect(null));
      return;
    }
    const el = cellRefs.current[overIndex];
    const rect = el.getBoundingClientRect();
    const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    queueMicrotask(() => setDropZoneRect(next));
  }, [showDropZone, overIndex]);

  useLayoutEffect(() => {
    if (!chartShowDropZone || chartOverIndex < 0 || !chartCellRefs.current[chartOverIndex]) {
      queueMicrotask(() => setChartDropZoneRect(null));
      return;
    }
    const el = chartCellRefs.current[chartOverIndex];
    const rect = el.getBoundingClientRect();
    const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    queueMicrotask(() => setChartDropZoneRect(next));
  }, [chartShowDropZone, chartOverIndex]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const next = event.over?.id ?? null;
    setOverId((prev) => (next === prev ? prev : next));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    setDropZoneRect(null);
    if (over == null || active.id === over.id) return;
    const ids = [...(metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges))];
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setMetricOrder(arrayMove(ids, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDropZoneRect(null);
  };

  const chartHandleDragStart = (event) => {
    setChartActiveId(event.active.id);
  };

  const chartHandleDragOver = (event) => {
    const next = event.over?.id ?? null;
    setChartOverId((prev) => (next === prev ? prev : next));
  };

  const chartHandleDragEnd = (event) => {
    const { active, over } = event;
    setChartActiveId(null);
    setChartOverId(null);
    setChartDropZoneRect(null);
    if (over == null || active.id === over.id) return;
    const ids = [...(chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id))];
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setChartOrder(arrayMove(ids, oldIndex, newIndex));
  };

  const chartHandleDragCancel = () => {
    setChartActiveId(null);
    setChartOverId(null);
    setChartDropZoneRect(null);
  };

  const themePreviewConfig = (themeId) => {
    if (themeId === 'light') return { previewClassName: 'theme-preview-light', useDarkVariant: false };
    if (themeId === 'dark') return { previewClassName: 'theme-preview-dark', useDarkVariant: true };
    if (themeId === 'light-high-contrast') return { previewClassName: 'theme-preview-light-hc', useDarkVariant: false };
    if (themeId === 'dark-high-contrast') return { previewClassName: 'theme-preview-dark-hc', useDarkVariant: true };
    return { previewClassName: 'theme-preview-light', useDarkVariant: false };
  };

  return (
    <div className="space-y-4">
      {/* Metric ranges */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Gauges</h3>
          </div>
        </div>
        <div className="space-y-4">
          <p className="card-subtitle">
            Customize display ranges and drag'n'drop to reorder metrics. Order here matches the gauge order on the dashboard.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={order} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-4 -mt-2">
                {order.map((metric, i) => (
                  <div
                    key={metric}
                    ref={(el) => { cellRefs.current[i] = el; }}
                    className="w-[240px] min-h-[150px] shrink-0"
                  >
                    <MetricRangeCard
                      metric={metric}
                      metricRanges={metricRanges}
                      setMetricRangeValue={setMetricRangeValue}
                      METRIC_LABELS={METRIC_LABELS}
                      METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                      isDragActive={activeId != null}
                      visibleOnDashboard={gaugeVisible[metric] !== false}
                      onToggleVisible={setGaugeVisible}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
            {dropZoneRect && (
              <div
                className="pointer-events-none fixed z-20 rounded-md box-border drop-zone-indicator"
                style={{
                  top: dropZoneRect.top,
                  left: dropZoneRect.left,
                  width: dropZoneRect.width,
                  height: dropZoneRect.height,
                }}
                aria-hidden
              />
            )}
            <DragOverlay dropAnimation={null}>
              {activeId ? (
                <div className="shadow-lg rounded-md cursor-grabbing">
                  <MetricRangeCard
                    metric={activeId}
                    metricRanges={metricRanges}
                    setMetricRangeValue={setMetricRangeValue}
                    METRIC_LABELS={METRIC_LABELS}
                    METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                    visibleOnDashboard={gaugeVisible[activeId] !== false}
                    onToggleVisible={null}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <div className="text-muted text-xs my-3 space-y-1">
            <div><strong>Gauge max:</strong> value that maps to 100% on the needle (the scale).</div>
            <div><strong>Min:</strong> lower bound for &quot;higher is better&quot; (hashrate, frequency).</div>
            <div><strong>Max:</strong> upper bound for &quot;lower is better&quot; (temp, power, efficiency, current).</div>
            <div><strong>Max (mV):</strong> allowed voltage deviation from set.</div>
          </div>
        </div>
      </div>

      {/* Graphs */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Charts</h3>
          </div>
        </div>
        <p className="card-subtitle">
          Customize line colors for Power, Temperature, and Hashrate charts. Drag to reorder; order here matches the dashboard. Toggle visibility; hidden charts appear dimmed.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={chartHandleDragStart}
          onDragOver={chartHandleDragOver}
          onDragEnd={chartHandleDragEnd}
          onDragCancel={chartHandleDragCancel}
        >
          <SortableContext items={chartOrderList} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4">
              {chartOrderList.map((chartId, i) => {
                const chart = CHART_COLOR_SPEC.find((c) => c.id === chartId);
                if (!chart) return null;
                return (
                  <div
                    key={chart.id}
                    ref={(el) => { chartCellRefs.current[i] = el; }}
                    className="min-h-0"
                  >
                    <ChartColorCard
                      chart={chart}
                      chartColors={chartColors}
                      chartVisible={chartVisible}
                      setChartColorValue={setChartColorValue}
                      setChartVisible={setChartVisible}
                      isDragActive={chartActiveId != null}
                      onToggleVisible={setChartVisible}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
          {chartDropZoneRect && (
            <div
              className="pointer-events-none fixed z-20 rounded-md box-border drop-zone-indicator"
              style={{
                top: chartDropZoneRect.top,
                left: chartDropZoneRect.left,
                width: chartDropZoneRect.width,
                height: chartDropZoneRect.height,
              }}
              aria-hidden
            />
          )}
          <DragOverlay dropAnimation={null}>
            {chartActiveId ? (() => {
              const chart = CHART_COLOR_SPEC.find((c) => c.id === chartActiveId);
              return chart ? (
                <div className="shadow-lg rounded-md cursor-grabbing bg-surface dark:bg-surface-dark">
                  <ChartColorCard
                    chart={chart}
                    chartColors={chartColors}
                    chartVisible={chartVisible}
                    setChartColorValue={setChartColorValue}
                    setChartVisible={setChartVisible}
                    onToggleVisible={null}
                    sortable={false}
                  />
                </div>
              ) : null;
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Accent color */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Accent color</h3>
          </div>
        </div>
        <p className="card-subtitle">
          Main color for buttons, gauges, and highlights. Darker shade is derived automatically.
        </p>
        <div className="space-y-4">
          <Field label="Accent color">
            <div className="flex items-center gap-2 max-w-96">
              <input
                type="color"
                value={effectiveAccent}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border border-default cursor-pointer bg-transparent"
                aria-label="Accent color picker"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder={DASHBOARD_DEFAULTS.accentColor}
                className="input flex-1 min-w-0 font-mono text-sm"
                aria-label="Accent color hex"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Theme - last before save */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Theme</h3>
          </div>
        </div>
        <p className="card-subtitle">
          Choose a theme. High contrast uses stronger text contrast. You can also cycle themes from the header.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {THEME_MODES.map((themeId) => {
            const { previewClassName, useDarkVariant } = themePreviewConfig(themeId);
            return (
              <ThemePreviewCard
                key={themeId}
                themeId={themeId}
                isSelected={mode === themeId}
                onSelect={setMode}
                previewClassName={previewClassName}
                useDarkVariant={useDarkVariant}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
