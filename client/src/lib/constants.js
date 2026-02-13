/**
 * Centralized app constants and config.
 */

// —— Polling & UI timing ———————————————————————————————————————————————————————
export const DEFAULT_EXPECTED_HASHRATE_GH = 6000; // 6 GH/s
export const POLL_MINER_INTERVAL_MS = 10_000;
export const POLL_NETWORK_INTERVAL_MS = 60_000; // 1 minute
export const ALERT_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes
export const NOTIFICATION_AUTO_CLOSE_MS = 8_000;
export const SUCCESS_MESSAGE_DISMISS_MS = 3_000;
export const LOW_HEAP_INT_THRESHOLD_BYTES = 50 * 1024; // 50 KB

// —— Stratum / pools ——————————————————————————————————————————————————————————
export const DEFAULT_STRATUM_PORT = 3333;
export const MIN_STRATUM_PORT = 1;
export const MAX_STRATUM_PORT = 65535;

export const SOLO_POOLS = [
  {
    identifier: 'braiins',
    name: 'Braiins',
    stratumHost: 'solo.stratum.braiins.com',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://braiins.com',
    fee: '0.5%',
    registration: 'No signup',
    region: 'Global',
    workerFormat: 'Address or Address.Worker',
    notes: '0.5% solo fee; stats at solo.braiins.com.',
  },
  {
    identifier: 'ckpool',
    name: 'CKPool',
    stratumHost: 'solo.ckpool.org',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://eusolo.ckpool.org/',
    fee: '2%',
    registration: 'No signup',
    region: 'Americas',
    workerFormat: 'Address or Address.Worker',
    notes: '—',
  },
  {
    identifier: 'ckpool-eu',
    name: 'CKPool (EU)',
    stratumHost: 'eusolo.ckpool.org',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://eusolo.ckpool.org/',
    fee: '2%',
    registration: 'No signup',
    region: 'EU',
    workerFormat: 'Address or Address.Worker',
    notes: '—',
  },
  {
    identifier: 'ckpool-oceania',
    name: 'CKPool (Oceania)',
    stratumHost: 'ausolo.ckpool.org',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://ausolo.ckpool.org/',
    fee: '2%',
    registration: 'No signup',
    region: 'Oceania',
    workerFormat: 'Address or Address.Worker',
    notes: '—',
  },
  {
    identifier: 'kano',
    name: 'Kano',
    stratumHost: 'stratum.kano.is',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://kano.is',
    fee: '0.9%',
    registration: 'No signup',
    region: 'Global',
    workerFormat: 'username.worker (register first)',
    notes: '0.9% solo fee.',
  },
  {
    identifier: 'ocean',
    name: 'OCEAN',
    stratumHost: 'mine.ocean.xyz',
    port: 3334,
    tls: false,
    webUrl: 'https://ocean.xyz',
    fee: '2%',
    registration: 'No signup',
    region: 'Global',
    workerFormat: 'Address or Address.Worker',
    notes: 'Alternate template ports available.',
  },
  {
    identifier: 'public-pool',
    name: 'Public Pool',
    stratumHost: 'public-pool.io',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    tlsPort: 4333,
    webUrl: 'https://web.public-pool.io',
    fee: '0%',
    registration: 'No signup',
    region: 'Global',
    workerFormat: 'Address.Worker, password x',
    notes: 'TLS on port 4333.',
  },
  {
    identifier: 'solo-pool-eu',
    name: 'Solo-Pool',
    stratumHost: 'btc-eu.solo-pool.org',
    port: 3334,
    tls: false,
    webUrl: 'https://btc.solo-pool.org/',
    fee: '1%',
    registration: 'No signup',
    region: 'EU',
    workerFormat: 'Address or Address.Worker',
    notes: 'Instant coinbase payout.',
  },
  {
    identifier: 'solopool-org',
    name: 'SoloPool.org',
    stratumHost: 'eu3.solopool.org',
    port: 8005,
    tls: false,
    webUrl: 'https://btc.solopool.org',
    fee: '2%',
    registration: 'No signup',
    region: 'EU',
    workerFormat: 'Address or Address.RIG_ID',
    notes: 'Low-end port (250K diff); 7005, 9005 for higher hashrate.',
  },
  {
    identifier: 'viabtc',
    name: 'ViaBTC',
    stratumHost: 'btc.viabtc.io',
    port: DEFAULT_STRATUM_PORT,
    tls: false,
    webUrl: 'https://www.viabtc.com',
    fee: '1%',
    registration: 'Account required',
    region: 'Global',
    workerFormat: 'user.worker (account)',
    notes: 'Set solo mode in pool dashboard.',
  },
];
