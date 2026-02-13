import { describe, it, expect } from 'vitest';
import { getMetricColor } from '@/lib/metricRanges.js';
import { DEFAULT_EXPECTED_HASHRATE_GH } from '@/lib/constants.js';

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
    it('accent when <= 65 °C', () => {
      expect(getMetricColor({ temp: 0 }, 'temp')).toBe('text-accent');
      expect(getMetricColor({ temp: 55 }, 'temp')).toBe('text-accent');
      expect(getMetricColor({ temp: 65 }, 'temp')).toBe('text-accent');
    });
    it('red when > 65 °C', () => {
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
    it('red when below min (5500 GH/s)', () => {
      expect(getMetricColor({ hashRate: 4800 }, 'hashrate')).toBe('text-danger');
      expect(getMetricColor({ hashRate: 5499 }, 'hashrate')).toBe('text-danger');
    });
    it('accent at or above 5500 GH/s', () => {
      expect(getMetricColor({ hashRate: 5500 }, 'hashrate')).toBe('text-accent');
      expect(getMetricColor({ hashRate: 6000 }, 'hashrate')).toBe('text-accent');
      expect(getMetricColor({ hashRate: 7000 }, 'hashrate')).toBe('text-accent');
    });
  });

  describe('power', () => {
    it('accent when <= 117.5 W', () => {
      expect(getMetricColor({ power: 0 }, 'power')).toBe('text-accent');
      expect(getMetricColor({ power: 100 }, 'power')).toBe('text-accent');
      expect(getMetricColor({ power: 115 }, 'power')).toBe('text-accent');
      expect(getMetricColor({ power: 117.5 }, 'power')).toBe('text-accent');
    });
    it('red when > 117.5 W', () => {
      expect(getMetricColor({ power: 118 }, 'power')).toBe('text-danger');
    });
  });

  describe('efficiency', () => {
    it('accent when <= 25 J/TH', () => {
      expect(getMetricColor({ power: 100, hashRate: 5000 }, 'efficiency')).toBe('text-accent');
      expect(getMetricColor({ power: 120, hashRate: 6000 }, 'efficiency')).toBe('text-accent');
      expect(getMetricColor({ power: 126, hashRate: 6000 }, 'efficiency')).toBe('text-accent'); // 21
      expect(getMetricColor({ power: 150, hashRate: 6000 }, 'efficiency')).toBe('text-accent'); // 25
    });
    it('red when > 25 J/TH', () => {
      expect(getMetricColor({ power: 156, hashRate: 6000 }, 'efficiency')).toBe('text-danger');
    });
    it('accepts precomputed efficiency as third arg', () => {
      expect(getMetricColor({}, 'efficiency', 15)).toBe('text-accent');
      expect(getMetricColor({}, 'efficiency', 30)).toBe('text-danger');
    });
  });

  describe('current', () => {
    it('accent when <= 9.75 A', () => {
      expect(getMetricColor({ current: 9000 }, 'current')).toBe('text-accent');  // 9 A
      expect(getMetricColor({ current: 9400 }, 'current')).toBe('text-accent'); // 9.4 A
      expect(getMetricColor({ current: 9750 }, 'current')).toBe('text-accent'); // 9.75 A
    });
    it('red when > 9.75 A', () => {
      expect(getMetricColor({ current: 9760 }, 'current')).toBe('text-danger');
      expect(getMetricColor({ current: 10500 }, 'current')).toBe('text-danger');  // 10.5 A
    });
  });

  describe('frequency', () => {
    it('accent when >= 650 MHz', () => {
      expect(getMetricColor({ frequency: 650 }, 'frequency')).toBe('text-accent');
      expect(getMetricColor({ frequency: 700 }, 'frequency')).toBe('text-accent');
      expect(getMetricColor({ frequency: 801 }, 'frequency')).toBe('text-accent');
    });
    it('red when < 650 MHz', () => {
      expect(getMetricColor({ frequency: 649 }, 'frequency')).toBe('text-danger');
    });
  });

  describe('voltage', () => {
    it('accent when diff <= 50 mV', () => {
      expect(getMetricColor({ coreVoltageActual: 1000, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getMetricColor({ coreVoltageActual: 1015, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getMetricColor({ coreVoltageActual: 1050, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
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
    it('accent when <= 75%', () => {
      expect(getMetricColor({ fanspeed: 49 }, 'fanRpm')).toBe('text-accent');
      expect(getMetricColor({ fanspeed: 64 }, 'fanRpm')).toBe('text-accent');
      expect(getMetricColor({ fanspeed: 75 }, 'fanRpm')).toBe('text-accent');
    });
    it('red when > 75%', () => {
      expect(getMetricColor({ fanspeed: 76 }, 'fanRpm')).toBe('text-danger');
    });
  });

  it('returns text-accent for unknown metric', () => {
    expect(getMetricColor({ temp: 50 }, 'unknown')).toBe('text-accent');
  });
});
