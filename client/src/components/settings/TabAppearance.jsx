import { useCallback } from 'react';
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
import { useConfig } from '@/context/ConfigContext';
import { useTheme } from '@/context/ThemeContext';
import { THEME_MODES } from '@/context/ThemeContext';
import { useOrderDnd } from '@/hooks/useOrderDnd';
import { uploadMinerImage } from '@/lib/api';
import { requestBlockFoundPreview } from '@/lib/blockFoundPreview';
import { CHART_COLOR_SPEC, METRIC_LABELS, METRIC_KEY_LABELS } from '@/lib/constants';
import { ConfirmModal } from '@/components/ConfirmModal';
import { IconCheckmark } from '@/components/Icons';
import { ChartColors } from '@/components/settings/ChartColors';
import { Field } from '@/components/settings/Field';
import { MetricRanges } from '@/components/settings/MetricRanges';
import { ThemePreviews } from '@/components/settings/ThemePreviews';

export function TabAppearance() {
  const { mode, setMode } = useTheme();
  const { refetch: refetchConfig } = useConfig();
  const { gauges, charts, accent, minerImage, status } = useAppearanceContext();

  const order = gauges.metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
  const metricDnd = useOrderDnd(order, gauges.setMetricOrder);

  const chartOrderList = charts.chartOrder ?? DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id);
  const chartDnd = useOrderDnd(chartOrderList, charts.setChartOrder);

  const themePreviewConfig = (themeId) => {
    if (themeId === 'light') return { previewClassName: 'theme-preview-light', useDarkVariant: false };
    if (themeId === 'dark') return { previewClassName: 'theme-preview-dark', useDarkVariant: true };
    if (themeId === 'light-high-contrast') return { previewClassName: 'theme-preview-light-hc', useDarkVariant: false };
    if (themeId === 'dark-high-contrast') return { previewClassName: 'theme-preview-dark-hc', useDarkVariant: true };
    return { previewClassName: 'theme-preview-light', useDarkVariant: false };
  };

  const handleMinerImageFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      status.setMessage?.(null);
      try {
        await uploadMinerImage(file, file.name);
        await refetchConfig();
        status.setMessage?.({ type: 'success', text: 'Saved', section: 'minerImage' });
      } catch (err) {
        status.setMessage?.({ type: 'error', text: err.message });
      }
    },
    [status, refetchConfig]
  );

  const minerImageInfoText = (minerImage.minerImageFile && minerImage.minerImageFilename) ? minerImage.minerImageFilename.trim() : null;

  return (
    <div className="space-y-4">
      {status.message?.type === 'error' && status.message?.text && (
        <div role="alert" className="message-warning">
          {status.message.text}
        </div>
      )}
      {/* Metric ranges */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-header-title">Gauges</h3>
            <div className="flex items-center gap-3 ml-auto">
              {status.message?.type === 'success' && status.message?.section === 'gauges' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => status.setResetConfirmSection('gauges')}
                disabled={!gauges.hasGaugeDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!gauges.hasGaugeDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={gauges.saveGaugesSection}
                disabled={!gauges.hasGaugeChanges || status.saving || (status.message?.type === 'success' && status.message?.section === 'gauges')}
                className="btn-ghost-sm"
                aria-disabled={!gauges.hasGaugeChanges || status.saving}
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
                      metricRanges={gauges.metricRanges}
                      setMetricRangeValue={gauges.setMetricRangeValue}
                      METRIC_LABELS={METRIC_LABELS}
                      METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                      isDragActive={metricDnd.activeId != null}
                      visibleOnDashboard={gauges.gaugeVisible[metric] !== false}
                      onToggleVisible={gauges.setGaugeVisible}
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
                    metricRanges={gauges.metricRanges}
                    setMetricRangeValue={gauges.setMetricRangeValue}
                    METRIC_LABELS={METRIC_LABELS}
                    METRIC_KEY_LABELS={METRIC_KEY_LABELS}
                    visibleOnDashboard={gauges.gaugeVisible[metricDnd.activeId] !== false}
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
              {status.message?.type === 'success' && status.message?.section === 'charts' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => status.setResetConfirmSection('charts')}
                disabled={!charts.hasChartDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!charts.hasChartDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={charts.saveChartsSection}
                disabled={!charts.hasChartChanges || status.saving || (status.message?.type === 'success' && status.message?.section === 'charts')}
                className="btn-ghost-sm"
                aria-disabled={!charts.hasChartChanges || status.saving}
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
                      chartColors={charts.chartColors}
                      chartVisible={charts.chartVisible}
                      setChartColorValue={charts.setChartColorValue}
                      setChartVisible={charts.setChartVisible}
                      isDragActive={chartDnd.activeId != null}
                      onToggleVisible={charts.setChartVisible}
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
                    chartColors={charts.chartColors}
                    chartVisible={charts.chartVisible}
                    setChartColorValue={charts.setChartColorValue}
                    setChartVisible={charts.setChartVisible}
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
            <h3 className="card-header-title">Accent Color</h3>
            <div className="flex items-center gap-3 ml-auto">
              {status.message?.type === 'success' && status.message?.section === 'accent' && (
                <span role="status" className="message-success text-sm">
                  Saved successfully
                </span>
              )}
              <button
                type="button"
                onClick={() => status.setResetConfirmSection('accent')}
                disabled={!accent.hasAccentDefaultsDiff}
                className="text-link text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!accent.hasAccentDefaultsDiff}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={accent.saveAccentSection}
                disabled={!accent.hasAccentChanges || status.saving || (status.message?.type === 'success' && status.message?.section === 'accent')}
                className="btn-ghost-sm"
                aria-disabled={!accent.hasAccentChanges || status.saving}
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
          <Field label="Accent color" hint="Click to select a color or enter a hex value.">
            <div className="flex items-center gap-2 max-w-96">
              <input
                type="color"
                value={accent.effectiveAccent}
                onChange={(e) => accent.setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border border-default cursor-pointer bg-transparent"
                aria-label="Accent color picker"
              />
              <input
                type="text"
                value={accent.accentColor}
                onChange={(e) => accent.setAccentColor(e.target.value)}
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

      {/* Miner image */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-header-title">Miner Image</h3>
            {status.message?.type === 'success' && status.message?.section === 'minerImage' && (
              <span role="status" className="message-success text-sm">
                Saved
              </span>
            )}
          </div>
        </div>
        <p className="card-subtitle">
          Upload an image of your miner to show on the dashboard.
        </p>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col gap-6">
              <label
                htmlFor="miner-image-file"
                className="input max-w-xs cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-edge dark:border-edge-dark rounded-md bg-surface dark:bg-surface-dark hover:bg-surface-light dark:hover:bg-surface-light-dark text-sm font-medium text-normal transition-colors"
              >
                Choose image
              </label>
              <input
                id="miner-image-file"
                type="file"
                accept="image/*"
                onChange={handleMinerImageFileChange}
                className="sr-only"
                aria-label="Choose miner image file"
              />
              <Field label="Show on dashboard" hint="When enabled, the image appears in the Miner Status section on the dashboard.">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={minerImage.minerImageVisible}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      minerImage.setMinerImageVisible(checked);
                      minerImage.saveMinerImageSection({ minerImageVisible: checked });
                    }}
                    className="checkbox-input"
                    aria-describedby="miner-image-visibility-desc"
                  />
                  <span className="checkbox-box" aria-hidden>
                    <IconCheckmark className="checkbox-check" />
                  </span>
                  <span id="miner-image-visibility-desc" className="text-sm">Show image on dashboard</span>
                </label>
              </Field>
            </div>
              {(minerImage.minerImageFile || '').length > 0 && (
                <div className="flex flex-row gap-2">
                  <img
                    key={minerImage.minerImageFile}
                    src={`/api/config/miner-image?v=${minerImage.minerImagePreviewKey}`}
                    alt="Miner preview"
                    className="h-auto max-h-32 max-w-[200px] rounded object-contain"
                  />
                  <div>
                  {minerImageInfoText && (
                    <p className="text-xs text-muted max-w-[200px] truncate" title={minerImageInfoText}>
                      {minerImageInfoText}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      minerImage.setMinerImageFile('');
                      minerImage.setMinerImageFilename('');
                      minerImage.saveMinerImageSection({ minerImageFile: '', minerImageFilename: '' });
                    }}
                    className="text-link text-sm"
                  >
                    Remove image
                  </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Block found preview */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header flex flex-wrap items-center justify-between gap-2">
          <h3 className="card-header-title">Block Found Preview</h3>
          </div>
        </div>
        <p className="card-subtitle">
          In the hopefully not too distant future, when your miner finds a block, a full-screen congratulations overlay is shown. You can preview it here.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={requestBlockFoundPreview}
            className="btn-primary"
          >
            Preview overlay
          </button>
        </div>
      </div>

      <ConfirmModal
        open={status.resetConfirmSection === 'gauges'}
        onClose={() => status.setResetConfirmSection(null)}
        title="Reset gauge settings to defaults?"
        description="Gauge ranges, order, and visibility will be reset to default values and saved."
        confirmLabel="Reset"
        onConfirm={gauges.resetGaugesToDefaults}
        confirmDisabled={status.saving}
      />
      <ConfirmModal
        open={status.resetConfirmSection === 'charts'}
        onClose={() => status.setResetConfirmSection(null)}
        title="Reset chart settings to defaults?"
        description="Chart order, visibility, and colors will be reset to default values and saved."
        confirmLabel="Reset"
        onConfirm={charts.resetChartsToDefaults}
        confirmDisabled={status.saving}
      />
      <ConfirmModal
        open={status.resetConfirmSection === 'accent'}
        onClose={() => status.setResetConfirmSection(null)}
        title="Reset accent color to default?"
        description="Accent color will be reset to the default and saved."
        confirmLabel="Reset"
        onConfirm={accent.resetAccentToDefaults}
        confirmDisabled={status.saving}
      />
    </div>
  );
}
