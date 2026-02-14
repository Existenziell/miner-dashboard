/**
 * Notification threshold definitions (metric rules).
 * Each rule: { id, label, severity, check(miner) => true if out of bounds }.
 */

export const NOTIFICATION_RULES = [
  {
    id: 'temp_high',
    label: 'ASIC temperature high',
    severity: 'warning',
    check: (m) => m?.temp != null && m.temp > 60,
    detail: (m) => (m?.temp != null ? `${m.temp.toFixed(1)}°C` : ''),
  },
  {
    id: 'temp_critical',
    label: 'ASIC temperature critical',
    severity: 'critical',
    check: (m) => {
      if (m?.temp == null) return false;
      const limit = m.overheat_temp ?? 70;
      return m.temp >= limit - 2 || m.temp >= 75;
    },
    detail: (m) => (m?.temp != null ? `${m.temp.toFixed(1)}°C (limit ${m?.overheat_temp ?? 70}°C)` : ''),
  },
  {
    id: 'vr_temp_high',
    label: 'VR temperature high',
    severity: 'warning',
    check: (m) => m?.vrTemp != null && m.vrTemp > 70,
    detail: (m) => (m?.vrTemp != null ? `${m.vrTemp.toFixed(1)}°C` : ''),
  },
  {
    id: 'reject_rate',
    label: 'Share rejection rate high',
    severity: 'warning',
    check: (m) => {
      const acc = m?.sharesAccepted ?? 0;
      const rej = m?.sharesRejected ?? 0;
      const total = acc + rej;
      if (total < 10) return false;
      return (rej / total) * 100 > 1;
    },
    detail: (m) => {
      const acc = m?.sharesAccepted ?? 0;
      const rej = m?.sharesRejected ?? 0;
      const total = acc + rej;
      const pct = total > 0 ? ((rej / total) * 100).toFixed(1) : '0';
      const raw = m?.sharesRejectedReasons ?? m?.shares_rejected_reasons;
      const top = Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
      const msg = top?.message ?? top?.reason ?? top?.msg;
      const reasonText = msg ? ` (${msg})` : '';
      return `${pct}% rejected${reasonText}`;
    },
  },
  {
    id: 'ping_loss',
    label: 'Pool ping loss high',
    severity: 'warning',
    check: (m) => m?.recentpingloss != null && m.recentpingloss > 10,
    detail: (m) => (m?.recentpingloss != null ? `${m.recentpingloss}% loss` : ''),
  },
  {
    id: 'hashrate_zero',
    label: 'Hashrate zero',
    severity: 'warning',
    check: (m) => m != null && !m.shutdown && (m.hashRate == null || m.hashRate === 0),
    detail: () => 'Miner reporting 0 GH/s',
  },
];

/**
 * Mock miner payload that triggers all notifications. Use with ?notifications=all for UI testing.
 */
export const MOCK_MINER_ALL_NOTIFICATIONS = {
  temp: 76,
  overheat_temp: 80,
  vrTemp: 71,
  sharesAccepted: 90,
  sharesRejected: 10,
  sharesRejectedReasons: [{ message: 'Stale share' }],
  recentpingloss: 15,
  hashRate: 0,
};

/**
 * Returns list of active notification objects { id, label, severity, detail } for the given miner data.
 */
export function evaluateNotifications(miner) {
  if (!miner) return [];
  return NOTIFICATION_RULES.filter((r) => r.check(miner)).map((r) => ({
    id: r.id,
    label: r.label,
    severity: r.severity,
    detail: typeof r.detail === 'function' ? r.detail(miner) : r.detail,
  }));
}
