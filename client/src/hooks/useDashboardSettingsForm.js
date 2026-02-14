import { useCallback,useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC, TOAST_AUTO_DISMISS_MS } from '@/lib/constants';

const METRIC_LABELS = {
  hashrate: 'Hashrate',
  efficiency: 'Efficiency',
  temp: 'Temp',
  fanRpm: 'Fan RPM',
  current: 'Current',
  frequency: 'Frequency',
  voltage: 'Voltage',
  power: 'Power',
};

const METRIC_KEY_LABELS = {
  min: 'Min',
  max: 'Max',
  gaugeMax: 'Gauge max',
  maxPct: 'Max %',
  maxMv: 'Max (mV)',
};

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function useDashboardSettingsForm(config, refetchConfig, onError) {
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);
  const [colorsMessage, setColorsMessage] = useState(null);
  const [showResetConfigConfirm, setShowResetConfigConfirm] = useState(false);
  const [showResetColorsConfirm, setShowResetColorsConfirm] = useState(false);

  const [dashboardMinerIp, setDashboardMinerIp] = useState(config.minerIp);
  const [dashboardExpectedHashrate, setDashboardExpectedHashrate] = useState(config.defaultExpectedHashrateGh);
  const [dashboardPollMiner, setDashboardPollMiner] = useState(config.pollMinerIntervalMs);
  const [dashboardPollNetwork, setDashboardPollNetwork] = useState(config.pollNetworkIntervalMs);
  const [dashboardMetricRanges, setDashboardMetricRanges] = useState(() => deepCopy(config.metricRanges));
  const [dashboardAccentColor, setDashboardAccentColor] = useState(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
  const [dashboardChartColors, setDashboardChartColors] = useState(() =>
    deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors)
  );

  useEffect(() => {
    setDashboardMinerIp(config.minerIp);
    setDashboardExpectedHashrate(config.defaultExpectedHashrateGh);
    setDashboardPollMiner(config.pollMinerIntervalMs);
    setDashboardPollNetwork(config.pollNetworkIntervalMs);
    setDashboardMetricRanges(deepCopy(config.metricRanges));
    setDashboardAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setDashboardChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config]);

  const hasMetricRangesChange =
    JSON.stringify(dashboardMetricRanges) !== JSON.stringify(config.metricRanges);
  const hasChartColorsChange =
    JSON.stringify(dashboardChartColors) !== JSON.stringify(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors);

  const effectiveAccent = normalizeHex(dashboardAccentColor, DASHBOARD_DEFAULTS.accentColor);
  const configAccent = normalizeHex(config.accentColor ?? '', DASHBOARD_DEFAULTS.accentColor);

  const hasConfigChanges =
    dashboardMinerIp !== config.minerIp ||
    dashboardExpectedHashrate !== config.defaultExpectedHashrateGh ||
    dashboardPollMiner !== config.pollMinerIntervalMs ||
    dashboardPollNetwork !== config.pollNetworkIntervalMs ||
    hasMetricRangesChange;

  const hasColorsChanges =
    effectiveAccent !== configAccent || hasChartColorsChange;

  const defaultAccent = normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor);
  const hasConfigDefaultsDiff =
    dashboardExpectedHashrate !== DASHBOARD_DEFAULTS.defaultExpectedHashrateGh ||
    dashboardPollMiner !== DASHBOARD_DEFAULTS.pollMinerIntervalMs ||
    dashboardPollNetwork !== DASHBOARD_DEFAULTS.pollNetworkIntervalMs ||
    JSON.stringify(dashboardMetricRanges) !== JSON.stringify(DASHBOARD_DEFAULTS.metricRanges);

  const hasColorsDefaultsDiff =
    effectiveAccent !== defaultAccent ||
    JSON.stringify(dashboardChartColors) !== JSON.stringify(DASHBOARD_DEFAULTS.chartColors);

  const configChanges = useMemo(() => {
    const list = [];
    if (dashboardMinerIp !== config.minerIp) {
      list.push({ label: 'Miner IP', from: config.minerIp || '—', to: dashboardMinerIp.trim() || '—' });
    }
    if (dashboardExpectedHashrate !== config.defaultExpectedHashrateGh) {
      list.push({ label: 'Expected hashrate', from: `${config.defaultExpectedHashrateGh} GH/s`, to: `${dashboardExpectedHashrate} GH/s` });
    }
    if (dashboardPollMiner !== config.pollMinerIntervalMs) {
      list.push({ label: 'Miner poll interval', from: `${config.pollMinerIntervalMs} ms`, to: `${dashboardPollMiner} ms` });
    }
    if (dashboardPollNetwork !== config.pollNetworkIntervalMs) {
      list.push({ label: 'Network poll interval', from: `${config.pollNetworkIntervalMs} ms`, to: `${dashboardPollNetwork} ms` });
    }
    if (hasMetricRangesChange) {
      const saved = config.metricRanges ?? DASHBOARD_DEFAULTS.metricRanges;
      Object.keys(DASHBOARD_DEFAULTS.metricRanges).forEach((metric) => {
        const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
        keys.forEach((key) => {
          const fromVal = saved[metric]?.[key];
          const toVal = dashboardMetricRanges[metric]?.[key];
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
    }
    return list;
  }, [config.minerIp, config.defaultExpectedHashrateGh, config.pollMinerIntervalMs, config.pollNetworkIntervalMs, config.metricRanges, dashboardMinerIp, dashboardExpectedHashrate, dashboardPollMiner, dashboardPollNetwork, dashboardMetricRanges, hasMetricRangesChange]);

  const colorsChanges = useMemo(() => {
    const list = [];
    if (effectiveAccent !== configAccent) {
      list.push({ label: 'Accent color', from: configAccent, to: effectiveAccent });
    }
    if (hasChartColorsChange) {
      const saved = config.chartColors ?? DASHBOARD_DEFAULTS.chartColors;
      CHART_COLOR_SPEC.forEach((chart) => {
        chart.series.forEach(({ key, label: seriesLabel }) => {
          const fromVal = saved[chart.id]?.[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
          const toVal = dashboardChartColors[chart.id]?.[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
          const fromHex = normalizeHex(fromVal, DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key]);
          const toHex = normalizeHex(toVal, DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key]);
          if (fromHex !== toHex) {
            list.push({ label: `${chart.label} → ${seriesLabel}`, from: fromHex, to: toHex });
          }
        });
      });
    }
    return list;
  }, [config.chartColors, configAccent, dashboardChartColors, effectiveAccent, hasChartColorsChange]);

  const handleRevertConfig = useCallback(() => {
    setDashboardMinerIp(config.minerIp);
    setDashboardExpectedHashrate(config.defaultExpectedHashrateGh);
    setDashboardPollMiner(config.pollMinerIntervalMs);
    setDashboardPollNetwork(config.pollNetworkIntervalMs);
    setDashboardMetricRanges(deepCopy(config.metricRanges));
  }, [config]);

  const handleRevertColors = useCallback(() => {
    setDashboardAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setDashboardChartColors(deepCopy(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors));
  }, [config]);

  /** Save only dashboard config (miner IP, hashrate, poll intervals, metric ranges). Does not send accentColor or chartColors. */
  const handleSaveConfig = useCallback(async (e) => {
    e.preventDefault();
    setConfigMessage(null);
    setSavingConfig(true);
    try {
      const payload = {
        minerIp: dashboardMinerIp.trim(),
        defaultExpectedHashrateGh: Number(dashboardExpectedHashrate),
        pollMinerIntervalMs: Number(dashboardPollMiner),
        pollNetworkIntervalMs: Number(dashboardPollNetwork),
      };
      if (hasMetricRangesChange) payload.metricRanges = deepCopy(dashboardMetricRanges);
      await patchDashboardConfig(payload);
      await refetchConfig();
      setConfigMessage({ type: 'success', text: 'Dashboard config saved.' });
    } catch (err) {
      setConfigMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSavingConfig(false);
    }
  }, [dashboardMinerIp, dashboardExpectedHashrate, dashboardPollMiner, dashboardPollNetwork, dashboardMetricRanges, hasMetricRangesChange, refetchConfig, onError]);

  /** Save only colors (accent + chart colors). Does not send miner IP, poll intervals, or metric ranges. */
  const handleSaveColors = useCallback(async (e) => {
    e.preventDefault();
    setColorsMessage(null);
    setSavingColors(true);
    try {
      const payload = {
        accentColor: effectiveAccent,
      };
      if (hasChartColorsChange) {
        const normalized = deepCopy(DASHBOARD_DEFAULTS.chartColors);
        CHART_COLOR_SPEC.forEach(({ id }) => {
          const fromForm = dashboardChartColors[id];
          if (fromForm) {
            Object.keys(normalized[id]).forEach((k) => {
              const v = fromForm[k];
              normalized[id][k] = (v && String(v).trim()) ? normalizeHex(v, DASHBOARD_DEFAULTS.chartColors[id][k]) : DASHBOARD_DEFAULTS.chartColors[id][k];
            });
          }
        });
        payload.chartColors = normalized;
      }
      await patchDashboardConfig(payload);
      await refetchConfig();
      setColorsMessage({ type: 'success', text: 'Colors saved.' });
    } catch (err) {
      setColorsMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSavingColors(false);
    }
  }, [effectiveAccent, dashboardChartColors, hasChartColorsChange, refetchConfig, onError]);

  const handleResetConfigToDefaults = useCallback(async () => {
    setConfigMessage(null);
    setSavingConfig(true);
    try {
      const payload = {
        minerIp: dashboardMinerIp.trim(),
        defaultExpectedHashrateGh: Number(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh),
        pollMinerIntervalMs: Number(DASHBOARD_DEFAULTS.pollMinerIntervalMs),
        pollNetworkIntervalMs: Number(DASHBOARD_DEFAULTS.pollNetworkIntervalMs),
        metricRanges: deepCopy(DASHBOARD_DEFAULTS.metricRanges),
      };
      await patchDashboardConfig(payload);
      await refetchConfig();
      setDashboardExpectedHashrate(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh);
      setDashboardPollMiner(DASHBOARD_DEFAULTS.pollMinerIntervalMs);
      setDashboardPollNetwork(DASHBOARD_DEFAULTS.pollNetworkIntervalMs);
      setDashboardMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setShowResetConfigConfirm(false);
      setConfigMessage({ type: 'success', text: 'Dashboard config reset to defaults and saved.' });
    } catch (err) {
      setConfigMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSavingConfig(false);
    }
  }, [dashboardMinerIp, refetchConfig, onError]);

  const handleResetColorsToDefaults = useCallback(async () => {
    setColorsMessage(null);
    setSavingColors(true);
    try {
      const payload = {
        accentColor: normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor),
        chartColors: deepCopy(DASHBOARD_DEFAULTS.chartColors),
      };
      await patchDashboardConfig(payload);
      await refetchConfig();
      setDashboardAccentColor(DASHBOARD_DEFAULTS.accentColor);
      setDashboardChartColors(deepCopy(DASHBOARD_DEFAULTS.chartColors));
      setShowResetColorsConfirm(false);
      setColorsMessage({ type: 'success', text: 'Colors reset to defaults and saved.' });
    } catch (err) {
      setColorsMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSavingColors(false);
    }
  }, [refetchConfig, onError]);

  useEffect(() => {
    if (configMessage?.type !== 'success') return;
    const t = setTimeout(() => setConfigMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [configMessage?.type]);

  useEffect(() => {
    if (colorsMessage?.type !== 'success') return;
    const t = setTimeout(() => setColorsMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [colorsMessage?.type]);

  const setChartColorValue = useCallback((chartId, seriesKey, value) => {
    setDashboardChartColors((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [seriesKey]: value,
      },
    }));
  }, []);

  const setMetricRangeValue = useCallback((metric, key, value) => {
    setDashboardMetricRanges((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [key]: value,
      },
    }));
  }, []);

  return {
    METRIC_LABELS,
    METRIC_KEY_LABELS,
    CHART_COLOR_SPEC,
    dashboardMinerIp,
    setDashboardMinerIp,
    dashboardExpectedHashrate,
    setDashboardExpectedHashrate,
    dashboardPollMiner,
    setDashboardPollMiner,
    dashboardPollNetwork,
    setDashboardPollNetwork,
    dashboardMetricRanges,
    dashboardAccentColor,
    setDashboardAccentColor,
    dashboardChartColors,
    effectiveAccent,
    setChartColorValue,
    setMetricRangeValue,
    hasConfigChanges,
    configChanges,
    handleRevertConfig,
    handleSaveConfig,
    savingConfig,
    configMessage,
    setConfigMessage,
    hasConfigDefaultsDiff,
    showResetConfigConfirm,
    setShowResetConfigConfirm,
    handleResetConfigToDefaults,
    hasColorsChanges,
    colorsChanges,
    handleRevertColors,
    handleSaveColors,
    savingColors,
    colorsMessage,
    setColorsMessage,
    hasColorsDefaultsDiff,
    showResetColorsConfirm,
    setShowResetColorsConfirm,
    handleResetColorsToDefaults,
  };
}
