import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPECTED_HASHRATE_GH } from '@/lib/constants.js';
import { getGaugeColor } from '@/lib/metricRanges.js';

describe('DEFAULT_EXPECTED_HASHRATE_GH', () => {
  it('is 6000', () => {
    expect(DEFAULT_EXPECTED_HASHRATE_GH).toBe(6000);
  });
});

describe('getGaugeColor', () => {
  it('returns text-accent when miner is null', () => {
    expect(getGaugeColor(null, 'temp')).toBe('text-accent');
    expect(getGaugeColor(null, 'hashrate')).toBe('text-accent');
  });

  describe('temp', () => {
    it('accent when <= 65 °C', () => {
      expect(getGaugeColor({ temp: 0 }, 'temp')).toBe('text-accent');
      expect(getGaugeColor({ temp: 55 }, 'temp')).toBe('text-accent');
      expect(getGaugeColor({ temp: 65 }, 'temp')).toBe('text-accent');
    });
    it('red when > 65 °C', () => {
      expect(getGaugeColor({ temp: 66 }, 'temp')).toBe('text-danger');
    });
    it('accent when temp is null', () => {
      expect(getGaugeColor({}, 'temp')).toBe('text-accent');
    });
  });

  describe('hashrate', () => {
    it('red when null or 0', () => {
      expect(getGaugeColor({ hashRate: null }, 'hashrate')).toBe('text-danger');
      expect(getGaugeColor({ hashRate: 0 }, 'hashrate')).toBe('text-danger');
    });
    it('red when below min (5500 GH/s)', () => {
      expect(getGaugeColor({ hashRate: 4800 }, 'hashrate')).toBe('text-danger');
      expect(getGaugeColor({ hashRate: 5499 }, 'hashrate')).toBe('text-danger');
    });
    it('accent at or above 5500 GH/s', () => {
      expect(getGaugeColor({ hashRate: 5500 }, 'hashrate')).toBe('text-accent');
      expect(getGaugeColor({ hashRate: 6000 }, 'hashrate')).toBe('text-accent');
      expect(getGaugeColor({ hashRate: 7000 }, 'hashrate')).toBe('text-accent');
    });
  });

  describe('power', () => {
    it('accent when <= 117.5 W', () => {
      expect(getGaugeColor({ power: 0 }, 'power')).toBe('text-accent');
      expect(getGaugeColor({ power: 100 }, 'power')).toBe('text-accent');
      expect(getGaugeColor({ power: 115 }, 'power')).toBe('text-accent');
      expect(getGaugeColor({ power: 117.5 }, 'power')).toBe('text-accent');
    });
    it('red when > 117.5 W', () => {
      expect(getGaugeColor({ power: 118 }, 'power')).toBe('text-danger');
    });
  });

  describe('efficiency', () => {
    it('accent when <= 25 J/TH', () => {
      expect(getGaugeColor({ power: 100, hashRate: 5000 }, 'efficiency')).toBe('text-accent');
      expect(getGaugeColor({ power: 120, hashRate: 6000 }, 'efficiency')).toBe('text-accent');
      expect(getGaugeColor({ power: 126, hashRate: 6000 }, 'efficiency')).toBe('text-accent'); // 21
      expect(getGaugeColor({ power: 150, hashRate: 6000 }, 'efficiency')).toBe('text-accent'); // 25
    });
    it('red when > 25 J/TH', () => {
      expect(getGaugeColor({ power: 156, hashRate: 6000 }, 'efficiency')).toBe('text-danger');
    });
    it('accepts precomputed efficiency as third arg', () => {
      expect(getGaugeColor({}, 'efficiency', 15)).toBe('text-accent');
      expect(getGaugeColor({}, 'efficiency', 30)).toBe('text-danger');
    });
  });

  describe('current', () => {
    it('accent when <= 9.75 A', () => {
      expect(getGaugeColor({ current: 9000 }, 'current')).toBe('text-accent');  // 9 A
      expect(getGaugeColor({ current: 9400 }, 'current')).toBe('text-accent'); // 9.4 A
      expect(getGaugeColor({ current: 9750 }, 'current')).toBe('text-accent'); // 9.75 A
    });
    it('red when > 9.75 A', () => {
      expect(getGaugeColor({ current: 9760 }, 'current')).toBe('text-danger');
      expect(getGaugeColor({ current: 10500 }, 'current')).toBe('text-danger');  // 10.5 A
    });
  });

  describe('frequency', () => {
    it('accent when >= 650 MHz', () => {
      expect(getGaugeColor({ frequency: 650 }, 'frequency')).toBe('text-accent');
      expect(getGaugeColor({ frequency: 700 }, 'frequency')).toBe('text-accent');
      expect(getGaugeColor({ frequency: 801 }, 'frequency')).toBe('text-accent');
    });
    it('red when < 650 MHz', () => {
      expect(getGaugeColor({ frequency: 649 }, 'frequency')).toBe('text-danger');
    });
  });

  describe('voltage', () => {
    it('accent when diff <= 50 mV', () => {
      expect(getGaugeColor({ coreVoltageActual: 1000, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getGaugeColor({ coreVoltageActual: 1015, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getGaugeColor({ coreVoltageActual: 1050, coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
    });
    it('red when diff > 50 mV', () => {
      expect(getGaugeColor({ coreVoltageActual: 1051, coreVoltage: 1000 }, 'voltage')).toBe('text-danger');
    });
    it('accent when actual or set is null', () => {
      expect(getGaugeColor({ coreVoltage: 1000 }, 'voltage')).toBe('text-accent');
      expect(getGaugeColor({ coreVoltageActual: 1000 }, 'voltage')).toBe('text-accent');
    });
  });

  describe('fanRpm', () => {
    it('accent when <= 75%', () => {
      expect(getGaugeColor({ fanspeed: 49 }, 'fanRpm')).toBe('text-accent');
      expect(getGaugeColor({ fanspeed: 64 }, 'fanRpm')).toBe('text-accent');
      expect(getGaugeColor({ fanspeed: 75 }, 'fanRpm')).toBe('text-accent');
    });
    it('red when > 75%', () => {
      expect(getGaugeColor({ fanspeed: 76 }, 'fanRpm')).toBe('text-danger');
    });
  });

  it('returns text-accent for unknown metric', () => {
    expect(getGaugeColor({ temp: 50 }, 'unknown')).toBe('text-accent');
  });
});
