import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from '@/lib/alerts.js';

describe('evaluateAlerts', () => {
  it('returns empty array for null or undefined miner', () => {
    expect(evaluateAlerts(null)).toEqual([]);
    expect(evaluateAlerts(undefined)).toEqual([]);
  });

  it('returns empty array when no rules match', () => {
    const miner = { temp: 50, hashRate: 6000, power: 90 };
    expect(evaluateAlerts(miner)).toEqual([]);
  });

  describe('temp_high', () => {
    it('triggers when temp > 60', () => {
      const miner = { temp: 61 };
      const alerts = evaluateAlerts(miner);
      expect(alerts.some((a) => a.id === 'temp_high')).toBe(true);
      expect(alerts.find((a) => a.id === 'temp_high').detail).toBe('61.0°C');
    });
    it('does not trigger when temp <= 60', () => {
      expect(evaluateAlerts({ temp: 60 })).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
      expect(evaluateAlerts({ temp: 50 })).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
    });
    it('does not trigger when temp is null', () => {
      expect(evaluateAlerts({})).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
    });
  });

  describe('temp_critical', () => {
    it('triggers when temp >= limit - 2 (default 70)', () => {
      const miner = { temp: 68 };
      const alerts = evaluateAlerts(miner);
      expect(alerts.some((a) => a.id === 'temp_critical')).toBe(true);
    });
    it('triggers when temp >= 75 regardless of limit', () => {
      expect(evaluateAlerts({ temp: 75 }).some((a) => a.id === 'temp_critical')).toBe(true);
    });
    it('uses overheat_temp when set', () => {
      // temp >= limit - 2 triggers: 68 >= 68 with limit 70
      expect(evaluateAlerts({ temp: 68, overheat_temp: 70 }).some((a) => a.id === 'temp_critical')).toBe(true);
      expect(evaluateAlerts({ temp: 60, overheat_temp: 80 }).some((a) => a.id === 'temp_critical')).toBe(false);
    });
  });

  describe('vr_temp_high', () => {
    it('triggers when vrTemp > 70', () => {
      const alerts = evaluateAlerts({ vrTemp: 71 });
      expect(alerts.some((a) => a.id === 'vr_temp_high')).toBe(true);
      expect(alerts.find((a) => a.id === 'vr_temp_high').detail).toBe('71.0°C');
    });
    it('does not trigger when vrTemp <= 70', () => {
      expect(evaluateAlerts({ vrTemp: 70 })).not.toContainEqual(expect.objectContaining({ id: 'vr_temp_high' }));
    });
  });

  describe('reject_rate', () => {
    it('does not trigger when total shares < 10', () => {
      expect(evaluateAlerts({ sharesAccepted: 5, sharesRejected: 4 })).not.toContainEqual(
        expect.objectContaining({ id: 'reject_rate' })
      );
    });
    it('triggers when rejection rate > 1% and total >= 10', () => {
      const miner = { sharesAccepted: 90, sharesRejected: 10 };
      const alerts = evaluateAlerts(miner);
      expect(alerts.some((a) => a.id === 'reject_rate')).toBe(true);
      expect(alerts.find((a) => a.id === 'reject_rate').detail).toContain('10.0% rejected');
    });
    it('does not trigger when rejection rate <= 1%', () => {
      expect(evaluateAlerts({ sharesAccepted: 99, sharesRejected: 1 })).not.toContainEqual(
        expect.objectContaining({ id: 'reject_rate' })
      );
    });
    it('includes reason from sharesRejectedReasons when present', () => {
      const miner = {
        sharesAccepted: 80,
        sharesRejected: 20,
        sharesRejectedReasons: [{ message: 'Stale share' }],
      };
      const alerts = evaluateAlerts(miner);
      expect(alerts.find((a) => a.id === 'reject_rate').detail).toContain('Stale share');
    });
  });

  describe('ping_loss', () => {
    it('triggers when recentpingloss > 10', () => {
      const alerts = evaluateAlerts({ recentpingloss: 15 });
      expect(alerts.some((a) => a.id === 'ping_loss')).toBe(true);
      expect(alerts.find((a) => a.id === 'ping_loss').detail).toBe('15% loss');
    });
    it('does not trigger when recentpingloss <= 10', () => {
      expect(evaluateAlerts({ recentpingloss: 10 })).not.toContainEqual(
        expect.objectContaining({ id: 'ping_loss' })
      );
    });
  });

  describe('hashrate_zero', () => {
    it('triggers when hashRate is null and not shutdown', () => {
      expect(evaluateAlerts({ hashRate: null }).some((a) => a.id === 'hashrate_zero')).toBe(true);
    });
    it('triggers when hashRate is 0 and not shutdown', () => {
      expect(evaluateAlerts({ hashRate: 0 }).some((a) => a.id === 'hashrate_zero')).toBe(true);
    });
    it('does not trigger when shutdown is true', () => {
      expect(evaluateAlerts({ hashRate: 0, shutdown: true }).some((a) => a.id === 'hashrate_zero')).toBe(false);
    });
    it('does not trigger when hashrate is non-zero', () => {
      expect(evaluateAlerts({ hashRate: 1000 }).some((a) => a.id === 'hashrate_zero')).toBe(false);
    });
    it('returns detail "Miner reporting 0 GH/s"', () => {
      expect(evaluateAlerts({ hashRate: 0 }).find((a) => a.id === 'hashrate_zero').detail).toBe(
        'Miner reporting 0 GH/s'
      );
    });
  });

  it('returns alert objects with id, label, severity, detail', () => {
    const alerts = evaluateAlerts({ temp: 65 });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveProperty('id');
    expect(alerts[0]).toHaveProperty('label');
    expect(alerts[0]).toHaveProperty('severity');
    expect(alerts[0]).toHaveProperty('detail');
  });
});
