/**
 * Centralized app constants (polling, timeouts, UI).
 */

/** Miner status poll interval (default for useMinerData). */
export const POLL_MINER_INTERVAL_MS = 10_000;

/** Network status poll interval (default for useNetworkData). */
export const POLL_NETWORK_INTERVAL_MS = 60_000;

/** Cooldown before re-alerting the same issue (useAlerts). */
export const ALERT_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes

/** Auto-close browser notification after this many ms. */
export const NOTIFICATION_AUTO_CLOSE_MS = 8_000;

/** Auto-dismiss success toast on settings save. */
export const SUCCESS_MESSAGE_DISMISS_MS = 3_000;
