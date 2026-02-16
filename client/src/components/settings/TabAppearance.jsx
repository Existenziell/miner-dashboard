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
      className={`rounded-md px-4 py-3 space-y-2 min-h-[160px] border border-default ${isDragging ? 'opacity-0 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-normal capitalize min-w-0">
          {METRIC_LABELS[metric] ?? metric}
        </p>
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted hover:text-normal p-1 -m-1"
          aria-label={`Drag to reorder ${METRIC_LABELS[metric] ?? metric}`}
          {...attributes}
          {...listeners}
        >
          <span className="select-none text-lg leading-none" aria-hidden="true">⋮⋮</span>
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

export function TabAppearance() {
  const { mode, setMode } = useTheme();
  const {
    metricRanges,
    metricOrder,
    setMetricOrder,
    setMetricRangeValue,
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

  const order = metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  const overIndex = overId != null ? order.indexOf(overId) : -1;
  const showDropZone = activeId != null && overId !== activeId && overIndex >= 0;

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
          <p className="text-normal text-sm mb-6">
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
                    className="w-[240px] min-h-[160px] shrink-0"
                  >
                    <MetricRangeCard
                      metric={metric}
                      metricRanges={metricRanges}
                      setMetricRangeValue={setMetricRangeValue}
                      METRIC_LABELS={METRIC_LABELS}
                      METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                      isDragActive={activeId != null}
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

      {/* Colors */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Colors</h3>
          </div>
        </div>
        <div className="text-muted text-sm my-6 space-y-1">
          <div><strong>Accent color:</strong> Main color for buttons, gauges, and highlights. Darker shade is derived automatically.</div>
          <div><strong>Chart colors:</strong> Line colors for Power, Temperature, and Hashrate charts.</div>
        </div>
        <div className="space-y-4">
          <Field label="Accent color" hint="Main color for buttons, gauges, and highlights.">
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
          <div className="mt-8">
            <Field label="Chart colors" hint="Line colors for Power, Temperature, and Hashrate charts." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {CHART_COLOR_SPEC.map((chart) => {
                const seriesColors = chartColors[chart.id] ?? DASHBOARD_DEFAULTS.chartColors[chart.id];
                return (
                  <div key={chart.id} className="border border-default rounded-md px-4 py-3 space-y-1">
                    <p className="text-sm font-medium text-normal">{chart.label}</p>
                    {chart.series.map(({ key, label }) => {
                      const value = seriesColors[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id][key];
                      const effective = normalizeHex(value, DASHBOARD_DEFAULTS.chartColors[chart.id][key]);
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={effective}
                            onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                            className="w-8 h-8 rounded border border-default cursor-pointer bg-transparent shrink-0"
                            aria-label={`${chart.label} ${label} color`}
                          />
                          <label className="text-xs text-muted shrink-0 min-w-16" htmlFor={`chart-${chart.id}-${key}`}>
                            {label}
                          </label>
                          <input
                            id={`chart-${chart.id}-${key}`}
                            type="text"
                            value={seriesColors[key] ?? ''}
                            onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                            placeholder={DASHBOARD_DEFAULTS.chartColors[chart.id][key]}
                            className="input text-sm flex-1 min-w-0 font-mono"
                            aria-label={`${chart.label} ${label} hex`}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Theme - last before save */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Theme</h3>
          </div>
        </div>
        <p className="text-muted text-sm mb-4">
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
