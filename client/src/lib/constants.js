/**
 * Centralized app constants and config.
 * Config defaults (poll intervals, gauge, metric ranges) come from shared/dashboardDefaults.
 */
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';

// —— Polling & UI timing (from shared dashboard defaults) ——————————————————————
export const DEFAULT_EXPECTED_HASHRATE_GH = DASHBOARD_DEFAULTS.defaultExpectedHashrateGh;
export const POLL_MINER_INTERVAL_MS = DASHBOARD_DEFAULTS.pollMinerIntervalMs;
export const POLL_NETWORK_INTERVAL_MS = DASHBOARD_DEFAULTS.pollNetworkIntervalMs;
export const LOW_HEAP_INT_THRESHOLD_BYTES = 50 * 1024; // 50 KB
/** Throttle: min time between browser (OS) notifications for the same metric. */
export const BROWSER_NOTIFICATION_COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes
/** How long the toast beside the save button is shown before auto-dismiss. */
export const TOAST_AUTO_DISMISS_MS = 5_000;

// —— Chart history & persistence ——————————————————————————————————————————————
export const MAX_CHART_HISTORY = 500; // cap per chart
export const CHART_PERSIST_INTERVAL_MS = 60_000; // throttle localStorage writes to at most every 60s
export const CHART_POINTS_1M = 6;   // 1 min at 10s interval
export const CHART_POINTS_10M = 60;
export const CHART_POINTS_1H = 360;

// —— LocalStorage keys ———————————————————————————————————————————————————————
export const THEME_KEY = 'md.theme';
export const CHART_LEGEND_HR = 'md.chart.hr.legend';
export const CHART_LEGEND_TMP = 'md.chart.tmp.legend';
export const CHART_LEGEND_PW = 'md.chart.pw.legend';
export const CHART_COLLAPSED_HR = 'md.chart.hr.collapsed';
export const CHART_COLLAPSED_TMP = 'md.chart.tmp.collapsed';
export const CHART_COLLAPSED_PW = 'md.chart.pw.collapsed';
export const CHART_HISTORY_HR = 'md.chart.hr.data';
export const CHART_HISTORY_TMP = 'md.chart.tmp.data';
export const CHART_HISTORY_PW = 'md.chart.pw.data';
export const SETTINGS_SECTION_KEY = 'md.settings.section';
export const SETTINGS_WIFI_COLLAPSED = 'md.settings.wifi.collapsed';

// —— Settings / validation lengths —————————————————————————————————────────————
export const MAX_STRATUM_USER_LENGTH = 128;
export const MAX_STRATUM_PASSWORD_LENGTH = 128;
export const MAX_STRATUM_URL_LENGTH = 512;
export const MAX_HOSTNAME_LENGTH = 64;
export const MAX_WIFI_SSID_LENGTH = 32;
export const MIN_WIFI_PASSWORD_LENGTH = 8;
export const MAX_WIFI_PASSWORD_LENGTH = 63;

// —— UI (gauges) & metric ranges ——————————————————————————————————————————————
export const GAUGE_RADIUS = 48; // Gauge arc radius (viewBox units)
export const METRIC_RANGES = DASHBOARD_DEFAULTS.metricRanges;

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

/** Chart series color spec for dashboard config and Settings UI. Keys must match DASHBOARD_DEFAULTS.chartColors. */
export const CHART_COLOR_SPEC = [
  {
    id: 'hashrate',
    label: 'Hashrate',
    series: [
      { key: 'hashRate', label: 'Instant' },
      { key: 'hashRate_1m', label: '1m Avg' },
      { key: 'hashRate_10m', label: '10m Avg' },
      { key: 'hashRate_1h', label: '1h Avg' },
      { key: 'hashRate_1d', label: '1d Avg' },
    ],
  },
  { id: 'temperature', label: 'Temperature', series: [{ key: 'temp', label: 'ASIC Temp' }, { key: 'vrTemp', label: 'VR Temp' }] },
  { id: 'power', label: 'Power', series: [{ key: 'power', label: 'Power' }, { key: 'currentA', label: 'Current' }] },
];

/** Recharts grid and axis stroke colors by theme (light/dark). Not the data series colors. */
export const CHART_GRID_AXIS_COLORS = {
  light: { grid: '#d1d5db', axis: '#9ca3af' },
  dark: { grid: '#333366', axis: '#666688' },
};

// —— Device / firmware (ESP32 reset reasons, NerdQaxe/ESP-IDF) —————————————————
/** Keys match strings returned by miner API (esp_reset_reason_t). */
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
