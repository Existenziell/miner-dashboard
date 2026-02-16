import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { buildPendingChanges } from '@/lib/buildPendingChanges';
import { normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC, MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';
import { deepCopy } from '@/lib/utils';

export const METRIC_LABELS = {
  hashrate: 'Hashrate (GH/s)',
  efficiency: 'Efficiency (J/TH)',
  temp: 'Temp (°C)',
  fanRpm: 'Fan RPM (%)',
  current: 'Current (A)',
  frequency: 'Frequency (MHz)',
  voltage: 'Voltage (mV)',
  power: 'Power (W)',
};

export const METRIC_KEY_LABELS = {
  min: 'Min',
  max: 'Max',
  gaugeMax: 'Gauge max',
  maxPct: 'Max %',
  maxMv: 'Max (mV)',
};

const defaultMetricOrder = () => DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
const defaultChartOrder = () =>
  DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id);

const defaultGaugeVisible = () => deepCopy(DASHBOARD_DEFAULTS.gaugeVisible);
const defaultChartVisible = () => deepCopy(DASHBOARD_DEFAULTS.chartVisible);

export function useAppearance(config, refetchConfig, onError) {
  const [metricRanges, setMetricRanges] = useState(() => deepCopy(config.metricRanges));
  const [metricOrder, setMetricOrder] = useState(
    () => config.metricOrder ?? defaultMetricOrder()
  );
  const [gaugeVisible, setGaugeVisibleState] = useState(() =>
    deepCopy(config.gaugeVisible ?? defaultGaugeVisible())
  );
  const [chartVisible, setChartVisibleState] = useState(() =>
    deepCopy(config.chartVisible ?? defaultChartVisible())
  );
  const [chartOrder, setChartOrder] = useState(
    () => config.chartOrder ?? defaultChartOrder()
  );
  const [accentColor, setAccentColor] = useState(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
  const [chartColors, setChartColors] = useState(() =>
    deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMetricRanges(deepCopy(config.metricRanges));
  }, [config.metricRanges]);

  useEffect(() => {
    setMetricOrder(config.metricOrder ?? defaultMetricOrder());
  }, [config.metricOrder]);

  useEffect(() => {
    setGaugeVisibleState(deepCopy(config.gaugeVisible ?? defaultGaugeVisible()));
  }, [config.gaugeVisible]);

  useEffect(() => {
    setChartVisibleState(deepCopy(config.chartVisible ?? defaultChartVisible()));
  }, [config.chartVisible]);

  useEffect(() => {
    setChartOrder(config.chartOrder ?? defaultChartOrder());
  }, [config.chartOrder]);

  useEffect(() => {
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config.accentColor, config.chartColors]);

  const effectiveAccent = normalizeHex(accentColor, DASHBOARD_DEFAULTS.accentColor);
  const configAccent = normalizeHex(config.accentColor ?? '', DASHBOARD_DEFAULTS.accentColor);
  const defaultAccent = normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor);

  const rangesChanged = JSON.stringify(metricRanges) !== JSON.stringify(config.metricRanges);
  const orderChanged = JSON.stringify(metricOrder) !== JSON.stringify(config.metricOrder ?? defaultMetricOrder());
  const gaugeVisibleChanged =
    JSON.stringify(gaugeVisible) !== JSON.stringify(config.gaugeVisible ?? defaultGaugeVisible());
  const chartVisibleChanged =
    JSON.stringify(chartVisible) !== JSON.stringify(config.chartVisible ?? defaultChartVisible());
  const chartOrderChanged =
    JSON.stringify(chartOrder) !== JSON.stringify(config.chartOrder ?? defaultChartOrder());
  const hasChartColorsChange =
    JSON.stringify(chartColors) !== JSON.stringify(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors);
  const dashboardHasChanges =
    rangesChanged || orderChanged || gaugeVisibleChanged || chartVisibleChanged || chartOrderChanged;
  const colorHasChanges = effectiveAccent !== configAccent || hasChartColorsChange;
  const hasChanges = dashboardHasChanges || colorHasChanges;

  const hasGaugeChanges = rangesChanged || orderChanged || gaugeVisibleChanged;
  const hasChartChanges = chartVisibleChanged || chartOrderChanged || hasChartColorsChange;
  const hasAccentChanges = effectiveAccent !== configAccent;

  const hasDefaultsDiff =
    JSON.stringify(metricRanges) !== JSON.stringify(DASHBOARD_DEFAULTS.metricRanges) ||
    JSON.stringify(metricOrder) !== JSON.stringify(defaultMetricOrder()) ||
    JSON.stringify(gaugeVisible) !== JSON.stringify(defaultGaugeVisible()) ||
    JSON.stringify(chartVisible) !== JSON.stringify(defaultChartVisible()) ||
    JSON.stringify(chartOrder) !== JSON.stringify(defaultChartOrder()) ||
    effectiveAccent !== defaultAccent ||
    JSON.stringify(chartColors) !== JSON.stringify(DASHBOARD_DEFAULTS.chartColors);

  const changes = useMemo(
    () =>
      buildPendingChanges(config, {
        metricRanges,
        metricOrder,
        chartOrder,
        gaugeVisible,
        chartVisible,
        chartColors,
        effectiveAccent,
      }),
    [
      config,
      metricRanges,
      metricOrder,
      chartOrder,
      gaugeVisible,
      chartVisible,
      chartColors,
      effectiveAccent,
    ]
  );

  const revert = useCallback(() => {
    setMetricRanges(deepCopy(config.metricRanges));
    setMetricOrder(config.metricOrder ?? defaultMetricOrder());
    setGaugeVisibleState(deepCopy(config.gaugeVisible ?? defaultGaugeVisible()));
    setChartVisibleState(deepCopy(config.chartVisible ?? defaultChartVisible()));
    setChartOrder(config.chartOrder ?? defaultChartOrder());
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config.metricRanges, config.metricOrder, config.gaugeVisible, config.chartVisible, config.chartOrder, config.accentColor, config.chartColors]);

  const save = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        const payload = {
          metricRanges: deepCopy(metricRanges),
          metricOrder: [...metricOrder],
          gaugeVisible: deepCopy(gaugeVisible),
          chartVisible: deepCopy(chartVisible),
          chartOrder: [...chartOrder],
          accentColor: effectiveAccent,
        };
        if (hasChartColorsChange) {
          const normalized = deepCopy(DASHBOARD_DEFAULTS.chartColors);
          CHART_COLOR_SPEC.forEach(({ id }) => {
            const fromForm = chartColors[id];
            if (fromForm) {
              Object.keys(normalized[id]).forEach((k) => {
                const v = fromForm[k];
                normalized[id][k] =
                  v && String(v).trim()
                    ? normalizeHex(v, DASHBOARD_DEFAULTS.chartColors[id][k])
                    : DASHBOARD_DEFAULTS.chartColors[id][k];
              });
            }
          });
          payload.chartColors = normalized;
        }
        await patchDashboardConfig(payload);
        await refetchConfig();
        setMessage({ type: 'success', text: 'Appearance saved.' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        onError?.(err);
      } finally {
        setSaving(false);
      }
    },
    [
      metricRanges,
      metricOrder,
      gaugeVisible,
      chartVisible,
      chartOrder,
      effectiveAccent,
      chartColors,
      hasChartColorsChange,
      refetchConfig,
      onError,
    ]
  );

  const resetToDefaults = useCallback(async () => {
    setMessage(null);
    setSaving(true);
    try {
      await patchDashboardConfig({
        metricRanges: deepCopy(DASHBOARD_DEFAULTS.metricRanges),
        metricOrder: [...defaultMetricOrder()],
        gaugeVisible: defaultGaugeVisible(),
        chartVisible: defaultChartVisible(),
        chartOrder: [...defaultChartOrder()],
        accentColor: normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor),
        chartColors: deepCopy(DASHBOARD_DEFAULTS.chartColors),
      });
      await refetchConfig();
      setMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setMetricOrder(defaultMetricOrder());
      setGaugeVisibleState(defaultGaugeVisible());
      setChartVisibleState(defaultChartVisible());
      setChartOrder(defaultChartOrder());
      setAccentColor(DASHBOARD_DEFAULTS.accentColor);
      setChartColors(deepCopy(DASHBOARD_DEFAULTS.chartColors));
      setShowResetConfirm(false);
      setMessage({ type: 'success', text: 'Appearance reset to default values.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

  const setMetricRangeValue = useCallback((metric, key, value) => {
    setMetricRanges((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [key]: value,
      },
    }));
  }, []);

  const setMetricOrderList = useCallback((newOrder) => {
    setMetricOrder(Array.isArray(newOrder) ? [...newOrder] : newOrder);
  }, []);

  const setChartOrderList = useCallback((newOrder) => {
    setChartOrder(Array.isArray(newOrder) ? [...newOrder] : newOrder);
  }, []);

  const setChartColorValue = useCallback((chartId, seriesKey, value) => {
    setChartColors((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [seriesKey]: value,
      },
    }));
  }, []);

  const setGaugeVisible = useCallback((metricId, value) => {
    setGaugeVisibleState((prev) => ({ ...prev, [metricId]: value }));
  }, []);

  const setChartVisible = useCallback((chartId, value) => {
    setChartVisibleState((prev) => ({ ...prev, [chartId]: value }));
  }, []);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  return {
    METRIC_LABELS,
    METRIC_KEY_LABELS,
    CHART_COLOR_SPEC,
    metricRanges,
    metricOrder,
    setMetricOrder: setMetricOrderList,
    setMetricRangeValue,
    gaugeVisible,
    setGaugeVisible,
    chartVisible,
    setChartVisible,
    chartOrder,
    setChartOrder: setChartOrderList,
    accentColor,
    setAccentColor,
    chartColors,
    effectiveAccent,
    setChartColorValue,
    changes,
    hasChanges,
    hasGaugeChanges,
    hasChartChanges,
    hasAccentChanges,
    hasDefaultsDiff,
    revert,
    save,
    saving,
    message,
    setMessage,
    showResetConfirm,
    setShowResetConfirm,
    resetToDefaults,
  };
}
