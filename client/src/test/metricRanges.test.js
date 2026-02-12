import { describe, it, expect } from 'vitest';
import { getMetricColor, DEFAULT_EXPECTED_HASHRATE_GH } from '../lib/metricRanges.js';

describe('DEFAULT_EXPECTED_HASHRATE_GH', () => {
  it('is 6000', () => {
    expect(DEFAULT_EXPECTED_HASHRATE_GH).toBe(6000);
  });
});

describe('getMetricColor', () => {
  it('returns text-accent when miner is null', () => {
    expect(getMetricColor(null, 'temp')).toBe('text-accent');
    expect(getMetricColor(null, 'hashrate')).toBe('text-accent');
  });

  describe('temp', () => {
    it('green <= 55.5 °C', () => {
      expect(getMetricColor({ temp: 0 }, 'temp')).toBe('text-success');
      expect(getMetricColor({ temp: 55 }, 'temp')).toBe('text-success');
      expect(getMetricColor({ temp: 55.5 }, 'temp')).toBe('text-success');
    });
    it('orange > 55.5–65 °C', () => {
      expect(getMetricColor({ temp: 56 }, 'temp')).toBe('text-warning');
      expect(getMetricColor({ temp: 65 }, 'temp')).toBe('text-warning');
    });
    it('red > 65 °C', () => {
      expect(getMetricColor({ temp: 66 }, 'temp')).toBe('text-danger');
    });
    it('accent when temp is null', () => {
      expect(getMetricColor({}, 'temp')).toBe('text-accent');
    });
  });

  describe('hashrate', () => {
    it('red when null or 0', () => {
      expect(getMetricColor({ hashRate: null }, 'hashrate')).toBe('text-danger');
      expect(getMetricColor({ hashRate: 0 }, 'hashrate')).toBe('text-danger');
    });
    it('orange when < 6 TH/s', () => {
      expect(getMetricColor({ hashRate: 5999 }, 'hashrate')).toBe('text-warning');
      expect(getMetricColor({ hashRate: 4800 }, 'hashrate')).toBe('text-warning');
    });
    it('green at or above 6 TH/s', () => {
      expect(getMetricColor({ hashRate: 6000 }, 'hashrate')).toBe('text-success');
      expect(getMetricColor({ hashRate: 7000 }, 'hashrate')).toBe('text-success');
    });
  });

  describe('power', () => {
    it('green <= 100 W', () => {
      expect(getMetricColor({ power: 100 }, 'power')).toBe('text-success');
      expect(getMetricColor({ power: 0 }, 'power')).toBe('text-success');
    });
    it('orange 101-112 W', () => {
      expect(getMetricColor({ power: 101 }, 'power')).toBe('text-warning');
      expect(getMetricColor({ power: 112 }, 'power')).toBe('text-warning');
    });
    it('red > 112 W', () => {
      expect(getMetricColor({ power: 113 }, 'power')).toBe('text-danger');
    });
  });

  describe('efficiency', () => {
    it('green <= 20 J/TH', () => {
      expect(getMetricColor({ power: 100, hashRate: 5000 }, 'efficiency')).toBe('text-success');
      expect(getMetricColor({ power: 120, hashRate: 6000 }, 'efficiency')).toBe('text-success');
    });
    it('orange 21-25 J/TH', () => {
      expect(getMetricColor({ power: 126, hashRate: 6000 }, 'efficiency')).toBe('text-warning'); // 21
      expect(getMetricColor({ power: 150, hashRate: 6000 }, 'efficiency')).toBe('text-warning'); // 25
    });
    it('red > 25 J/TH', () => {
      expect(getMetricColor({ power: 156, hashRate: 6000 }, 'efficiency')).toBe('text-danger');
    });
    it('accepts precomputed efficiency as third arg', () => {
      expect(getMetricColor({}, 'efficiency', 15)).toBe('text-success');
      expect(getMetricColor({}, 'efficiency', 30)).toBe('text-danger');
    });
  });

  describe('current', () => {
    it('green <= 7.75 A, orange 7.76–9 A, red > 9 A', () => {
      expect(getMetricColor({ current: 7750 }, 'current')).toBe('text-success'); // 7.75 A
      expect(getMetricColor({ current: 8000 }, 'current')).toBe('text-warning'); // 8 A
      expect(getMetricColor({ current: 9000 }, 'current')).toBe('text-warning'); // 9 A
      expect(getMetricColor({ current: 9100 }, 'current')).toBe('text-danger');  // > 9 A
    });
  });

  describe('frequency', () => {
    it('green when >= 700 MHz', () => {
      expect(getMetricColor({ frequency: 700 }, 'frequency')).toBe('text-success');
      expect(getMetricColor({ frequency: 801 }, 'frequency')).toBe('text-success');
    });
    it('orange 650–699 MHz', () => {
      expect(getMetricColor({ frequency: 650 }, 'frequency')).toBe('text-warning');
      expect(getMetricColor({ frequency: 699 }, 'frequency')).toBe('text-warning');
    });
    it('red when < 650 MHz', () => {
      expect(getMetricColor({ frequency: 649 }, 'frequency')).toBe('text-danger');
    });
  });

  describe('voltage', () => {
    it('green when diff <= 20 mV', () => {
      expect(getMetricColor({ coreVoltageActual: 1000, coreVoltage: 1000 }, 'voltage')).toBe('text-success');
      expect(getMetricColor({ coreVoltageActual: 1015, coreVoltage: 1000 }, 'voltage')).toBe('text-success');
    });
    it('orange when diff 21-50 mV', () => {
      expect(getMetricColor({ coreVoltageActual: 1025, coreVoltage: 1000 }, 'voltage')).toBe('text-warning');
      expect(getMetricColor({ coreVoltageActual: 1050, coreVoltage: 1000 }, 'voltage')).toBe('text-warning');
    });
    it('red when diff > 50 mV', () => {
      expect(getMetricColor({ coreVoltageActual: 1051, coreVoltage: 1000 }, 'voltage')).toBe('text-danger');
    });
    it('accent when actual or set is null', () => {
      expect(getMetricColor({ coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getMetricColor({ coreVoltageActual: 1000 }, 'voltage')).toBe('text-accent');
    });
  });

  describe('fanRpm', () => {
    it('green < 65%', () => {
      expect(getMetricColor({ fanspeed: 49 }, 'fanRpm')).toBe('text-success');
      expect(getMetricColor({ fanspeed: 64 }, 'fanRpm')).toBe('text-success');
    });
    it('orange 65–75%', () => {
      expect(getMetricColor({ fanspeed: 65 }, 'fanRpm')).toBe('text-warning');
      expect(getMetricColor({ fanspeed: 75 }, 'fanRpm')).toBe('text-warning');
    });
    it('red > 75%', () => {
      expect(getMetricColor({ fanspeed: 76 }, 'fanRpm')).toBe('text-danger');
    });
  });

  it('returns text-accent for unknown metric', () => {
    expect(getMetricColor({ temp: 50 }, 'unknown')).toBe('text-accent');
  });
});
