import { describe, expect, it } from 'vitest';
import { evaluateNotifications } from '@/lib/notificationRules.js';

describe('evaluateNotifications', () => {
  it('returns empty array for null or undefined miner', () => {
    expect(evaluateNotifications(null)).toEqual([]);
    expect(evaluateNotifications(undefined)).toEqual([]);
  });

  it('returns empty array when no rules match', () => {
    const miner = { temp: 50, hashRate: 6000, power: 90 };
    expect(evaluateNotifications(miner)).toEqual([]);
  });

  describe('temp_high', () => {
    it('triggers when temp > 60', () => {
      const miner = { temp: 61 };
      const notifications = evaluateNotifications(miner);
      expect(notifications.some((a) => a.id === 'temp_high')).toBe(true);
      expect(notifications.find((a) => a.id === 'temp_high').detail).toBe('61.0°C');
    });
    it('does not trigger when temp <= 60', () => {
      expect(evaluateNotifications({ temp: 60 })).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
      expect(evaluateNotifications({ temp: 50 })).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
    });
    it('does not trigger when temp is null', () => {
      expect(evaluateNotifications({})).not.toContainEqual(expect.objectContaining({ id: 'temp_high' }));
    });
  });

  describe('temp_critical', () => {
    it('triggers when temp >= limit - 2 (default 70)', () => {
      const miner = { temp: 68 };
      const notifications = evaluateNotifications(miner);
      expect(notifications.some((a) => a.id === 'temp_critical')).toBe(true);
    });
    it('triggers when temp >= 75 regardless of limit', () => {
      expect(evaluateNotifications({ temp: 75 }).some((a) => a.id === 'temp_critical')).toBe(true);
    });
    it('uses overheat_temp when set', () => {
      // temp >= limit - 2 triggers: 68 >= 68 with limit 70
      expect(evaluateNotifications({ temp: 68, overheat_temp: 70 }).some((a) => a.id === 'temp_critical')).toBe(true);
      expect(evaluateNotifications({ temp: 60, overheat_temp: 80 }).some((a) => a.id === 'temp_critical')).toBe(false);
    });
  });

  describe('vr_temp_high', () => {
    it('triggers when vrTemp > 70', () => {
      const notifications = evaluateNotifications({ vrTemp: 71 });
      expect(notifications.some((a) => a.id === 'vr_temp_high')).toBe(true);
      expect(notifications.find((a) => a.id === 'vr_temp_high').detail).toBe('71.0°C');
    });
    it('does not trigger when vrTemp <= 70', () => {
      expect(evaluateNotifications({ vrTemp: 70 })).not.toContainEqual(expect.objectContaining({ id: 'vr_temp_high' }));
    });
  });

  describe('reject_rate', () => {
    it('does not trigger when total shares < 10', () => {
      expect(evaluateNotifications({ sharesAccepted: 5, sharesRejected: 4 })).not.toContainEqual(
        expect.objectContaining({ id: 'reject_rate' })
      );
    });
    it('triggers when rejection rate > 1% and total >= 10', () => {
      const miner = { sharesAccepted: 90, sharesRejected: 10 };
      const notifications = evaluateNotifications(miner);
      expect(notifications.some((a) => a.id === 'reject_rate')).toBe(true);
      expect(notifications.find((a) => a.id === 'reject_rate').detail).toContain('10.0% rejected');
    });
    it('does not trigger when rejection rate <= 1%', () => {
      expect(evaluateNotifications({ sharesAccepted: 99, sharesRejected: 1 })).not.toContainEqual(
        expect.objectContaining({ id: 'reject_rate' })
      );
    });
    it('includes reason from sharesRejectedReasons when present', () => {
      const miner = {
        sharesAccepted: 80,
        sharesRejected: 20,
        sharesRejectedReasons: [{ message: 'Stale share' }],
      };
      const notifications = evaluateNotifications(miner);
      expect(notifications.find((a) => a.id === 'reject_rate').detail).toContain('Stale share');
    });
  });

  describe('ping_loss', () => {
    it('triggers when recentpingloss > 10', () => {
      const notifications = evaluateNotifications({ recentpingloss: 15 });
      expect(notifications.some((a) => a.id === 'ping_loss')).toBe(true);
      expect(notifications.find((a) => a.id === 'ping_loss').detail).toBe('15% loss');
    });
    it('does not trigger when recentpingloss <= 10', () => {
      expect(evaluateNotifications({ recentpingloss: 10 })).not.toContainEqual(
        expect.objectContaining({ id: 'ping_loss' })
      );
    });
  });

  describe('hashrate_zero', () => {
    it('triggers when hashRate is null and not shutdown', () => {
      expect(evaluateNotifications({ hashRate: null }).some((a) => a.id === 'hashrate_zero')).toBe(true);
    });
    it('triggers when hashRate is 0 and not shutdown', () => {
      expect(evaluateNotifications({ hashRate: 0 }).some((a) => a.id === 'hashrate_zero')).toBe(true);
    });
    it('does not trigger when shutdown is true', () => {
      expect(evaluateNotifications({ hashRate: 0, shutdown: true }).some((a) => a.id === 'hashrate_zero')).toBe(false);
    });
    it('does not trigger when hashrate is non-zero', () => {
      expect(evaluateNotifications({ hashRate: 1000 }).some((a) => a.id === 'hashrate_zero')).toBe(false);
    });
    it('returns detail "Miner reporting 0 GH/s"', () => {
      expect(evaluateNotifications({ hashRate: 0 }).find((a) => a.id === 'hashrate_zero').detail).toBe(
        'Miner reporting 0 GH/s'
      );
    });
  });

  it('returns notification objects with id, label, severity, detail', () => {
    const notifications = evaluateNotifications({ temp: 65 });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0]).toHaveProperty('id');
    expect(notifications[0]).toHaveProperty('label');
    expect(notifications[0]).toHaveProperty('severity');
    expect(notifications[0]).toHaveProperty('detail');
  });
});
