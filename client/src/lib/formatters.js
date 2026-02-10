/**
 * Format hashrate to human-readable string.
 * Input is in GH/s from the miner API.
 */
export function formatHashrate(ghps) {
  if (ghps == null) return '--';
  if (ghps >= 1000) return `${(ghps / 1000).toFixed(2)} TH/s`;
  if (ghps >= 1) return `${ghps.toFixed(2)} GH/s`;
  return `${(ghps * 1000).toFixed(1)} MH/s`;
}

/**
 * Format uptime from seconds to human-readable string.
 */
export function formatUptime(seconds) {
  if (seconds == null) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Format temperature with unit.
 */
export function formatTemp(temp) {
  if (temp == null) return '--';
  return `${temp.toFixed(1)}°C`;
}

/**
 * Format power in watts.
 */
export function formatPower(watts) {
  if (watts == null) return '--';
  return `${watts.toFixed(1)} W`;
}

/**
 * Format large numbers with commas.
 */
export function formatNumber(num) {
  if (num == null) return '--';
  return Number(num).toLocaleString();
}

/**
 * Format difficulty to human-readable (e.g., 146.5T).
 */
export function formatDifficulty(diff) {
  if (diff == null) return '--';
  if (diff >= 1e15) return `${(diff / 1e15).toFixed(2)} P`;
  if (diff >= 1e12) return `${(diff / 1e12).toFixed(2)} T`;
  if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)} G`;
  if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)} M`;
  return formatNumber(diff);
}

/**
 * Format BTC price with currency symbol.
 */
export function formatPrice(usd) {
  if (usd == null) return '--';
  return `$${Number(usd).toLocaleString()}`;
}

/**
 * Format a best difficulty value with appropriate suffix.
 */
export function formatBestDiff(diff) {
  if (diff == null) return '--';
  if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}G`;
  if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)}M`;
  if (diff >= 1e3) return `${(diff / 1e3).toFixed(2)}K`;
  return formatNumber(diff);
}

/**
 * Format time since a timestamp.
 */
export function timeSince(timestamp) {
  if (!timestamp) return '--';
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
}

/**
 * ESP32 reset reason labels.
 * Keys match the strings returned by the NerdQaxe firmware (ESP-IDF esp_reset_reason_t).
 */
export const RESET_REASONS = {
  'SYSTEM.RESET_UNKNOWN':        'Unknown',
  'SYSTEM.RESET_POWERON':        'Power On',
  'SYSTEM.RESET_EXTERNAL':       'External Reset',
  'SYSTEM.RESET_SOFTWARE':       'Software Reset',
  'SYSTEM.RESET_PANIC':          'Panic / Exception',
  'SYSTEM.RESET_INT_WATCHDOG':   'Interrupt Watchdog',
  'SYSTEM.RESET_TASK_WATCHDOG':  'Task Watchdog',
  'SYSTEM.RESET_OTHER_WATCHDOG': 'Other Watchdog',
  'SYSTEM.RESET_DEEPSLEEP':      'Deep Sleep Wake',
  'SYSTEM.RESET_BROWNOUT':       'Brownout',
  'SYSTEM.RESET_SDIO':           'SDIO Reset',
  'SYSTEM.RESET_NOT_SPECIFIED':  'Not Specified',
};

/**
 * Format the raw reset reason string into a human-readable label.
 * Falls back to the raw string if unrecognised.
 */
export function formatResetReason(raw) {
  if (!raw) return '--';
  return RESET_REASONS[raw] ?? raw;
}
