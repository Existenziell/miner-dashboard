import {
  DndContext,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useAppearanceContext } from '@/context/AppearanceContext';
import { useTheme } from '@/context/ThemeContext';
import { THEME_MODES } from '@/context/ThemeContext';
import { useOrderDnd } from '@/hooks/useOrderDnd';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ChartColors } from '@/components/settings/ChartColors';
import { Field } from '@/components/settings/Field';
import { MetricRanges } from '@/components/settings/MetricRanges';
import { ThemePreviews } from '@/components/settings/ThemePreviews';

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
    hasGaugeChanges,
    hasChartChanges,
    hasAccentChanges,
    hasGaugeDefaultsDiff,
    hasChartDefaultsDiff,
    hasAccentDefaultsDiff,
    saving,
    message,
    saveGaugesSection,
    saveChartsSection,
    saveAccentSection,
    resetConfirmSection,
    setResetConfirmSection,
    resetGaugesToDefaults,
    resetChartsToDefaults,
    resetAccentToDefaults,
  } = useAppearanceContext();

  const order = metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  const metricDnd = useOrderDnd(order, setMetricOrder);

  const chartOrderList = chartOrder ?? DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id);
  const chartDnd = useOrderDnd(chartOrderList, setChartOrder);

  const themePreviewConfig = (themeId) => {
    if (themeId === 'light') return { previewClassName: 'theme-preview-light', useDarkVariant: false };
    if (themeId === 'dark') return { previewClassName: 'theme-preview-dark', useDarkVariant: true };
    if (themeId === 'light-high-contrast') return { previewClassName: 'theme-preview-light-hc', useDarkVariant: false };
    if (themeId === 'dark-high-contrast') return { previewClassName: 'theme-preview-dark-hc', useDarkVariant: true };
    return { previewClassName: 'theme-preview-light', useDarkVariant: false };
  };

  return (
    <div className="space-y-4">
      {message?.type === 'error' && message?.text && (
        <div role="alert" className="message-warning">
          {message.text}
        </div>
      )}
      {/* Metric ranges */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-header-title">Gauges</h3>
            <div className="flex items-center gap-3 ml-auto">
              {message?.type === 'success' && message?.section === 'gauges' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => setResetConfirmSection('gauges')}
                disabled={!hasGaugeDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!hasGaugeDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveGaugesSection}
                disabled={!hasGaugeChanges || saving || (message?.type === 'success' && message?.section === 'gauges')}
                className="btn-ghost-sm min-w-[5.5rem]"
                aria-disabled={!hasGaugeChanges || saving}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="card-subtitle">
            Customize display ranges and drag'n'drop to reorder metrics. Order here matches the gauge order on the dashboard.
          </p>
          <DndContext
            sensors={metricDnd.sensors}
            collisionDetection={closestCenter}
            onDragStart={metricDnd.handleDragStart}
            onDragOver={metricDnd.handleDragOver}
            onDragEnd={metricDnd.handleDragEnd}
            onDragCancel={metricDnd.handleDragCancel}
          >
            <SortableContext items={order} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-4 -mt-2">
                {order.map((metric, i) => (
                  <div
                    key={metric}
                    ref={(el) => { metricDnd.cellRefs.current[i] = el; }}
                    className="w-[240px] min-h-[150px] shrink-0"
                  >
                    <MetricRanges
                      metric={metric}
                      metricRanges={metricRanges}
                      setMetricRangeValue={setMetricRangeValue}
                      METRIC_LABELS={METRIC_LABELS}
                      METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                      isDragActive={metricDnd.activeId != null}
                      visibleOnDashboard={gaugeVisible[metric] !== false}
                      onToggleVisible={setGaugeVisible}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
            {metricDnd.dropZoneRect && (
              <div
                className="pointer-events-none fixed z-20 rounded-md box-border drop-zone-indicator"
                style={{
                  top: metricDnd.dropZoneRect.top,
                  left: metricDnd.dropZoneRect.left,
                  width: metricDnd.dropZoneRect.width,
                  height: metricDnd.dropZoneRect.height,
                }}
                aria-hidden
              />
            )}
            <DragOverlay dropAnimation={null}>
              {metricDnd.activeId ? (
                <div className="shadow-lg rounded-md cursor-grabbing">
                  <MetricRanges
                    metric={metricDnd.activeId}
                    metricRanges={metricRanges}
                    setMetricRangeValue={setMetricRangeValue}
                    METRIC_LABELS={METRIC_LABELS}
                    METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                    visibleOnDashboard={gaugeVisible[metricDnd.activeId] !== false}
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

      {/* Charts */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-header-title">Charts</h3>
            <div className="flex items-center gap-3 ml-auto">
              {message?.type === 'success' && message?.section === 'charts' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => setResetConfirmSection('charts')}
                disabled={!hasChartDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!hasChartDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveChartsSection}
                disabled={!hasChartChanges || saving || (message?.type === 'success' && message?.section === 'charts')}
                className="btn-ghost-sm min-w-[5.5rem]"
                aria-disabled={!hasChartChanges || saving}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <p className="card-subtitle">
          Customize line colors for Power, Temperature, and Hashrate charts. Drag to reorder; order here matches the dashboard. Toggle visibility; hidden charts appear dimmed.
        </p>
        <DndContext
          sensors={chartDnd.sensors}
          collisionDetection={closestCenter}
          onDragStart={chartDnd.handleDragStart}
          onDragOver={chartDnd.handleDragOver}
          onDragEnd={chartDnd.handleDragEnd}
          onDragCancel={chartDnd.handleDragCancel}
        >
          <SortableContext items={chartOrderList} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4">
              {chartOrderList.map((chartId, i) => {
                const chart = CHART_COLOR_SPEC.find((c) => c.id === chartId);
                if (!chart) return null;
                return (
                  <div
                    key={chart.id}
                    ref={(el) => { chartDnd.cellRefs.current[i] = el; }}
                    className="min-h-0"
                  >
                    <ChartColors
                      chart={chart}
                      chartColors={chartColors}
                      chartVisible={chartVisible}
                      setChartColorValue={setChartColorValue}
                      setChartVisible={setChartVisible}
                      isDragActive={chartDnd.activeId != null}
                      onToggleVisible={setChartVisible}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
          {chartDnd.dropZoneRect && (
            <div
              className="pointer-events-none fixed z-20 rounded-md box-border drop-zone-indicator"
              style={{
                top: chartDnd.dropZoneRect.top,
                left: chartDnd.dropZoneRect.left,
                width: chartDnd.dropZoneRect.width,
                height: chartDnd.dropZoneRect.height,
              }}
              aria-hidden
            />
          )}
          <DragOverlay dropAnimation={null}>
            {chartDnd.activeId ? (() => {
              const chart = CHART_COLOR_SPEC.find((c) => c.id === chartDnd.activeId);
              return chart ? (
                <div className="shadow-lg rounded-md cursor-grabbing bg-surface dark:bg-surface-dark">
                  <ChartColors
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
          <div className="card-header flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-header-title">Accent color</h3>
            <div className="flex items-center gap-3 ml-auto">
              {message?.type === 'success' && message?.section === 'accent' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => setResetConfirmSection('accent')}
                disabled={!hasAccentDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!hasAccentDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveAccentSection}
                disabled={!hasAccentChanges || saving || (message?.type === 'success' && message?.section === 'accent')}
                className="btn-ghost-sm min-w-[5.5rem]"
                aria-disabled={!hasAccentChanges || saving}
              >
                Save
              </button>
            </div>
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

      {/* Theme previews */}
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
              <ThemePreviews
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

      <ConfirmModal
        open={resetConfirmSection === 'gauges'}
        onClose={() => setResetConfirmSection(null)}
        title="Reset gauge settings to defaults?"
        description="Gauge ranges, order, and visibility will be reset to default values and saved."
        confirmLabel="Reset"
        onConfirm={resetGaugesToDefaults}
        confirmDisabled={saving}
      />
      <ConfirmModal
        open={resetConfirmSection === 'charts'}
        onClose={() => setResetConfirmSection(null)}
        title="Reset chart settings to defaults?"
        description="Chart order, visibility, and colors will be reset to default values and saved."
        confirmLabel="Reset"
        onConfirm={resetChartsToDefaults}
        confirmDisabled={saving}
      />
      <ConfirmModal
        open={resetConfirmSection === 'accent'}
        onClose={() => setResetConfirmSection(null)}
        title="Reset accent color to default?"
        description="Accent color will be reset to the default and saved."
        confirmLabel="Reset"
        onConfirm={resetAccentToDefaults}
        confirmDisabled={saving}
      />
    </div>
  );
}
