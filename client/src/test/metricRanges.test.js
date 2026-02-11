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
    it('green <= 55', () => {
      expect(getMetricColor({ temp: 55 }, 'temp')).toBe('text-success');
      expect(getMetricColor({ temp: 0 }, 'temp')).toBe('text-success');
    });
    it('orange 56-65', () => {
      expect(getMetricColor({ temp: 56 }, 'temp')).toBe('text-warning');
      expect(getMetricColor({ temp: 65 }, 'temp')).toBe('text-warning');
    });
    it('red > 65', () => {
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
    it('orange when < 80% of expected (default 6000)', () => {
      expect(getMetricColor({ hashRate: 4799 }, 'hashrate')).toBe('text-warning'); // 79.98%
      expect(getMetricColor({ hashRate: 4800 }, 'hashrate')).toBe('text-success'); // 80%
    });
    it('green when >= 80% of expected', () => {
      expect(getMetricColor({ hashRate: 6000 }, 'hashrate')).toBe('text-success');
      expect(getMetricColor({ hashRate: 4800, expectedHashrate: 6000 }, 'hashrate')).toBe('text-success');
    });
    it('uses expectedHashrate when provided', () => {
      expect(getMetricColor({ hashRate: 4000, expectedHashrate: 5000 }, 'hashrate')).toBe('text-success'); // 80%
      expect(getMetricColor({ hashRate: 3999, expectedHashrate: 5000 }, 'hashrate')).toBe('text-warning');
    });
  });

  describe('power', () => {
    it('green <= 100 W', () => {
      expect(getMetricColor({ power: 100 }, 'power')).toBe('text-success');
      expect(getMetricColor({ power: 0 }, 'power')).toBe('text-success');
    });
    it('orange 101-110 W', () => {
      expect(getMetricColor({ power: 101 }, 'power')).toBe('text-warning');
      expect(getMetricColor({ power: 110 }, 'power')).toBe('text-warning');
    });
    it('red > 110 W', () => {
      expect(getMetricColor({ power: 111 }, 'power')).toBe('text-danger');
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
    it('converts mA to A (divide by 1000)', () => {
      expect(getMetricColor({ current: 7750 }, 'current')).toBe('text-success'); // 7.75 A
      expect(getMetricColor({ current: 8000 }, 'current')).toBe('text-warning'); // 8 A
      expect(getMetricColor({ current: 8100 }, 'current')).toBe('text-danger');
    });
  });

  describe('frequency', () => {
    it('green <= 90% of 800 MHz (720)', () => {
      expect(getMetricColor({ frequency: 720 }, 'frequency')).toBe('text-success');
    });
    it('orange 721-760 (95%)', () => {
      expect(getMetricColor({ frequency: 721 }, 'frequency')).toBe('text-warning');
      expect(getMetricColor({ frequency: 760 }, 'frequency')).toBe('text-warning');
    });
    it('red > 760', () => {
      expect(getMetricColor({ frequency: 761 }, 'frequency')).toBe('text-danger');
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
    it('green < 50%', () => {
      expect(getMetricColor({ fanspeed: 49 }, 'fanRpm')).toBe('text-success');
    });
    it('orange 50-70%', () => {
      expect(getMetricColor({ fanspeed: 50 }, 'fanRpm')).toBe('text-warning');
      expect(getMetricColor({ fanspeed: 70 }, 'fanRpm')).toBe('text-warning');
    });
    it('red > 70%', () => {
      expect(getMetricColor({ fanspeed: 71 }, 'fanRpm')).toBe('text-danger');
    });
  });

  it('returns text-accent for unknown metric', () => {
    expect(getMetricColor({ temp: 50 }, 'unknown')).toBe('text-accent');
  });
});
