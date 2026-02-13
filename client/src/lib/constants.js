/**
 * Centralized app constants.
 */

/** Miner status poll interval (default for useMinerData). */
export const POLL_MINER_INTERVAL_MS = 10_000;

/** Free internal heap below this (bytes) shows a low-memory warning. */
export const LOW_HEAP_INT_THRESHOLD_BYTES = 50 * 1024; // 50 KB

/** Network status poll interval (default for useNetworkData). */
export const POLL_NETWORK_INTERVAL_MS = 60_000;

/** Cooldown before re-alerting the same issue (useAlerts). */
export const ALERT_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes

/** Auto-close browser notification after this many ms. */
export const NOTIFICATION_AUTO_CLOSE_MS = 8_000;

/** Auto-dismiss success toast on settings save. */
export const SUCCESS_MESSAGE_DISMISS_MS = 3_000;

/** Expected hashrate (GH) when not set – 6 TH/s. */
export const DEFAULT_EXPECTED_HASHRATE_GH = 6000;
