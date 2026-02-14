import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC, TOAST_AUTO_DISMISS_MS } from '@/lib/constants';
import { deepCopy } from '@/lib/utils';

export function useColor(config, refetchConfig, onError) {
  const [accentColor, setAccentColor] = useState(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
  const [chartColors, setChartColors] = useState(() =>
    deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config.accentColor, config.chartColors]);

  const effectiveAccent = normalizeHex(accentColor, DASHBOARD_DEFAULTS.accentColor);
  const configAccent = normalizeHex(config.accentColor ?? '', DASHBOARD_DEFAULTS.accentColor);
  const defaultAccent = normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor);

  const hasChartColorsChange =
    JSON.stringify(chartColors) !== JSON.stringify(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors);

  const hasChanges =
    effectiveAccent !== configAccent || hasChartColorsChange;

  const hasDefaultsDiff =
    effectiveAccent !== defaultAccent ||
    JSON.stringify(chartColors) !== JSON.stringify(DASHBOARD_DEFAULTS.chartColors);

  const changes = useMemo(() => {
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

  const revert = useCallback(() => {
    setAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config]);

  const save = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        const payload = { accentColor: effectiveAccent };
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
        setMessage({ type: 'success', text: 'Colors saved.' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        onError?.(err);
      } finally {
        setSaving(false);
      }
    },
    [effectiveAccent, chartColors, hasChartColorsChange, refetchConfig, onError]
  );

  const resetToDefaults = useCallback(async () => {
    setMessage(null);
    setSaving(true);
    try {
      await patchDashboardConfig({
        accentColor: normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor),
        chartColors: deepCopy(DASHBOARD_DEFAULTS.chartColors),
      });
      await refetchConfig();
      setAccentColor(DASHBOARD_DEFAULTS.accentColor);
      setChartColors(deepCopy(DASHBOARD_DEFAULTS.chartColors));
      setShowResetConfirm(false);
      setMessage({ type: 'success', text: 'Colors reset to default values.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

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
    CHART_COLOR_SPEC,
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
