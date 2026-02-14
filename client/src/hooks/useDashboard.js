import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { TOAST_AUTO_DISMISS_MS } from '@/lib/constants';
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

export function useDashboard(config, refetchConfig, onError) {
  const [metricRanges, setMetricRanges] = useState(() => deepCopy(config.metricRanges));
  const [metricOrder, setMetricOrder] = useState(
    () => config.metricOrder ?? defaultMetricOrder()
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

  const rangesChanged = JSON.stringify(metricRanges) !== JSON.stringify(config.metricRanges);
  const orderChanged = JSON.stringify(metricOrder) !== JSON.stringify(config.metricOrder ?? defaultMetricOrder());
  const hasChanges = rangesChanged || orderChanged;

  const hasDefaultsDiff =
    JSON.stringify(metricRanges) !== JSON.stringify(DASHBOARD_DEFAULTS.metricRanges) ||
    JSON.stringify(metricOrder) !== JSON.stringify(defaultMetricOrder());

  const changes = useMemo(() => {
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

  const revert = useCallback(() => {
    setMetricRanges(deepCopy(config.metricRanges));
    setMetricOrder(config.metricOrder ?? defaultMetricOrder());
  }, [config.metricRanges, config.metricOrder]);

  const save = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        await patchDashboardConfig({
          metricRanges: deepCopy(metricRanges),
          metricOrder: [...metricOrder],
        });
        await refetchConfig();
        setMessage({ type: 'success', text: 'Metric ranges saved.' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        onError?.(err);
      } finally {
        setSaving(false);
      }
    },
    [metricRanges, metricOrder, refetchConfig, onError]
  );

  const resetToDefaults = useCallback(async () => {
    setMessage(null);
    setSaving(true);
    try {
      await patchDashboardConfig({
        metricRanges: deepCopy(DASHBOARD_DEFAULTS.metricRanges),
        metricOrder: [...defaultMetricOrder()],
      });
      await refetchConfig();
      setMetricRanges(deepCopy(DASHBOARD_DEFAULTS.metricRanges));
      setMetricOrder(defaultMetricOrder());
      setShowResetConfirm(false);
      setMessage({ type: 'success', text: 'Metric ranges reset to default values.' });
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

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  return {
    METRIC_LABELS,
    METRIC_KEY_LABELS,
    metricRanges,
    metricOrder,
    setMetricOrder: setMetricOrderList,
    setMetricRangeValue,
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
