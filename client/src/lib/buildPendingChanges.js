/**
 * Helpers for building "Pending changes" entries.
 */
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';
import { CHART_COLOR_SPEC } from '@/lib/constants';

/**
 * Build a single change entry for the list. Use for consistent from/to formatting.
 */
export function changeEntry(label, from, to) {
  return {
    label,
    from: from !== undefined && from !== null ? String(from) : '—',
    to: to !== undefined && to !== null ? String(to) : '—',
  };
}

/**
 * Entry for a "something changed" line (e.g. order) without showing full from/to values.
 */
export function simpleChange(label) {
  return changeEntry(label, 'saved', 'changed');
}

const METRIC_LABELS = {
  hashrate: 'Hashrate (GH/s)',
  efficiency: 'Efficiency (J/TH)',
  temp: 'Temp (°C)',
  fanRpm: 'Fan RPM (%)',
  current: 'Current (A)',
  frequency: 'Frequency (MHz)',
  voltage: 'Voltage (mV)',
  power: 'Power (W)',
};
const METRIC_KEY_LABELS = {
  min: 'Min',
  max: 'Max',
  gaugeMax: 'Gauge max',
  maxPct: 'Max %',
  maxMv: 'Max (mV)',
};

const defaultMetricOrder = () =>
  DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges);
const defaultChartOrder = () =>
  DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id);
const defaultGaugeVisible = () => ({ ...DASHBOARD_DEFAULTS.gaugeVisible });
const defaultChartVisible = () => ({ ...DASHBOARD_DEFAULTS.chartVisible });

/**
 * Builds the pending changes list for the Appearance settings form.
 * Pure function: given server config and current form state, returns change entries.
 *
 * @param {object} config - Current dashboard config (from server)
 * @param {object} state - Current form state
 * @param {object} state.metricRanges
 * @param {string[]} state.metricOrder
 * @param {string[]} state.chartOrder
 * @param {object} state.gaugeVisible
 * @param {object} state.chartVisible
 * @param {object} state.chartColors
 * @param {string} state.effectiveAccent
 * @returns {{ label: string, from: string, to: string }[]}
 */
export function buildPendingChanges(config, state) {
  const {
    metricRanges,
    metricOrder,
    chartOrder,
    gaugeVisible,
    chartVisible,
    chartColors,
    effectiveAccent,
  } = state;

  const configAccent = normalizeHex(
    config.accentColor ?? '',
    DASHBOARD_DEFAULTS.accentColor
  );
  const savedMetricOrder = config.metricOrder ?? defaultMetricOrder();
  const savedChartOrder = config.chartOrder ?? defaultChartOrder();
  const savedGaugeVisible = config.gaugeVisible ?? defaultGaugeVisible();
  const savedChartVisible = config.chartVisible ?? defaultChartVisible();

  const list = [];

  // Metric ranges (gauge min/max etc.)
  const savedRanges = config.metricRanges ?? DASHBOARD_DEFAULTS.metricRanges;
  Object.keys(DASHBOARD_DEFAULTS.metricRanges).forEach((metric) => {
    const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
    keys.forEach((key) => {
      const fromVal = savedRanges[metric]?.[key];
      const toVal = metricRanges[metric]?.[key];
      if (fromVal !== toVal && (fromVal !== undefined || toVal !== undefined)) {
        const metricLabel = METRIC_LABELS[metric] ?? metric;
        const keyLabel = METRIC_KEY_LABELS[key] ?? key;
        list.push(
          changeEntry(
            `${metricLabel} → ${keyLabel}`,
            fromVal !== undefined ? fromVal : '—',
            toVal !== undefined ? toVal : '—'
          )
        );
      }
    });
  });

  // Order and visibility
  if (JSON.stringify(metricOrder) !== JSON.stringify(savedMetricOrder)) {
    list.push(simpleChange('Metric order'));
  }
  if (JSON.stringify(chartOrder) !== JSON.stringify(savedChartOrder)) {
    list.push(simpleChange('Chart order'));
  }
  Object.keys(DASHBOARD_DEFAULTS.gaugeVisible || {}).forEach((metric) => {
    const fromVal = savedGaugeVisible[metric] !== false;
    const toVal = gaugeVisible[metric] !== false;
    if (fromVal !== toVal) {
      const metricLabel = METRIC_LABELS[metric] ?? metric;
      list.push(
        changeEntry(
          `Gauge: ${metricLabel}`,
          fromVal ? 'visible' : 'hidden',
          toVal ? 'visible' : 'hidden'
        )
      );
    }
  });
  CHART_COLOR_SPEC.forEach((chart) => {
    const fromVal = savedChartVisible[chart.id] !== false;
    const toVal = chartVisible[chart.id] !== false;
    if (fromVal !== toVal) {
      list.push(
        changeEntry(
          `Chart: ${chart.label}`,
          fromVal ? 'visible' : 'hidden',
          toVal ? 'visible' : 'hidden'
        )
      );
    }
  });

  // Accent and chart colors
  if (effectiveAccent !== configAccent) {
    list.push(changeEntry('Accent color', configAccent, effectiveAccent));
  }
  const savedColors = config.chartColors ?? DASHBOARD_DEFAULTS.chartColors;
  CHART_COLOR_SPEC.forEach((chart) => {
    chart.series.forEach(({ key, label: seriesLabel }) => {
      const defaultHex = DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
      const fromVal = savedColors[chart.id]?.[key] ?? defaultHex;
      const toVal = chartColors[chart.id]?.[key] ?? defaultHex;
      const fromHex = normalizeHex(fromVal, defaultHex);
      const toHex = normalizeHex(toVal, defaultHex);
      const toDisplay = isValidHex(toVal)
        ? toHex
        : (String(toVal ?? '').trim() || fromHex);
      if (fromHex !== toHex || fromHex !== toDisplay) {
        list.push(
          changeEntry(
            `${chart.label} → ${seriesLabel}`,
            fromHex,
            toDisplay
          )
        );
      }
    });
  });

  return list;
}
