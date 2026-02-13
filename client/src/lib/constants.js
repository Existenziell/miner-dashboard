/**
 * Centralized app constants and config.
 */

// —— Polling & UI timing ———————————————————————————————————————————————————————
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

// —— Stratum / pools ——————————————————————————————————————————————————————————
/** Default Stratum port when none is set (standard is 3333). */
export const DEFAULT_STRATUM_PORT = 3333;

/** Min/max valid Stratum port for validation and inputs. */
export const MIN_STRATUM_PORT = 1;
export const MAX_STRATUM_PORT = 65535;

/**
 * Used by poolUtils (dropdown, getPoolInfo, findSoloPoolOption) and Documentation page.
 * @typedef {{ identifier: string, name: string, stratumHost: string, port: number, tls: boolean, webUrl: string }} SoloPool
 */
export const SOLO_POOLS = [
    { identifier: 'braiins', name: 'Braiins', stratumHost: 'solo.stratum.braiins.com', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://braiins.com' },
    { identifier: 'ckpool', name: 'CKPool', stratumHost: 'solo.ckpool.org', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://eusolo.ckpool.org/' },
    { identifier: 'ckpool-eu', name: 'CKPool (EU)', stratumHost: 'eusolo.ckpool.org', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://eusolo.ckpool.org/' },
    { identifier: 'ckpool-oceania', name: 'CKPool (Oceania)', stratumHost: 'ausolo.ckpool.org', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://ausolo.ckpool.org/' },
    { identifier: 'kano', name: 'Kano', stratumHost: 'stratum.kano.is', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://kano.is' },
    { identifier: 'ocean', name: 'OCEAN', stratumHost: 'mine.ocean.xyz', port: 3334, tls: false, webUrl: 'https://ocean.xyz' },
    { identifier: 'public-pool', name: 'Public Pool', stratumHost: 'public-pool.io', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://web.public-pool.io' },
    { identifier: 'solo-pool-eu', name: 'Solo-Pool', stratumHost: 'btc-eu.solo-pool.org', port: 3334, tls: false, webUrl: 'https://btc.solo-pool.org/' },
    { identifier: 'solopool-org', name: 'SoloPool.org', stratumHost: 'eu3.solopool.org', port: 8005, tls: false, webUrl: 'https://btc.solopool.org' },
    { identifier: 'viabtc', name: 'ViaBTC', stratumHost: 'btc.viabtc.io', port: DEFAULT_STRATUM_PORT, tls: false, webUrl: 'https://www.viabtc.com' },
];
