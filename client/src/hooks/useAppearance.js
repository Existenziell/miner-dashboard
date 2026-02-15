import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC, TOAST_AUTO_DISMISS_MS } from '@/lib/constants';
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

export function useAppearance(config, refetchConfig, onError) {
  const [metricRanges, setMetricRanges] = useState(() => deepCopy(config.metricRanges));
  const [metricOrder, setMetricOrder] = useState(
    () => config.metricOrder ?? defaultMetricOrder()
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
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config.accentColor, config.chartColors]);

  const effectiveAccent = normalizeHex(accentColor, DASHBOARD_DEFAULTS.accentColor);
  const configAccent = normalizeHex(config.accentColor ?? '', DASHBOARD_DEFAULTS.accentColor);
  const defaultAccent = normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor);

  const rangesChanged = JSON.stringify(metricRanges) !== JSON.stringify(config.metricRanges);
  const orderChanged = JSON.stringify(metricOrder) !== JSON.stringify(config.metricOrder ?? defaultMetricOrder());
  const hasChartColorsChange =
    JSON.stringify(chartColors) !== JSON.stringify(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors);
  const dashboardHasChanges = rangesChanged || orderChanged;
  const colorHasChanges = effectiveAccent !== configAccent || hasChartColorsChange;
  const hasChanges = dashboardHasChanges || colorHasChanges;

  const hasDefaultsDiff =
    JSON.stringify(metricRanges) !== JSON.stringify(DASHBOARD_DEFAULTS.metricRanges) ||
    JSON.stringify(metricOrder) !== JSON.stringify(defaultMetricOrder()) ||
    effectiveAccent !== defaultAccent ||
    JSON.stringify(chartColors) !== JSON.stringify(DASHBOARD_DEFAULTS.chartColors);

  const dashboardChanges = useMemo(() => {
    const list = [];
    const saved = config.metricRanges ?? DASHBOARD_DEFAULTS.metricRanges;
    Object.keys(DASHBOARD_DEFAULTS.metricRanges).forEach((metric) => {
      const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
      keys.forEach((key) => {
        const fromVal = saved[metric]?.[key];
        const toVal = metricRanges[metric]?.[key];
        if (fromVal !== toVal && (fromVal !== undefined || toVal !== undefined)) {
          const metricLabel = METRIC_LABELS[metric] ?? metric;
          const keyLabel = METRIC_KEY_LABELS[key] ?? key;
          list.push({
            label: `${metricLabel} → ${keyLabel}`,
            from: fromVal !== undefined ? String(fromVal) : '—',
            to: toVal !== undefined ? String(toVal) : '—',
          });
        }
      });
    });
    return list;
  }, [config.metricRanges, metricRanges]);

  const colorChanges = useMemo(() => {
    const list = [];
    if (effectiveAccent !== configAccent) {
      list.push({ label: 'Accent color', from: configAccent, to: effectiveAccent });
    }
    const saved = config.chartColors ?? DASHBOARD_DEFAULTS.chartColors;
    CHART_COLOR_SPEC.forEach((chart) => {
      chart.series.forEach(({ key, label: seriesLabel }) => {
        const defaultHex = DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
        const fromVal = saved[chart.id]?.[key] ?? defaultHex;
        const toVal = chartColors[chart.id]?.[key] ?? defaultHex;
        const fromHex = normalizeHex(fromVal, defaultHex);
        const toHex = normalizeHex(toVal, defaultHex);
        const toDisplay = isValidHex(toVal) ? toHex : (String(toVal ?? '').trim() || fromHex);
        if (fromHex !== toHex || fromHex !== toDisplay) {
          list.push({
            label: `${chart.label} → ${seriesLabel}`,
            from: fromHex,
            to: toDisplay,
          });
        }
      });
    });
    return list;
  }, [config.chartColors, configAccent, chartColors, effectiveAccent]);

  const changes = useMemo(
    () => [...dashboardChanges, ...colorChanges],
    [dashboardChanges, colorChanges]
  );

  const revert = useCallback(() => {
    setMetricRanges(deepCopy(config.metricRanges));
    setMetricOrder(config.metricOrder ?? defaultMetricOrder());
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config.metricRanges, config.metricOrder, config.accentColor, config.chartColors]);

  const save = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        const payload = {
          metricRanges: deepCopy(metricRanges),
          metricOrder: [...metricOrder],
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
        accentColor: normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor),
        chartColors: deepCopy(DASHBOARD_DEFAULTS.chartColors),
      });
      await refetchConfig();
      setMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setMetricOrder(defaultMetricOrder());
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

  const setChartColorValue = useCallback((chartId, seriesKey, value) => {
    setChartColors((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [seriesKey]: value,
      },
    }));
  }, []);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), TOAST_AUTO_DISMISS_MS);
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
    accentColor,
    setAccentColor,
    chartColors,
    effectiveAccent,
    setChartColorValue,
    changes,
    hasChanges,
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
