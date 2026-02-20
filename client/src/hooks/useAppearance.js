import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { buildPendingChanges } from '@/lib/buildPendingChanges';
import { normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC, MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';
import { deepCopy, sortedStringify } from '@/lib/utils';

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
  const [minerImageVisible, setMinerImageVisible] = useState(
    () => config.minerImageVisible ?? DASHBOARD_DEFAULTS.minerImageVisible
  );
  const [minerImageFile, setMinerImageFile] = useState(
    () => config.minerImageFile ?? DASHBOARD_DEFAULTS.minerImageFile ?? ''
  );
  const [minerImageFilename, setMinerImageFilename] = useState(
    () => config.minerImageFilename ?? DASHBOARD_DEFAULTS.minerImageFilename ?? ''
  );
  const [minerImagePreviewKey, setMinerImagePreviewKey] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(null); // 'gauges' | 'charts' | 'accent' | 'minerImage' | null
  const [message, setMessage] = useState(null);
  const [resetConfirmSection, setResetConfirmSection] = useState(null); // 'gauges' | 'charts' | 'accent' | 'minerImage' | null

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

  useEffect(() => {
    setMinerImageVisible(config.minerImageVisible ?? DASHBOARD_DEFAULTS.minerImageVisible);
    setMinerImageFile(config.minerImageFile ?? DASHBOARD_DEFAULTS.minerImageFile ?? '');
    setMinerImageFilename(config.minerImageFilename ?? DASHBOARD_DEFAULTS.minerImageFilename ?? '');
    setMinerImagePreviewKey(Date.now());
  }, [config.minerImageVisible, config.minerImageFile, config.minerImageFilename]);

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
  const configMinerImageVisible = config.minerImageVisible ?? DASHBOARD_DEFAULTS.minerImageVisible;
  const configMinerImageFile = config.minerImageFile ?? DASHBOARD_DEFAULTS.minerImageFile ?? '';
  const configMinerImageFilename = config.minerImageFilename ?? DASHBOARD_DEFAULTS.minerImageFilename ?? '';
  const minerImageVisibleChanged = minerImageVisible !== configMinerImageVisible;
  const minerImageFileChanged = minerImageFile !== configMinerImageFile;
  const minerImageFilenameChanged = minerImageFilename !== configMinerImageFilename;
  const hasMinerImageChanges = minerImageVisibleChanged || minerImageFileChanged || minerImageFilenameChanged;
  const dashboardHasChanges =
    rangesChanged || orderChanged || gaugeVisibleChanged || chartVisibleChanged || chartOrderChanged;
  const colorHasChanges = effectiveAccent !== configAccent || hasChartColorsChange;
  const hasChanges = dashboardHasChanges || colorHasChanges || hasMinerImageChanges;

  // Section dirty: only ranges/colors/accent/minerImage (order/visibility save immediately)
  const hasGaugeChanges = rangesChanged;
  const hasChartChanges = hasChartColorsChange;
  const hasAccentChanges = effectiveAccent !== configAccent;

  const hasGaugeDefaultsDiff =
    sortedStringify(metricRanges) !== sortedStringify(DASHBOARD_DEFAULTS.metricRanges) ||
    JSON.stringify(metricOrder) !== JSON.stringify(defaultMetricOrder()) ||
    sortedStringify(gaugeVisible) !== sortedStringify(defaultGaugeVisible());
  const hasChartDefaultsDiff =
    JSON.stringify(chartOrder) !== JSON.stringify(defaultChartOrder()) ||
    sortedStringify(chartVisible) !== sortedStringify(defaultChartVisible()) ||
    sortedStringify(chartColors) !== sortedStringify(DASHBOARD_DEFAULTS.chartColors);
  const hasAccentDefaultsDiff = effectiveAccent !== defaultAccent;
  const hasMinerImageDefaultsDiff =
    minerImageVisible !== (DASHBOARD_DEFAULTS.minerImageVisible ?? false) ||
    (minerImageFile || '') !== (DASHBOARD_DEFAULTS.minerImageFile ?? '') ||
    (minerImageFilename || '') !== (DASHBOARD_DEFAULTS.minerImageFilename ?? '');

  const hasDefaultsDiff =
    sortedStringify(metricRanges) !== sortedStringify(DASHBOARD_DEFAULTS.metricRanges) ||
    JSON.stringify(metricOrder) !== JSON.stringify(defaultMetricOrder()) ||
    sortedStringify(gaugeVisible) !== sortedStringify(defaultGaugeVisible()) ||
    sortedStringify(chartVisible) !== sortedStringify(defaultChartVisible()) ||
    JSON.stringify(chartOrder) !== JSON.stringify(defaultChartOrder()) ||
    effectiveAccent !== defaultAccent ||
    sortedStringify(chartColors) !== sortedStringify(DASHBOARD_DEFAULTS.chartColors) ||
    hasMinerImageDefaultsDiff;

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
        minerImageVisible,
        minerImageFile,
        minerImageFilename,
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
      minerImageVisible,
      minerImageFile,
      minerImageFilename,
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
    setMinerImageVisible(config.minerImageVisible ?? DASHBOARD_DEFAULTS.minerImageVisible);
    setMinerImageFile(config.minerImageFile ?? DASHBOARD_DEFAULTS.minerImageFile ?? '');
    setMinerImageFilename(config.minerImageFilename ?? DASHBOARD_DEFAULTS.minerImageFilename ?? '');
  }, [config.metricRanges, config.metricOrder, config.gaugeVisible, config.chartVisible, config.chartOrder, config.accentColor, config.chartColors, config.minerImageVisible, config.minerImageFile, config.minerImageFilename]);

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
        minerImageVisible: DASHBOARD_DEFAULTS.minerImageVisible ?? false,
        minerImageFile: DASHBOARD_DEFAULTS.minerImageFile ?? '',
      });
      await refetchConfig();
      setMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setMetricOrder(defaultMetricOrder());
      setGaugeVisibleState(defaultGaugeVisible());
      setChartVisibleState(defaultChartVisible());
      setChartOrder(defaultChartOrder());
      setAccentColor(DASHBOARD_DEFAULTS.accentColor);
      setChartColors(deepCopy(DASHBOARD_DEFAULTS.chartColors));
      setMinerImageVisible(DASHBOARD_DEFAULTS.minerImageVisible ?? false);
      setMinerImageFile(DASHBOARD_DEFAULTS.minerImageFile ?? '');
      setResetConfirmSection(null);
      setMessage({ type: 'success', text: 'Appearance reset to default values.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

  const saveGaugesSection = useCallback(async () => {
    setSaving(true);
    setSavingSection('gauges');
    try {
      await patchDashboardConfig({ metricRanges: deepCopy(metricRanges) });
      await refetchConfig();
      setMessage({ type: 'success', text: 'Saved', section: 'gauges' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  }, [metricRanges, refetchConfig, onError]);

  const saveChartsSection = useCallback(async () => {
    setSaving(true);
    setSavingSection('charts');
    try {
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
      await patchDashboardConfig({ chartColors: normalized });
      await refetchConfig();
      setMessage({ type: 'success', text: 'Saved', section: 'charts' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  }, [chartColors, refetchConfig, onError]);

  const saveAccentSection = useCallback(async () => {
    setSaving(true);
    setSavingSection('accent');
    try {
      await patchDashboardConfig({ accentColor: effectiveAccent });
      await refetchConfig();
      setMessage({ type: 'success', text: 'Saved', section: 'accent' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  }, [effectiveAccent, refetchConfig, onError]);

  const resetGaugesToDefaults = useCallback(async () => {
    setSaving(true);
    try {
      await patchDashboardConfig({
        metricRanges: deepCopy(DASHBOARD_DEFAULTS.metricRanges),
        metricOrder: [...defaultMetricOrder()],
        gaugeVisible: defaultGaugeVisible(),
      });
      await refetchConfig();
      setMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setMetricOrder(defaultMetricOrder());
      setGaugeVisibleState(defaultGaugeVisible());
      setResetConfirmSection(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

  const resetChartsToDefaults = useCallback(async () => {
    setSaving(true);
    try {
      await patchDashboardConfig({
        chartOrder: [...defaultChartOrder()],
        chartVisible: defaultChartVisible(),
        chartColors: deepCopy(DASHBOARD_DEFAULTS.chartColors),
      });
      await refetchConfig();
      setChartOrder(defaultChartOrder());
      setChartVisibleState(defaultChartVisible());
      setChartColors(deepCopy(DASHBOARD_DEFAULTS.chartColors));
      setResetConfirmSection(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

  const resetAccentToDefaults = useCallback(async () => {
    setSaving(true);
    try {
      await patchDashboardConfig({
        accentColor: normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor),
      });
      await refetchConfig();
      setAccentColor(DASHBOARD_DEFAULTS.accentColor);
      setResetConfirmSection(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, onError]);

  const saveMinerImageSection = useCallback(async (overrides = {}) => {
    setSaving(true);
    setSavingSection('minerImage');
    try {
      const payload = {
        minerImageVisible: overrides.minerImageVisible ?? minerImageVisible,
        minerImageFile: (overrides.minerImageFile !== undefined ? overrides.minerImageFile : minerImageFile) || '',
        minerImageFilename: (overrides.minerImageFilename !== undefined ? overrides.minerImageFilename : minerImageFilename) || '',
      };
      await patchDashboardConfig(payload);
      await refetchConfig();
      setMessage({ type: 'success', text: 'Saved', section: 'minerImage' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  }, [minerImageVisible, minerImageFile, minerImageFilename, refetchConfig, onError]);

  const resetMinerImageToDefaults = useCallback(async () => {
    setSaving(true);
    try {
      await patchDashboardConfig({
        minerImageVisible: DASHBOARD_DEFAULTS.minerImageVisible ?? false,
        minerImageFile: DASHBOARD_DEFAULTS.minerImageFile ?? '',
        minerImageFilename: DASHBOARD_DEFAULTS.minerImageFilename ?? '',
      });
      await refetchConfig();
      setMinerImageVisible(DASHBOARD_DEFAULTS.minerImageVisible ?? false);
      setMinerImageFile(DASHBOARD_DEFAULTS.minerImageFile ?? '');
      setMinerImageFilename(DASHBOARD_DEFAULTS.minerImageFilename ?? '');
      setResetConfirmSection(null);
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
    const order = Array.isArray(newOrder) ? [...newOrder] : newOrder;
    setMetricOrder(order);
    patchDashboardConfig({ metricOrder: order })
      .then(() => refetchConfig())
      .catch((err) => {
        onError?.(err);
      });
  }, [refetchConfig, onError]);

  const setChartOrderList = useCallback((newOrder) => {
    const order = Array.isArray(newOrder) ? [...newOrder] : newOrder;
    setChartOrder(order);
    patchDashboardConfig({ chartOrder: order })
      .then(() => refetchConfig())
      .catch((err) => {
        onError?.(err);
      });
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

  const setGaugeVisible = useCallback((metricId, value) => {
    setGaugeVisibleState((prev) => {
      const next = { ...prev, [metricId]: value };
      patchDashboardConfig({ gaugeVisible: next })
        .then(() => refetchConfig())
        .catch((err) => {
          onError?.(err);
        });
      return next;
    });
  }, [refetchConfig, onError]);

  const setChartVisible = useCallback((chartId, value) => {
    setChartVisibleState((prev) => {
      const next = { ...prev, [chartId]: value };
      patchDashboardConfig({ chartVisible: next })
        .then(() => refetchConfig())
        .catch((err) => {
          onError?.(err);
        });
      return next;
    });
  }, [refetchConfig, onError]);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  return {
    gauges: {
      metricRanges,
      metricOrder,
      setMetricOrder: setMetricOrderList,
      setMetricRangeValue,
      gaugeVisible,
      setGaugeVisible,
      hasGaugeChanges,
      hasGaugeDefaultsDiff,
      saveGaugesSection,
      resetGaugesToDefaults,
    },
    charts: {
      chartVisible,
      setChartVisible,
      chartOrder,
      setChartOrder: setChartOrderList,
      chartColors,
      setChartColorValue,
      effectiveAccent,
      hasChartChanges,
      hasChartDefaultsDiff,
      saveChartsSection,
      resetChartsToDefaults,
    },
    accent: {
      accentColor,
      setAccentColor,
      effectiveAccent,
      hasAccentChanges,
      hasAccentDefaultsDiff,
      saveAccentSection,
      resetAccentToDefaults,
    },
    minerImage: {
      minerImageVisible,
      minerImageFile,
      minerImageFilename,
      minerImagePreviewKey,
      setMinerImageVisible,
      setMinerImageFile,
      setMinerImageFilename,
      hasMinerImageChanges,
      hasMinerImageDefaultsDiff,
      saveMinerImageSection,
      resetMinerImageToDefaults,
    },
    status: {
      changes,
      hasChanges,
      hasGaugeChanges,
      hasChartChanges,
      hasAccentChanges,
      hasGaugeDefaultsDiff,
      hasChartDefaultsDiff,
      hasAccentDefaultsDiff,
      hasDefaultsDiff,
      saving,
      savingSection,
      message,
      setMessage,
      resetConfirmSection,
      setResetConfirmSection,
    },
    actions: {
      revert,
      save,
      resetToDefaults,
    },
  };
}
