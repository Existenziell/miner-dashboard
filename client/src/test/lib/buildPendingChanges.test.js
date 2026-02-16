import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { describe, expect, it } from 'vitest';
import {
  changeEntry,
  simpleChange,
  buildPendingChanges,
} from '@/lib/buildPendingChanges.js';
import { CHART_COLOR_SPEC } from '@/lib/constants.js';

function stateFromConfig(config) {
  return {
    metricRanges: config.metricRanges ?? { ...DASHBOARD_DEFAULTS.metricRanges },
    metricOrder: config.metricOrder ?? DASHBOARD_DEFAULTS.metricOrder ?? Object.keys(DASHBOARD_DEFAULTS.metricRanges),
    chartOrder: config.chartOrder ?? DASHBOARD_DEFAULTS.chartOrder ?? CHART_COLOR_SPEC.map((c) => c.id),
    gaugeVisible: config.gaugeVisible ?? { ...DASHBOARD_DEFAULTS.gaugeVisible },
    chartVisible: config.chartVisible ?? { ...DASHBOARD_DEFAULTS.chartVisible },
    chartColors: config.chartColors ?? { ...DASHBOARD_DEFAULTS.chartColors },
    effectiveAccent: config.accentColor ?? DASHBOARD_DEFAULTS.accentColor,
  };
}

describe('changeEntry', () => {
  it('returns object with label, from, to as strings', () => {
    const entry = changeEntry('Accent color', '#aaa', '#bbb');
    expect(entry).toEqual({ label: 'Accent color', from: '#aaa', to: '#bbb' });
  });

  it('uses — for undefined or null from/to', () => {
    expect(changeEntry('X', undefined, 'b').from).toBe('—');
    expect(changeEntry('X', null, 'b').from).toBe('—');
    expect(changeEntry('X', 'a', undefined).to).toBe('—');
    expect(changeEntry('X', 'a', null).to).toBe('—');
  });

  it('converts from/to to string when present', () => {
    expect(changeEntry('Num', 100, 200)).toEqual({ label: 'Num', from: '100', to: '200' });
  });
});

describe('simpleChange', () => {
  it('returns changeEntry with saved/changed', () => {
    expect(simpleChange('Metric order')).toEqual({
      label: 'Metric order',
      from: 'saved',
      to: 'changed',
    });
  });
});

describe('buildPendingChanges', () => {
  it('returns empty list when config and state match', () => {
    const config = { ...DASHBOARD_DEFAULTS };
    const state = stateFromConfig(config);
    expect(buildPendingChanges(config, state)).toEqual([]);
  });

  it('includes accent color change when effectiveAccent differs', () => {
    const config = { accentColor: '#06b6d4' };
    const state = stateFromConfig(config);
    state.effectiveAccent = '#d946ef';
    const list = buildPendingChanges(config, state);
    const accent = list.find((e) => e.label === 'Accent color');
    expect(accent).toBeDefined();
    expect(accent.from).toBe('#06b6d4');
    expect(accent.to).toBe('#d946ef');
  });

  it('includes metric order change when order differs', () => {
    const config = { metricOrder: ['hashrate', 'temp', 'power'] };
    const state = stateFromConfig(config);
    state.metricOrder = ['temp', 'hashrate', 'power'];
    const list = buildPendingChanges(config, state);
    expect(list).toContainEqual(simpleChange('Metric order'));
  });

  it('includes chart order change when order differs', () => {
    const config = { chartOrder: ['hashrate', 'temperature', 'power'] };
    const state = stateFromConfig(config);
    state.chartOrder = ['power', 'hashrate', 'temperature'];
    const list = buildPendingChanges(config, state);
    expect(list).toContainEqual(simpleChange('Chart order'));
  });

  it('includes metric range changes when gauge min/max differ', () => {
    const config = { metricRanges: { hashrate: { min: 5900, gaugeMax: 7000 } } };
    const state = stateFromConfig(config);
    state.metricRanges = { ...state.metricRanges, hashrate: { min: 5000, gaugeMax: 7000 } };
    const list = buildPendingChanges(config, state);
    const rangeEntry = list.find((e) => e.label === 'Hashrate (GH/s) → Min');
    expect(rangeEntry).toBeDefined();
    expect(rangeEntry.from).toBe('5900');
    expect(rangeEntry.to).toBe('5000');
  });

  it('includes gauge visibility change when a gauge is toggled', () => {
    const config = { gaugeVisible: { hashrate: true, temp: true, power: true } };
    const state = stateFromConfig(config);
    state.gaugeVisible = { ...state.gaugeVisible, hashrate: false };
    const list = buildPendingChanges(config, state);
    const gaugeEntry = list.find((e) => e.label === 'Gauge: Hashrate (GH/s)');
    expect(gaugeEntry).toBeDefined();
    expect(gaugeEntry.from).toBe('visible');
    expect(gaugeEntry.to).toBe('hidden');
  });

  it('includes chart visibility change when a chart is toggled', () => {
    const config = { chartVisible: { hashrate: true, temperature: true, power: true } };
    const state = stateFromConfig(config);
    state.chartVisible = { ...state.chartVisible, hashrate: false };
    const list = buildPendingChanges(config, state);
    const chartEntry = list.find((e) => e.label === 'Chart: Hashrate');
    expect(chartEntry).toBeDefined();
    expect(chartEntry.from).toBe('visible');
    expect(chartEntry.to).toBe('hidden');
  });
});
