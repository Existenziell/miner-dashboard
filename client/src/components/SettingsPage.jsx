import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { patchMinerSettings, restartMiner, shutdownMiner, fetchMinerAsic, patchDashboardConfig } from '../lib/api';
import { useMiner } from '../context/MinerContext';
import { useConfig } from '../context/ConfigContext';
import {
  SUCCESS_MESSAGE_DISMISS_MS,
  DEFAULT_STRATUM_PORT,
  MIN_STRATUM_PORT,
  MAX_STRATUM_PORT,
  SOLO_POOLS,
  MAX_STRATUM_USER_LENGTH,
  MAX_STRATUM_PASSWORD_LENGTH,
  MAX_STRATUM_URL_LENGTH,
  MAX_HOSTNAME_LENGTH,
  MAX_WIFI_SSID_LENGTH,
  MIN_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  CHART_COLOR_SPEC,
  SETTINGS_WIFI_COLLAPSED,
} from '../lib/constants';
import { useChartCollapsed } from '../lib/chartUtils';
import { getSettingsSectionFromUrl, setSettingsSectionInUrl } from '../lib/tabUrl';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { normalizeHex } from '../lib/colorUtils';
import { getStratumPayloadFromOption, findSoloPoolOption } from '../lib/poolUtils';
import { toBool } from '../lib/minerApiBools';
import { ChartCard } from './TimeSeriesChart';

const POOL_MODE_OPTIONS = [
  { value: 'failover', label: 'Failover (Primary/Fallback)' },
  { value: 'dual', label: 'Dual Pool' },
];

const METRIC_LABELS = {
  hashrate: 'Hashrate',
  efficiency: 'Efficiency',
  temp: 'Temp',
  fanRpm: 'Fan RPM',
  current: 'Current',
  frequency: 'Frequency',
  voltage: 'Voltage',
  power: 'Power',
};

const METRIC_KEY_LABELS = {
  min: 'Min',
  max: 'Max',
  gaugeMax: 'Gauge max',
  maxPct: 'Max %',
  maxMv: 'Max (mV)',
};

function deepCopyMetricRanges(ranges) {
  return JSON.parse(JSON.stringify(ranges));
}

function deepCopyChartColors(colors) {
  return JSON.parse(JSON.stringify(colors ?? DASHBOARD_DEFAULTS.chartColors));
}

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-muted-standalone text-xs">{hint}</p>}
    </div>
  );
}

export default function SettingsPage({ onError }) {
  const { data: miner, refetch } = useMiner();
  const [asic, setAsic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [message, setMessage] = useState(null);

  // Form state initialised from miner
  const [frequency, setFrequency] = useState(miner?.frequency ?? 600);
  const [coreVoltage, setCoreVoltage] = useState(miner?.coreVoltage ?? miner?.defaultCoreVoltage ?? 1150);
  const [overheatTemp, setOverheatTemp] = useState(miner?.overheat_temp ?? 70);
  const [fanAuto, setFanAuto] = useState(!!(miner?.autofanspeed != null && miner.autofanspeed !== 0));
  const [pidTargetTemp, setPidTargetTemp] = useState(miner?.pidTargetTemp ?? 55);
  const [manualFanSpeed, setManualFanSpeed] = useState(miner?.manualFanSpeed ?? 100);
  const [autoScreenOff, setAutoScreenOff] = useState(toBool(miner?.autoscreenoff));
  const [flipScreen, setFlipScreen] = useState(toBool(miner?.flipscreen));

  // WiFi form state (password not returned by API; leave blank to keep current)
  const [hostname, setHostname] = useState(miner?.hostname ?? '');
  const [wifiSsid, setWifiSsid] = useState(miner?.ssid ?? '');
  const [wifiPassword, setWifiPassword] = useState('');

  // Pool form state
  const [primaryPoolKey, setPrimaryPoolKey] = useState('');
  const [fallbackPoolKey, setFallbackPoolKey] = useState('');
  const [primaryCustomURL, setPrimaryCustomURL] = useState('');
  const [fallbackCustomURL, setFallbackCustomURL] = useState('');
  const [primaryStratumPort, setPrimaryStratumPort] = useState(miner?.stratumPort ?? DEFAULT_STRATUM_PORT);
  const [fallbackStratumPort, setFallbackStratumPort] = useState(miner?.fallbackStratumPort ?? DEFAULT_STRATUM_PORT);
  const [primaryPassword, setPrimaryPassword] = useState(miner?.stratumPassword ?? '');
  const [fallbackPassword, setFallbackPassword] = useState(miner?.fallbackStratumPassword ?? '');
  const [primaryStratumUser, setPrimaryStratumUser] = useState(miner?.stratumUser ?? '');
  const [fallbackStratumUser, setFallbackStratumUser] = useState(miner?.fallbackStratumUser ?? '');
  const [poolMode, setPoolMode] = useState('failover');
  const [stratumTcpKeepalive, setStratumTcpKeepalive] = useState(toBool(miner?.stratum_keep, miner?.stratumTcpKeepalive));
  const [primaryTLS, setPrimaryTLS] = useState(toBool(miner?.stratumTLS));
  const [fallbackTLS, setFallbackTLS] = useState(toBool(miner?.fallbackStratumTLS));
  const [primaryExtranonceSubscribe, setPrimaryExtranonceSubscribe] = useState(toBool(miner?.stratumEnonceSubscribe, miner?.stratumExtranonceSubscribe));
  const [fallbackExtranonceSubscribe, setFallbackExtranonceSubscribe] = useState(toBool(miner?.fallbackStratumEnonceSubscribe, miner?.fallbackStratumExtranonceSubscribe));
  const { collapsed: wifiCollapsed, toggleCollapsed: toggleWifiCollapsed } = useChartCollapsed(SETTINGS_WIFI_COLLAPSED);

  // Settings sub-tabs: Miner | Pools | Dashboard (synced with URL ?tab=settings&section=...)
  const [settingsSubTab, setSettingsSubTab] = useState(getSettingsSectionFromUrl);

  useEffect(() => {
    const onPopState = () => setSettingsSubTab(getSettingsSectionFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Dashboard config (server-persisted; can be edited even when miner is offline)
  const { config, refetch: refetchConfig } = useConfig();
  const [savingDashboard, setSavingDashboard] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState(null);
  const [dashboardMinerIp, setDashboardMinerIp] = useState(config.minerIp);
  const [dashboardExpectedHashrate, setDashboardExpectedHashrate] = useState(config.defaultExpectedHashrateGh);
  const [dashboardPollMiner, setDashboardPollMiner] = useState(config.pollMinerIntervalMs);
  const [dashboardPollNetwork, setDashboardPollNetwork] = useState(config.pollNetworkIntervalMs);
  const [dashboardAccentColor, setDashboardAccentColor] = useState(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
  const [dashboardChartColors, setDashboardChartColors] = useState(() =>
    deepCopyChartColors(config.chartColors)
  );
  const [dashboardMetricRanges, setDashboardMetricRanges] = useState(() =>
    deepCopyMetricRanges(config.metricRanges)
  );
  const [showResetDashboardConfirm, setShowResetDashboardConfirm] = useState(false);
  useEffect(() => {
    setDashboardMinerIp(config.minerIp);
    setDashboardExpectedHashrate(config.defaultExpectedHashrateGh);
    setDashboardPollMiner(config.pollMinerIntervalMs);
    setDashboardPollNetwork(config.pollNetworkIntervalMs);
    setDashboardAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setDashboardChartColors(deepCopyChartColors(config.chartColors));
    setDashboardMetricRanges(deepCopyMetricRanges(config.metricRanges));
  }, [config]);

  // Sync form when miner data updates
  useEffect(() => {
    if (!miner) return;
    setFrequency(miner.frequency ?? 600);
    setCoreVoltage(miner.coreVoltage ?? miner.defaultCoreVoltage ?? 1150);
    setOverheatTemp(miner.overheat_temp ?? 70);
    setFanAuto(!!(miner.autofanspeed != null && miner.autofanspeed !== 0));
    setPidTargetTemp(miner.pidTargetTemp ?? 55);
    setManualFanSpeed(miner.manualFanSpeed ?? 100);
    setAutoScreenOff(toBool(miner.autoscreenoff));
    setFlipScreen(toBool(miner.flipscreen));
    setHostname(miner.hostname ?? '');
    setWifiSsid(miner.ssid ?? '');
    setPrimaryStratumPort(miner.stratumPort ?? DEFAULT_STRATUM_PORT);
    setFallbackStratumPort(miner.fallbackStratumPort ?? DEFAULT_STRATUM_PORT);
    setPrimaryPassword(miner.stratumPassword ?? '');
    setFallbackPassword(miner.fallbackStratumPassword ?? '');
    setPrimaryStratumUser(miner.stratumUser ?? '');
    setFallbackStratumUser(miner.fallbackStratumUser ?? '');
    const primaryOpt = findSoloPoolOption(miner.stratumURL, miner.stratumPort);
    setPrimaryPoolKey(
      primaryOpt?.identifier ?? (miner.stratumURL ? 'other' : (SOLO_POOLS[0]?.identifier ?? ''))
    );
    setPrimaryCustomURL(primaryOpt ? '' : (miner.stratumURL ?? ''));
    const fallbackOpt = findSoloPoolOption(miner.fallbackStratumURL, miner.fallbackStratumPort);
    setFallbackPoolKey(
      fallbackOpt?.identifier ?? (miner.fallbackStratumURL ? 'other' : '')
    );
    setFallbackCustomURL(fallbackOpt ? '' : (miner.fallbackStratumURL ?? ''));
    const mode = miner.poolMode != null ? String(miner.poolMode).toLowerCase() : 'failover';
    setPoolMode(mode === 'dual' ? 'dual' : 'failover');
    setStratumTcpKeepalive(toBool(miner.stratum_keep, miner.stratumTcpKeepalive));
    setPrimaryTLS(toBool(miner.stratumTLS));
    setFallbackTLS(toBool(miner.fallbackStratumTLS));
    setPrimaryExtranonceSubscribe(toBool(miner.stratumEnonceSubscribe, miner.stratumExtranonceSubscribe));
    setFallbackExtranonceSubscribe(toBool(miner.fallbackStratumEnonceSubscribe, miner.fallbackStratumExtranonceSubscribe));
  }, [miner]);

  // Fetch ASIC options (frequency/voltage dropdowns)
  useEffect(() => {
    let cancelled = false;
    fetchMinerAsic()
      .then((data) => { if (!cancelled) setAsic(data); })
      .catch(() => { if (!cancelled) setAsic(null); });
    return () => { cancelled = true; };
  }, []);

  // Min/max and options from ASIC API (GET /api/miner/asic → miner /api/system/asic).
  // See server/routes/miner.js for expected response: frequencyOptions, voltageOptions,
  // defaultFrequency, defaultVoltage, absMinFrequency, absMaxFrequency, absMinVoltage, absMaxVoltage.
  const officialFreq = asic?.frequencyOptions ?? (miner?.defaultFrequency != null ? [miner.defaultFrequency] : []);
  const officialVolt = asic?.voltageOptions ?? (miner?.defaultCoreVoltage != null ? [miner.defaultCoreVoltage] : []);
  const defaultFreq = asic?.defaultFrequency ?? miner?.defaultFrequency;
  const defaultVolt = asic?.defaultVoltage ?? miner?.defaultCoreVoltage;
  const absMinFreq = asic?.absMinFrequency;
  const absMaxFreq = asic?.absMaxFrequency;                                    // e.g. 800 (MHz)
  const absMinVolt = asic?.absMinVoltage;
  const absMaxVolt = asic?.absMaxVoltage ?? 1200;                              // e.g. 1200 or 1400 (mV), fallback for older API

  // Frequency: official options + 25 MHz steps from board min to board max (when provided), plus current value
  const extendedFreq = new Set(officialFreq);
  const freqRangeStart = absMinFreq != null ? absMinFreq : 625;
  if (absMaxFreq != null) {
    for (let f = freqRangeStart; f <= absMaxFreq; f += 25) extendedFreq.add(f);
  }
  extendedFreq.add(frequency);
  const frequencyOptions = [...extendedFreq].sort((a, b) => a - b);

  // Voltage: official + 50 mV steps from board min to max (like frequency), plus current value
  const VOLTAGE_STEP_MV = 50;
  const extendedVolt = new Set([...officialVolt, coreVoltage, absMaxVolt, ...(absMinVolt != null ? [absMinVolt] : [])]);
  const voltRangeStart = absMinVolt ?? (officialVolt.length ? Math.min(...officialVolt) : 1000);
  if (absMaxVolt != null) {
    for (let v = voltRangeStart; v <= absMaxVolt; v += VOLTAGE_STEP_MV) extendedVolt.add(v);
  }
  const voltageOptions = [...extendedVolt]
    .filter((v) => v <= absMaxVolt && (absMinVolt == null || v >= absMinVolt))
    .sort((a, b) => a - b);

  // Warn when frequency/voltage combination is risky (high freq + low volt, or low freq + high volt)
  const frequencyVoltageWarning = useMemo(() => {
    const maxF = frequencyOptions.length ? Math.max(...frequencyOptions) : null;
    const minF = frequencyOptions.length ? Math.min(...frequencyOptions) : null;
    const maxV = voltageOptions.length ? Math.max(...voltageOptions) : null;
    const minV = voltageOptions.length ? Math.min(...voltageOptions) : null;
    if (maxF == null || minF == null || maxV == null || minV == null) return null;
    const highFreq = frequency >= maxF - 25;
    const lowFreq = frequency <= minF + 25;
    const highVolt = coreVoltage >= maxV - 50;
    const lowVolt = coreVoltage <= minV + 50;
    if (highFreq && lowVolt) {
      return 'High frequency with low voltage can cause instability or damage. Use vendor‑recommended combinations.';
    }
    if (lowFreq && highVolt) {
      return 'Low frequency with high voltage wastes power and increases heat. Prefer recommended settings.';
    }
    return null;
  }, [frequency, coreVoltage, frequencyOptions, voltageOptions]);

  const selectedFreqRef = useRef(/** @type {HTMLLabelElement | null} */(null));

  const currentFreq = miner?.frequency;
  const currentVolt = miner?.coreVoltage ?? miner?.defaultCoreVoltage;
  const getFreqTag = (f) => {
    if (f === defaultFreq) return 'default';
    if (f === absMaxFreq) return 'max';
    if (absMinFreq != null && f === absMinFreq) return 'min';
    if (currentFreq != null && f === currentFreq) return 'current';
    return null;
  };
  const getVoltTag = (v) => {
    if (v === defaultVolt) return 'default';
    if (v === absMaxVolt) return 'max';
    if (absMinVolt != null && v === absMinVolt) return 'min';
    if (currentVolt != null && v === currentVolt) return 'current';
    return null;
  };

  // Scroll frequency list so the selected option is in view
  useEffect(() => {
    selectedFreqRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [frequency]);

  // Baseline from miner (current saved state) for change detection
  const baseline = useMemo(() => {
    if (!miner) return null;
    const primaryOpt = findSoloPoolOption(miner.stratumURL, miner.stratumPort);
    const fallbackOpt = findSoloPoolOption(miner.fallbackStratumURL, miner.fallbackStratumPort);
    return {
      frequency: miner.frequency ?? 600,
      coreVoltage: miner.coreVoltage ?? miner.defaultCoreVoltage ?? 1150,
      overheatTemp: miner.overheat_temp ?? 70,
      fanAuto: !!(miner.autofanspeed != null && miner.autofanspeed !== 0),
      pidTargetTemp: miner.pidTargetTemp ?? 55,
      manualFanSpeed: miner.manualFanSpeed ?? 100,
      autoScreenOff: toBool(miner.autoscreenoff),
      flipScreen: toBool(miner.flipscreen),
      hostname: miner.hostname ?? '',
      wifiSsid: miner.ssid ?? '',
      wifiPassword: '',
      primaryPoolKey: primaryOpt?.identifier ?? (miner.stratumURL ? 'other' : (SOLO_POOLS[0]?.identifier ?? '')),
      fallbackPoolKey: fallbackOpt?.identifier ?? (miner.fallbackStratumURL ? 'other' : ''),
      primaryCustomURL: primaryOpt ? '' : (miner.stratumURL ?? ''),
      fallbackCustomURL: fallbackOpt ? '' : (miner.fallbackStratumURL ?? ''),
      primaryStratumPort: miner.stratumPort ?? DEFAULT_STRATUM_PORT,
      fallbackStratumPort: miner.fallbackStratumPort ?? DEFAULT_STRATUM_PORT,
      primaryPassword: miner.stratumPassword ?? '',
      fallbackPassword: miner.fallbackStratumPassword ?? '',
      primaryStratumUser: miner.stratumUser ?? '',
      fallbackStratumUser: miner.fallbackStratumUser ?? '',
      poolMode: (() => {
        const m = miner.poolMode != null ? String(miner.poolMode).toLowerCase() : 'failover';
        return m === 'dual' ? 'dual' : 'failover';
      })(),
      stratumTcpKeepalive: toBool(miner.stratum_keep, miner.stratumTcpKeepalive),
      primaryTLS: toBool(miner.stratumTLS),
      fallbackTLS: toBool(miner.fallbackStratumTLS),
      primaryExtranonceSubscribe: toBool(miner.stratumEnonceSubscribe, miner.stratumExtranonceSubscribe),
      fallbackExtranonceSubscribe: toBool(miner.fallbackStratumEnonceSubscribe, miner.fallbackStratumExtranonceSubscribe),
    };
  }, [miner]);

  const changes = useMemo(() => {
    if (!baseline) return [];
    const list = [];
    if (frequency !== baseline.frequency) {
      list.push({ label: 'Frequency', from: `${baseline.frequency} MHz`, to: `${frequency} MHz` });
    }
    if (coreVoltage !== baseline.coreVoltage) {
      list.push({ label: 'Core voltage', from: `${baseline.coreVoltage} mV`, to: `${coreVoltage} mV` });
    }
    if (overheatTemp !== baseline.overheatTemp) {
      list.push({ label: 'Overheat limit', from: `${baseline.overheatTemp}°C`, to: `${overheatTemp}°C` });
    }
    if (fanAuto !== baseline.fanAuto) {
      list.push({ label: 'Fan mode', from: baseline.fanAuto ? 'Auto' : 'Manual', to: fanAuto ? 'Auto' : 'Manual' });
    }
    if (fanAuto && pidTargetTemp !== baseline.pidTargetTemp) {
      list.push({ label: 'PID target temp', from: `${baseline.pidTargetTemp}°C`, to: `${pidTargetTemp}°C` });
    }
    if (!fanAuto && manualFanSpeed !== baseline.manualFanSpeed) {
      list.push({ label: 'Manual fan speed', from: `${baseline.manualFanSpeed}%`, to: `${manualFanSpeed}%` });
    }
    if (autoScreenOff !== baseline.autoScreenOff) {
      list.push({ label: 'Auto screen off', from: baseline.autoScreenOff ? 'On' : 'Off', to: autoScreenOff ? 'On' : 'Off' });
    }
    if (flipScreen !== baseline.flipScreen) {
      list.push({ label: 'Flip screen', from: baseline.flipScreen ? 'On' : 'Off', to: flipScreen ? 'On' : 'Off' });
    }
    if (hostname !== baseline.hostname) {
      list.push({ label: 'Hostname', from: baseline.hostname || '—', to: hostname || '—' });
    }
    if (wifiSsid !== baseline.wifiSsid) {
      list.push({ label: 'WiFi network (SSID)', from: baseline.wifiSsid || '—', to: wifiSsid || '—' });
    }
    if (wifiPassword !== baseline.wifiPassword && wifiPassword !== '') {
      list.push({ label: 'WiFi password', from: '—', to: '•••' });
    }
    const poolLabel = (key) => (key === 'other' ? 'Other' : key === '' ? 'None' : SOLO_POOLS.find((o) => o.identifier === key)?.name ?? key);
    if (primaryPoolKey !== baseline.primaryPoolKey) {
      list.push({ label: 'Primary pool', from: poolLabel(baseline.primaryPoolKey), to: poolLabel(primaryPoolKey) });
    }
    if (fallbackPoolKey !== baseline.fallbackPoolKey) {
      list.push({ label: 'Fallback pool', from: poolLabel(baseline.fallbackPoolKey), to: poolLabel(fallbackPoolKey) });
    }
    if (primaryPoolKey === 'other' && primaryCustomURL !== baseline.primaryCustomURL) {
      list.push({ label: 'Primary pool URL', from: baseline.primaryCustomURL || '—', to: primaryCustomURL || '—' });
    }
    if (fallbackPoolKey === 'other' && fallbackCustomURL !== baseline.fallbackCustomURL) {
      list.push({ label: 'Fallback pool URL', from: baseline.fallbackCustomURL || '—', to: fallbackCustomURL || '—' });
    }
    const getStratumUrl = (poolKey, customURL, port, tls) => {
      if (!poolKey) return '—';
      const scheme = tls ? 'stratum+ssl://' : 'stratum+tcp://';
      if (poolKey === 'other') {
        const host = (customURL || '').trim();
        return host ? `${scheme}${host}:${port}` : '—';
      }
      const opt = SOLO_POOLS.find((o) => o.identifier === poolKey);
      return opt ? `${scheme}${opt.stratumHost}:${port}` : '—';
    };
    const primaryUrlBaseline = getStratumUrl(baseline.primaryPoolKey, baseline.primaryCustomURL, baseline.primaryStratumPort, baseline.primaryTLS);
    const primaryUrlNow = getStratumUrl(primaryPoolKey, primaryCustomURL, primaryStratumPort, primaryTLS);
    if (primaryUrlNow !== primaryUrlBaseline) {
      list.push({ label: 'Primary stratum URL', from: primaryUrlBaseline, to: primaryUrlNow });
    }
    const fallbackUrlBaseline = getStratumUrl(baseline.fallbackPoolKey, baseline.fallbackCustomURL, baseline.fallbackStratumPort, baseline.fallbackTLS);
    const fallbackUrlNow = getStratumUrl(fallbackPoolKey, fallbackCustomURL, fallbackStratumPort, fallbackTLS);
    if (fallbackUrlNow !== fallbackUrlBaseline) {
      list.push({ label: 'Fallback stratum URL', from: fallbackUrlBaseline, to: fallbackUrlNow });
    }
    if (primaryStratumPort !== baseline.primaryStratumPort) {
      list.push({ label: 'Primary port', from: String(baseline.primaryStratumPort), to: String(primaryStratumPort) });
    }
    if (fallbackStratumPort !== baseline.fallbackStratumPort) {
      list.push({ label: 'Fallback port', from: String(baseline.fallbackStratumPort), to: String(fallbackStratumPort) });
    }
    if (primaryPassword !== baseline.primaryPassword) {
      list.push({ label: 'Primary password', from: baseline.primaryPassword ? '•••' : '—', to: primaryPassword ? '•••' : '—' });
    }
    if (fallbackPassword !== baseline.fallbackPassword) {
      list.push({ label: 'Fallback password', from: baseline.fallbackPassword ? '•••' : '—', to: fallbackPassword ? '•••' : '—' });
    }
    if (primaryStratumUser !== baseline.primaryStratumUser) {
      list.push({ label: 'Primary worker', from: baseline.primaryStratumUser || '—', to: primaryStratumUser || '—' });
    }
    if (fallbackStratumUser !== baseline.fallbackStratumUser) {
      list.push({ label: 'Fallback worker', from: baseline.fallbackStratumUser || '—', to: fallbackStratumUser || '—' });
    }
    const poolModeLabel = (v) => POOL_MODE_OPTIONS.find((o) => o.value === v)?.label ?? v;
    if (poolMode !== baseline.poolMode) {
      list.push({ label: 'Pool mode', from: poolModeLabel(baseline.poolMode), to: poolModeLabel(poolMode) });
    }
    if (stratumTcpKeepalive !== baseline.stratumTcpKeepalive) {
      list.push({ label: 'Stratum TCP Keepalive', from: baseline.stratumTcpKeepalive ? 'On' : 'Off', to: stratumTcpKeepalive ? 'On' : 'Off' });
    }
    if (primaryTLS !== baseline.primaryTLS) {
      list.push({ label: 'Primary TLS', from: baseline.primaryTLS ? 'On' : 'Off', to: primaryTLS ? 'On' : 'Off' });
    }
    if (fallbackTLS !== baseline.fallbackTLS) {
      list.push({ label: 'Fallback TLS', from: baseline.fallbackTLS ? 'On' : 'Off', to: fallbackTLS ? 'On' : 'Off' });
    }
    if (primaryExtranonceSubscribe !== baseline.primaryExtranonceSubscribe) {
      list.push({ label: 'Primary Extranonce Subscribe', from: baseline.primaryExtranonceSubscribe ? 'On' : 'Off', to: primaryExtranonceSubscribe ? 'On' : 'Off' });
    }
    if (fallbackExtranonceSubscribe !== baseline.fallbackExtranonceSubscribe) {
      list.push({ label: 'Fallback Extranonce Subscribe', from: baseline.fallbackExtranonceSubscribe ? 'On' : 'Off', to: fallbackExtranonceSubscribe ? 'On' : 'Off' });
    }
    return list;
  }, [baseline, frequency, coreVoltage, overheatTemp, fanAuto, pidTargetTemp, manualFanSpeed, autoScreenOff, flipScreen, hostname, wifiSsid, wifiPassword, primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryPassword, fallbackPassword, primaryStratumUser, fallbackStratumUser, poolMode, stratumTcpKeepalive, primaryTLS, fallbackTLS, primaryExtranonceSubscribe, fallbackExtranonceSubscribe]);

  const hasChanges = changes.length > 0;

  // Auto-dismiss success message after a short delay
  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), SUCCESS_MESSAGE_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  const handleReset = useCallback(() => {
    if (!baseline) return;
    setFrequency(baseline.frequency);
    setCoreVoltage(baseline.coreVoltage);
    setOverheatTemp(baseline.overheatTemp);
    setFanAuto(baseline.fanAuto);
    setPidTargetTemp(baseline.pidTargetTemp);
    setManualFanSpeed(baseline.manualFanSpeed);
    setAutoScreenOff(baseline.autoScreenOff);
    setFlipScreen(baseline.flipScreen);
    setHostname(baseline.hostname);
    setWifiSsid(baseline.wifiSsid);
    setWifiPassword(baseline.wifiPassword);
    setPrimaryPoolKey(baseline.primaryPoolKey);
    setFallbackPoolKey(baseline.fallbackPoolKey);
    setPrimaryCustomURL(baseline.primaryCustomURL);
    setFallbackCustomURL(baseline.fallbackCustomURL);
    setPrimaryStratumPort(baseline.primaryStratumPort);
    setFallbackStratumPort(baseline.fallbackStratumPort);
    setPrimaryPassword(baseline.primaryPassword);
    setFallbackPassword(baseline.fallbackPassword);
    setPrimaryStratumUser(baseline.primaryStratumUser);
    setFallbackStratumUser(baseline.fallbackStratumUser);
    setPoolMode(baseline.poolMode);
    setStratumTcpKeepalive(baseline.stratumTcpKeepalive);
    setPrimaryTLS(baseline.primaryTLS);
    setFallbackTLS(baseline.fallbackTLS);
    setPrimaryExtranonceSubscribe(baseline.primaryExtranonceSubscribe);
    setFallbackExtranonceSubscribe(baseline.fallbackExtranonceSubscribe);
  }, [baseline]);

  // Centralized validation: single source of truth for form validity and inline errors
  const { validationErrors, isFormValid } = useMemo(() => {
    const errors = [];
    // Numeric ranges (Temperature & Fan)
    const overheatNum = Number(overheatTemp);
    if (!Number.isFinite(overheatNum) || overheatNum < 50 || overheatNum > 80) {
      errors.push({ id: 'overheatTemp', message: `Overheat limit must be between 50 and 80°C` });
    }
    const pidNum = Number(pidTargetTemp);
    if (!Number.isFinite(pidNum) || pidNum < 40 || pidNum > 75) {
      errors.push({ id: 'pidTargetTemp', message: `PID target temperature must be between 40 and 75°C` });
    }
    const fanNum = Number(manualFanSpeed);
    if (!Number.isFinite(fanNum) || fanNum < 0 || fanNum > 100) {
      errors.push({ id: 'manualFanSpeed', message: `Manual fan speed must be between 0 and 100%` });
    }
    // Pool – Primary custom URL
    if (primaryPoolKey === 'other') {
      const url = primaryCustomURL.trim();
      if (!url) {
        errors.push({ id: 'primaryCustomURL', message: 'Enter a pool URL for Primary pool.' });
      } else if (url.length > MAX_STRATUM_URL_LENGTH) {
        errors.push({ id: 'primaryCustomURL', message: `Pool URL must be at most ${MAX_STRATUM_URL_LENGTH} characters` });
      }
    }
    // Pool – Fallback custom URL
    if (fallbackPoolKey === 'other') {
      const url = fallbackCustomURL.trim();
      if (!url) {
        errors.push({ id: 'fallbackCustomURL', message: 'Enter a pool URL for Fallback pool, or set Pool to None.' });
      } else if (url.length > MAX_STRATUM_URL_LENGTH) {
        errors.push({ id: 'fallbackCustomURL', message: `Pool URL must be at most ${MAX_STRATUM_URL_LENGTH} characters` });
      }
    }
    // Pool – Ports
    const primaryPortNum = Number(primaryStratumPort);
    if (!Number.isFinite(primaryPortNum) || primaryPortNum < MIN_STRATUM_PORT || primaryPortNum > MAX_STRATUM_PORT) {
      errors.push({ id: 'primaryStratumPort', message: `Primary port must be between ${MIN_STRATUM_PORT} and ${MAX_STRATUM_PORT}` });
    }
    const fallbackPortNum = Number(fallbackStratumPort);
    if (!Number.isFinite(fallbackPortNum) || fallbackPortNum < MIN_STRATUM_PORT || fallbackPortNum > MAX_STRATUM_PORT) {
      errors.push({ id: 'fallbackStratumPort', message: `Fallback port must be between ${MIN_STRATUM_PORT} and ${MAX_STRATUM_PORT}` });
    }
    // Pool – Stratum user length
    if (primaryStratumUser.length > MAX_STRATUM_USER_LENGTH) {
      errors.push({ id: 'primaryStratumUser', message: `Primary worker: max ${MAX_STRATUM_USER_LENGTH} characters` });
    }
    if (fallbackStratumUser.length > MAX_STRATUM_USER_LENGTH) {
      errors.push({ id: 'fallbackStratumUser', message: `Fallback worker: max ${MAX_STRATUM_USER_LENGTH} characters` });
    }
    // Pool – Password length
    if (primaryPassword.length > MAX_STRATUM_PASSWORD_LENGTH) {
      errors.push({ id: 'primaryPassword', message: `Primary password: max ${MAX_STRATUM_PASSWORD_LENGTH} characters` });
    }
    if (fallbackPassword.length > MAX_STRATUM_PASSWORD_LENGTH) {
      errors.push({ id: 'fallbackPassword', message: `Fallback password: max ${MAX_STRATUM_PASSWORD_LENGTH} characters` });
    }
    // WiFi – hostname (alphanumeric and hyphens, max 64)
    if (hostname.trim().length > 0) {
      if (hostname.length > MAX_HOSTNAME_LENGTH) {
        errors.push({ id: 'hostname', message: `Hostname: max ${MAX_HOSTNAME_LENGTH} characters` });
      } else if (!/^[a-zA-Z0-9-]+$/.test(hostname.trim())) {
        errors.push({ id: 'hostname', message: 'Hostname: alphanumeric and hyphens only' });
      }
    }
    if (wifiSsid.length > MAX_WIFI_SSID_LENGTH) {
      errors.push({ id: 'wifiSsid', message: `WiFi network: max ${MAX_WIFI_SSID_LENGTH} characters` });
    }
    if (wifiPassword.length > 0 && (wifiPassword.length < MIN_WIFI_PASSWORD_LENGTH || wifiPassword.length > MAX_WIFI_PASSWORD_LENGTH)) {
      errors.push({ id: 'wifiPassword', message: `WiFi password: ${MIN_WIFI_PASSWORD_LENGTH}–${MAX_WIFI_PASSWORD_LENGTH} characters when set` });
    }
    return {
      validationErrors: errors,
      isFormValid: errors.length === 0,
    };
  }, [overheatTemp, pidTargetTemp, manualFanSpeed, primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryStratumUser, fallbackStratumUser, primaryPassword, fallbackPassword, hostname, wifiSsid, wifiPassword]);

  // Derived per-field values for inline UI (driven from centralized validation)
  const primaryStratumUserError = validationErrors.find((e) => e.id === 'primaryStratumUser')?.message ?? null;
  const fallbackStratumUserError = validationErrors.find((e) => e.id === 'fallbackStratumUser')?.message ?? null;
  const primaryPortValid = !validationErrors.some((e) => e.id === 'primaryStratumPort');
  const fallbackPortValid = !validationErrors.some((e) => e.id === 'fallbackStratumPort');
  const primaryCustomURLError = validationErrors.find((e) => e.id === 'primaryCustomURL')?.message ?? null;
  const fallbackCustomURLError = validationErrors.find((e) => e.id === 'fallbackCustomURL')?.message ?? null;
  const primaryPasswordError = validationErrors.find((e) => e.id === 'primaryPassword')?.message ?? null;
  const fallbackPasswordError = validationErrors.find((e) => e.id === 'fallbackPassword')?.message ?? null;
  const overheatTempError = validationErrors.find((e) => e.id === 'overheatTemp')?.message ?? null;
  const pidTargetTempError = validationErrors.find((e) => e.id === 'pidTargetTemp')?.message ?? null;
  const manualFanSpeedError = validationErrors.find((e) => e.id === 'manualFanSpeed')?.message ?? null;
  const hostnameError = validationErrors.find((e) => e.id === 'hostname')?.message ?? null;
  const wifiSsidError = validationErrors.find((e) => e.id === 'wifiSsid')?.message ?? null;
  const wifiPasswordError = validationErrors.find((e) => e.id === 'wifiPassword')?.message ?? null;

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!isFormValid) {
      setMessage({ type: 'error', text: validationErrors[0].message });
      return;
    }
    setSaving(true);
    try {
      const primaryOpt = primaryPoolKey && primaryPoolKey !== 'other'
        ? SOLO_POOLS.find((o) => o.identifier === primaryPoolKey)
        : null;
      const fallbackOpt = fallbackPoolKey && fallbackPoolKey !== 'other'
        ? SOLO_POOLS.find((o) => o.identifier === fallbackPoolKey)
        : null;

      const primaryPort = Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(primaryStratumPort) || DEFAULT_STRATUM_PORT));
      const fallbackPort = Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(fallbackStratumPort) || DEFAULT_STRATUM_PORT));

      const stripStratumHost = (url) => {
        const s = (url || '').trim();
        if (!s) return '';
        return s
          .replace(/^stratum\+tcp:\/\//i, '')
          .replace(/^stratum2\+tcp:\/\//i, '')
          .split(':')[0]
          .split('/')[0]
          .trim();
      };

      let poolPayload = {};
      if (primaryOpt) {
        const p = getStratumPayloadFromOption(primaryOpt);
        poolPayload = { stratumURL: p.stratumURL, stratumPort: primaryPort, stratumTLS: primaryTLS };
      } else if (primaryPoolKey === 'other') {
        poolPayload = {
          stratumURL: stripStratumHost(primaryCustomURL),
          stratumPort: primaryPort,
          stratumTLS: primaryTLS,
        };
      }
      if (fallbackPoolKey === '') {
        poolPayload.fallbackStratumURL = '';
        poolPayload.fallbackStratumPort = fallbackPort;
        poolPayload.fallbackStratumTLS = false;
      } else if (fallbackOpt) {
        const p = getStratumPayloadFromOption(fallbackOpt);
        poolPayload.fallbackStratumURL = p.stratumURL;
        poolPayload.fallbackStratumPort = fallbackPort;
        poolPayload.fallbackStratumTLS = fallbackTLS;
      } else if (fallbackPoolKey === 'other') {
        poolPayload.fallbackStratumURL = stripStratumHost(fallbackCustomURL);
        poolPayload.fallbackStratumPort = fallbackPort;
        poolPayload.fallbackStratumTLS = fallbackTLS;
      }
      poolPayload.stratumEnonceSubscribe = primaryExtranonceSubscribe;
      poolPayload.fallbackStratumEnonceSubscribe = fallbackExtranonceSubscribe;
      poolPayload.stratumUser = primaryStratumUser.trim();
      poolPayload.fallbackStratumUser = fallbackStratumUser.trim();
      poolPayload.stratumPassword = primaryPassword.trim();
      poolPayload.fallbackStratumPassword = fallbackPassword.trim();
      poolPayload.poolMode = poolMode;
      poolPayload.stratum_keep = stratumTcpKeepalive;

      const wifiPayload = {
        hostname: hostname.trim(),
        ssid: wifiSsid.trim(),
        ...(wifiPassword.length > 0 ? { wifiPass: wifiPassword } : {}),
      };

      await patchMinerSettings({
        frequency: Number(frequency),
        coreVoltage: Number(coreVoltage),
        overheat_temp: Number(overheatTemp),
        autofanspeed: fanAuto ? 2 : 0,
        ...(fanAuto ? { pidTargetTemp: Number(pidTargetTemp) } : { manualFanSpeed: Number(manualFanSpeed) }),
        autoscreenoff: autoScreenOff,
        flipscreen: flipScreen,
        ...wifiPayload,
        ...poolPayload,
      });
      setMessage({ type: 'success', text: 'Settings saved.' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Really restart the miner? It will disconnect briefly.')) return;
    setMessage(null);
    setRestarting(true);
    try {
      await restartMiner();
      setMessage({ type: 'success', text: 'Miner restarting…' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestarting(false);
    }
  };

  const handleShutdown = async () => {
    if (!confirm('Shutdown the miner? It will stop hashing and disconnect. You will need to power it back on manually.')) return;
    setMessage(null);
    setShuttingDown(true);
    try {
      await shutdownMiner();
      setMessage({ type: 'success', text: 'Miner shutting down…' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setShuttingDown(false);
    }
  };

  const hasMetricRangesChange =
    JSON.stringify(dashboardMetricRanges) !== JSON.stringify(config.metricRanges);
  const hasChartColorsChange =
    JSON.stringify(dashboardChartColors) !== JSON.stringify(config.chartColors ?? DASHBOARD_DEFAULTS.chartColors);

  const effectiveAccent = normalizeHex(dashboardAccentColor, DASHBOARD_DEFAULTS.accentColor);
  const configAccent = normalizeHex(config.accentColor ?? '', DASHBOARD_DEFAULTS.accentColor);
  const hasDashboardChanges =
    dashboardMinerIp !== config.minerIp ||
    dashboardExpectedHashrate !== config.defaultExpectedHashrateGh ||
    dashboardPollMiner !== config.pollMinerIntervalMs ||
    dashboardPollNetwork !== config.pollNetworkIntervalMs ||
    effectiveAccent !== configAccent ||
    hasChartColorsChange ||
    hasMetricRangesChange;

  const defaultAccent = normalizeHex(DASHBOARD_DEFAULTS.accentColor, DASHBOARD_DEFAULTS.accentColor);
  const hasDashboardDefaultsDiff =
    dashboardExpectedHashrate !== DASHBOARD_DEFAULTS.defaultExpectedHashrateGh ||
    dashboardPollMiner !== DASHBOARD_DEFAULTS.pollMinerIntervalMs ||
    dashboardPollNetwork !== DASHBOARD_DEFAULTS.pollNetworkIntervalMs ||
    effectiveAccent !== defaultAccent ||
    JSON.stringify(dashboardChartColors) !== JSON.stringify(DASHBOARD_DEFAULTS.chartColors) ||
    JSON.stringify(dashboardMetricRanges) !== JSON.stringify(DASHBOARD_DEFAULTS.metricRanges);

  const dashboardChanges = useMemo(() => {
    const list = [];
    if (dashboardMinerIp !== config.minerIp) {
      list.push({ label: 'Miner IP', from: config.minerIp || '—', to: dashboardMinerIp.trim() || '—' });
    }
    if (dashboardExpectedHashrate !== config.defaultExpectedHashrateGh) {
      list.push({ label: 'Expected hashrate', from: `${config.defaultExpectedHashrateGh} GH/s`, to: `${dashboardExpectedHashrate} GH/s` });
    }
    if (dashboardPollMiner !== config.pollMinerIntervalMs) {
      list.push({ label: 'Miner poll interval', from: `${config.pollMinerIntervalMs} ms`, to: `${dashboardPollMiner} ms` });
    }
    if (dashboardPollNetwork !== config.pollNetworkIntervalMs) {
      list.push({ label: 'Network poll interval', from: `${config.pollNetworkIntervalMs} ms`, to: `${dashboardPollNetwork} ms` });
    }
    if (effectiveAccent !== configAccent) {
      list.push({ label: 'Accent color', from: configAccent, to: effectiveAccent });
    }
    if (hasChartColorsChange) {
      const saved = config.chartColors ?? DASHBOARD_DEFAULTS.chartColors;
      CHART_COLOR_SPEC.forEach((chart) => {
        chart.series.forEach(({ key, label: seriesLabel }) => {
          const fromVal = saved[chart.id]?.[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
          const toVal = dashboardChartColors[chart.id]?.[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key];
          const fromHex = normalizeHex(fromVal, DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key]);
          const toHex = normalizeHex(toVal, DASHBOARD_DEFAULTS.chartColors[chart.id]?.[key]);
          if (fromHex !== toHex) {
            list.push({ label: `${chart.label} → ${seriesLabel}`, from: fromHex, to: toHex });
          }
        });
      });
    }
    if (hasMetricRangesChange) {
      const saved = config.metricRanges ?? DASHBOARD_DEFAULTS.metricRanges;
      Object.keys(DASHBOARD_DEFAULTS.metricRanges).forEach((metric) => {
        const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
        keys.forEach((key) => {
          const fromVal = saved[metric]?.[key];
          const toVal = dashboardMetricRanges[metric]?.[key];
          if (fromVal !== toVal && (fromVal !== undefined || toVal !== undefined)) {
            const metricLabel = METRIC_LABELS[metric] ?? metric;
            const keyLabel = METRIC_KEY_LABELS[key] ?? key;
            list.push({
              label: `${metricLabel} → ${keyLabel}`,
              from: fromVal !== undefined ? String(fromVal) : '—',
              to: toVal !== undefined ? String(toVal) : '—',
            });
          }
        });
      });
    }
    return list;
  }, [config.minerIp, config.defaultExpectedHashrateGh, config.pollMinerIntervalMs, config.pollNetworkIntervalMs, config.chartColors, config.metricRanges, configAccent, dashboardMinerIp, dashboardExpectedHashrate, dashboardPollMiner, dashboardPollNetwork, dashboardChartColors, dashboardMetricRanges, effectiveAccent, hasChartColorsChange, hasMetricRangesChange]);

  const handleRevertDashboard = () => {
    setDashboardMinerIp(config.minerIp);
    setDashboardExpectedHashrate(config.defaultExpectedHashrateGh);
    setDashboardPollMiner(config.pollMinerIntervalMs);
    setDashboardPollNetwork(config.pollNetworkIntervalMs);
    setDashboardAccentColor(config.accentColor ?? DASHBOARD_DEFAULTS.accentColor);
    setDashboardChartColors(deepCopyChartColors(config.chartColors));
    setDashboardMetricRanges(deepCopyMetricRanges(config.metricRanges));
  };

  const handleSaveDashboard = async (e) => {
    e.preventDefault();
    setDashboardMessage(null);
    setSavingDashboard(true);
    try {
      const payload = {
        minerIp: dashboardMinerIp.trim(),
        defaultExpectedHashrateGh: Number(dashboardExpectedHashrate),
        pollMinerIntervalMs: Number(dashboardPollMiner),
        pollNetworkIntervalMs: Number(dashboardPollNetwork),
        accentColor: effectiveAccent,
      };
      if (hasChartColorsChange) {
        const normalized = deepCopyChartColors(DASHBOARD_DEFAULTS.chartColors);
        CHART_COLOR_SPEC.forEach(({ id }) => {
          const fromForm = dashboardChartColors[id];
          if (fromForm) {
            Object.keys(normalized[id]).forEach((k) => {
              const v = fromForm[k];
              normalized[id][k] = (v && String(v).trim()) ? normalizeHex(v, DASHBOARD_DEFAULTS.chartColors[id][k]) : DASHBOARD_DEFAULTS.chartColors[id][k];
            });
          }
        });
        payload.chartColors = normalized;
      }
      if (hasMetricRangesChange) payload.metricRanges = deepCopyMetricRanges(dashboardMetricRanges);
      await patchDashboardConfig(payload);
      await refetchConfig();
      setDashboardMessage({ type: 'success', text: 'Dashboard config saved.' });
    } catch (err) {
      setDashboardMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSavingDashboard(false);
    }
  };

  const handleResetDashboard = () => {
    // Do not reset miner IP — keep current value
    setDashboardExpectedHashrate(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh);
    setDashboardPollMiner(DASHBOARD_DEFAULTS.pollMinerIntervalMs);
    setDashboardPollNetwork(DASHBOARD_DEFAULTS.pollNetworkIntervalMs);
    setDashboardAccentColor(DASHBOARD_DEFAULTS.accentColor);
    setDashboardChartColors(deepCopyChartColors(DASHBOARD_DEFAULTS.chartColors));
    setDashboardMetricRanges(deepCopyMetricRanges(DASHBOARD_DEFAULTS.metricRanges));
    setShowResetDashboardConfirm(false);
  };

  // Auto-dismiss dashboard success message
  useEffect(() => {
    if (dashboardMessage?.type !== 'success') return;
    const t = setTimeout(() => setDashboardMessage(null), SUCCESS_MESSAGE_DISMISS_MS);
    return () => clearTimeout(t);
  }, [dashboardMessage?.type]);

  const setChartColorValue = (chartId, seriesKey, value) => {
    setDashboardChartColors((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [seriesKey]: value,
      },
    }));
  };

  const setMetricRangeValue = (metric, key, value) => {
    setDashboardMetricRanges((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [key]: value,
      },
    }));
  };

  const dashboardCard = (
    <form onSubmit={handleSaveDashboard} className="space-y-4">
      {settingsSubTab === 'dashboard' && (
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Configuration</h3>
          </div>
        </div>
        <p className="text-muted-standalone text-sm mb-6">
          Server-persisted config for dashboard.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Miner IP or hostname" hint="Address of the miner. Leave empty if using .env MINER_IP.">
            <input
              type="text"
              value={dashboardMinerIp}
              onChange={(e) => setDashboardMinerIp(e.target.value)}
              placeholder="192.168.1.3"
              className="input"
              aria-label="Miner IP"
            />
          </Field>
          <Field label="Expected hashrate (GH/s)" hint="Used for gauge and display.">
            <input
              type="number"
              min={1}
              max={100000}
              value={dashboardExpectedHashrate}
              onChange={(e) => setDashboardExpectedHashrate(Number(e.target.value) || DASHBOARD_DEFAULTS.defaultExpectedHashrateGh)}
              className="input"
              aria-label="Expected hashrate GH/s"
            />
          </Field>
          <Field label="Miner poll interval (ms)" hint="How often to fetch miner status.">
            <input
              type="number"
              min={1000}
              max={300000}
              value={dashboardPollMiner}
              onChange={(e) => setDashboardPollMiner(Number(e.target.value) || DASHBOARD_DEFAULTS.pollMinerIntervalMs)}
              className="input"
              aria-label="Miner poll interval ms"
            />
          </Field>
          <Field label="Network poll interval (ms)" hint="How often to fetch network stats.">
            <input
              type="number"
              min={5000}
              max={600000}
              value={dashboardPollNetwork}
              onChange={(e) => setDashboardPollNetwork(Number(e.target.value) || DASHBOARD_DEFAULTS.pollNetworkIntervalMs)}
              className="input"
              aria-label="Network poll interval ms"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-body mb-1 mt-8">Metric ranges</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(DASHBOARD_DEFAULTS.metricRanges).map((metric) => {
                const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
                const values = dashboardMetricRanges[metric] ?? {};
                return (
                  <div key={metric} className="border border-edge dark:border-edge-dark rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-body capitalize">
                      {METRIC_LABELS[metric] ?? metric}
                    </p>
                    {keys.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="text-xs text-muted shrink-0 min-w-[100px]" htmlFor={`metric-${metric}-${key}`}>
                          {METRIC_KEY_LABELS[key] ?? key}
                        </label>
                        <input
                          id={`metric-${metric}-${key}`}
                          type="number"
                          step={key.includes('Mv') || key.includes('Pct') ? 1 : 0.1}
                          value={values[key] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') return;
                            const num = Number(v);
                            if (!Number.isNaN(num)) setMetricRangeValue(metric, key, num);
                          }}
                          className="input text-sm w-24"
                          aria-label={`${METRIC_LABELS[metric] ?? metric} ${METRIC_KEY_LABELS[key] ?? key}`}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="text-muted-standalone text-xs my-3 space-y-1.5">
              <span className="block"><strong>Gauge max:</strong> value that maps to 100% on the needle (the scale).</span>
              <span className="block"><strong>Min:</strong> lower bound for "higher is better" (hashrate, frequency).</span>
              <span className="block"><strong>Max:</strong> upper bound for "lower is better" (temp, power, efficiency, current).</span>
              <span className="block"><strong>Max (mV):</strong> allowed voltage deviation from set.</span>
            </p>
          </div>
        </div>
      </div>
      )}

      {settingsSubTab === 'colors' && (
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Colors</h3>
          </div>
        </div>
        <p className="text-muted-standalone text-sm mb-4">
          Custom accent and chart line colors.
        </p>
        <div className="space-y-4">
          <Field label="Accent color" hint="Buttons, links, and highlights. Darker shade is derived automatically.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={effectiveAccent}
                onChange={(e) => setDashboardAccentColor(e.target.value)}
                className="w-10 h-10 rounded border border-edge dark:border-edge-dark cursor-pointer bg-transparent"
                aria-label="Accent color picker"
              />
              <input
                type="text"
                value={dashboardAccentColor}
                onChange={(e) => setDashboardAccentColor(e.target.value)}
                placeholder={DASHBOARD_DEFAULTS.accentColor}
                className="input flex-1 min-w-0 font-mono text-sm"
                aria-label="Accent color hex"
              />
            </div>
          </Field>
          <div>
            <p className="text-sm font-medium text-body mb-1">Chart colors</p>
            <p className="text-muted-standalone text-xs mb-3">Line colors for Power, Temperature, and Hashrate charts.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHART_COLOR_SPEC.map((chart) => {
                const chartColors = dashboardChartColors[chart.id] ?? DASHBOARD_DEFAULTS.chartColors[chart.id];
                return (
                  <div key={chart.id} className="border border-edge dark:border-edge-dark rounded-lg p-3 space-y-3">
                    <p className="text-sm font-medium text-body">{chart.label}</p>
                    {chart.series.map(({ key, label }) => {
                      const value = chartColors[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id][key];
                      const effective = normalizeHex(value, DASHBOARD_DEFAULTS.chartColors[chart.id][key]);
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={effective}
                            onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                            className="w-8 h-8 rounded border border-edge dark:border-edge-dark cursor-pointer bg-transparent shrink-0"
                            aria-label={`${chart.label} ${label} color`}
                          />
                          <label className="text-xs text-muted shrink-0 min-w-16" htmlFor={`chart-${chart.id}-${key}`}>
                            {label}
                          </label>
                          <input
                            id={`chart-${chart.id}-${key}`}
                            type="text"
                            value={chartColors[key] ?? ''}
                            onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                            placeholder={DASHBOARD_DEFAULTS.chartColors[chart.id][key]}
                            className="input text-sm flex-1 min-w-0 font-mono"
                            aria-label={`${chart.label} ${label} hex`}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {hasDashboardChanges && (
        <div className="highlight-box">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="label font-semibold text-body">Pending changes</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRevertDashboard}
                className="link-text text-body cursor-pointer"
              >
                Reset
              </button>
              <span className="text-muted-standalone">/</span>
              <button
                type="button"
                onClick={() => setShowResetDashboardConfirm(true)}
                disabled={!hasDashboardDefaultsDiff}
                className="link-text text-body cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                aria-disabled={!hasDashboardDefaultsDiff}
              >
                Reset to defaults
              </button>
            </div>
          </div>
          <ul className="text-sm text-body space-y-1">
            {dashboardChanges.map((c) => (
              <li key={c.label}>
                <span className="text-muted-standalone">{c.label}:</span>{' '}
                <span className="line-through opacity-75">{c.from}</span>
                <span className="mx-1">→</span>
                <span className="text-accent font-medium">{c.to}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={savingDashboard || !hasDashboardChanges}
            className="btn-primary"
          >
            {savingDashboard ? 'Saving…' : 'Save settings'}
          </button>
          {dashboardMessage?.type === 'success' && (
            <span role="status" className="text-success dark:text-success-dark text-sm">
              {dashboardMessage.text}
            </span>
          )}
          {dashboardMessage?.type === 'error' && (
            <span role="alert" className="toast-danger inline-flex items-center gap-2 px-3 py-2">
              <span>{dashboardMessage.text}</span>
              <button type="button" onClick={() => setDashboardMessage(null)} className="link-text font-medium opacity-90 hover:opacity-100">Dismiss</button>
            </span>
          )}
        </div>
      </div>

      {showResetDashboardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="reset-dashboard-dialog-title">
          <div className="card max-w-md w-full shadow-xl">
            <h2 id="reset-dashboard-dialog-title" className="text-lg font-semibold text-body mb-2">Reset to defaults</h2>
            <p className="text-muted-standalone text-sm mb-6">Reset all dashboard settings to their default values. This only updates the form.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowResetDashboardConfirm(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleResetDashboard} className="btn-primary">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );

  const settingsTabs = [
    { id: 'miner', label: 'Miner' },
    { id: 'pools', label: 'Pools' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'colors', label: 'Colors' },
  ];

  const tabBar = (
    <nav className="flex gap-1 border-b border-edge dark:border-edge-dark pb-3 mb-4" aria-label="Settings sections">
      {settingsTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            setSettingsSubTab(tab.id);
            setSettingsSectionInUrl(tab.id);
          }}
          aria-current={settingsSubTab === tab.id ? 'page' : undefined}
          className={`btn-tab ${settingsSubTab === tab.id ? 'btn-tab-active' : 'btn-tab-inactive'}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );

  if (!miner) {
    return (
      <div className="space-y-4">
        {tabBar}
        {(settingsSubTab === 'dashboard' || settingsSubTab === 'colors') && dashboardCard}
        {settingsSubTab === 'miner' && (
          <div className="card p-8 text-center text-muted-standalone">
            Connect to the miner to change device settings. Set Miner IP in the <button type="button" onClick={() => { setSettingsSubTab('dashboard'); setSettingsSectionInUrl('dashboard'); }} className="link-text text-body cursor-pointer underline">Dashboard</button> tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'pools' && (
          <div className="card p-8 text-center text-muted-standalone">
            Connect to the miner to change pool settings. Set Miner IP in the <button type="button" onClick={() => { setSettingsSubTab('dashboard'); setSettingsSectionInUrl('dashboard'); }} className="link-text text-body cursor-pointer underline">Dashboard</button> tab if the dashboard cannot reach the miner.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabBar}
      {(settingsSubTab === 'dashboard' || settingsSubTab === 'colors') && dashboardCard}
      {(settingsSubTab === 'miner' || settingsSubTab === 'pools') && (
      <form onSubmit={handleSave} className="space-y-4">
        {settingsSubTab === 'miner' && (
        <>
        {/* ASIC */}
        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title">ASIC</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Frequency (MHz)"
              hint={absMaxFreq != null ? `Max: ${absMaxFreq} MHz` : undefined}
            >
              <div className="option-list" role="radiogroup" aria-label="Frequency (MHz)">
                {frequencyOptions.map((f) => {
                  const tag = getFreqTag(f);
                  const isSelected = frequency === f;
                  return (
                    <label
                      key={f}
                      ref={isSelected ? selectedFreqRef : undefined}
                      className={`option-row ${isSelected ? 'option-row-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={f}
                        checked={isSelected}
                        onChange={() => setFrequency(f)}
                        className="option-radio-input"
                      />
                      <span className="option-radio-dot" aria-hidden />
                      <span className="option-label">
                        {f} MHz
                        {tag && <span className="option-tag">({tag})</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Core voltage (mV)" hint={`Max: ${absMaxVolt} mV`}>
              <div className="option-list" role="radiogroup" aria-label="Core voltage (mV)">
                {voltageOptions.map((v) => {
                  const tag = getVoltTag(v);
                  const isSelected = coreVoltage === v;
                  return (
                    <label
                      key={v}
                      className={`option-row ${isSelected ? 'option-row-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="coreVoltage"
                        value={v}
                        checked={isSelected}
                        onChange={() => setCoreVoltage(v)}
                        className="option-radio-input"
                      />
                      <span className="option-radio-dot" aria-hidden />
                      <span className="option-label">
                        {v} mV
                        {tag && <span className="option-tag">({tag})</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>
          {frequencyVoltageWarning && (
            <p className="mt-3 text-warning dark:text-warning-dark text-sm" role="alert">
              {frequencyVoltageWarning}
            </p>
          )}
        </div>

        {/* Temperature & Fan | Display side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header-wrapper">
              <div className="card-header">
                <h3 className="card-header-title">Temperature & Fan</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Overheat limit (°C)" hint="Miner shuts down above this temperature.">
                <input
                  type="number"
                  min={50}
                  max={80}
                  value={overheatTemp}
                  onChange={(e) => setOverheatTemp(Math.min(80, Math.max(50, Number(e.target.value) || 50)))}
                  className={`input ${overheatTempError ? 'input-danger' : ''}`}
                  aria-invalid={!!overheatTempError}
                  aria-describedby={overheatTempError ? 'overheat-temp-error' : undefined}
                />
                {overheatTempError && (
                  <p id="overheat-temp-error" className="text-danger text-xs mt-1" role="alert">
                    {overheatTempError}
                  </p>
                )}
              </Field>
              <div className="flex flex-col gap-4">
                {fanAuto ? (
                  <Field label="PID target temperature (°C)" hint="Fan aims to keep ASIC at this temp.">
                    <input
                      type="number"
                      min={40}
                      max={75}
                      value={pidTargetTemp}
                      onChange={(e) => setPidTargetTemp(Math.min(75, Math.max(40, Number(e.target.value) || 40)))}
                      className={`input ${pidTargetTempError ? 'input-danger' : ''}`}
                      aria-invalid={!!pidTargetTempError}
                      aria-describedby={pidTargetTempError ? 'pid-target-temp-error' : undefined}
                    />
                    {pidTargetTempError && (
                      <p id="pid-target-temp-error" className="text-danger text-xs mt-1" role="alert">
                        {pidTargetTempError}
                      </p>
                    )}
                  </Field>
                ) : (
                  <Field label="Manual fan speed (%)">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={manualFanSpeed}
                      onChange={(e) => setManualFanSpeed(Number(e.target.value))}
                      className={`input-range ${manualFanSpeedError ? 'input-danger' : ''}`}
                      aria-invalid={!!manualFanSpeedError}
                      aria-describedby={manualFanSpeedError ? 'manual-fan-speed-error' : undefined}
                    />
                    <span className="text-sm text-body">{manualFanSpeed}%</span>
                    {manualFanSpeedError && (
                      <p id="manual-fan-speed-error" className="text-danger text-xs mt-1" role="alert">
                        {manualFanSpeedError}
                      </p>
                    )}
                  </Field>
                )}
                <Field label="Fan mode">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={fanAuto}
                      aria-label="Fan mode: Manual / Auto (PID)"
                      onClick={() => setFanAuto((v) => !v)}
                      className={`switch ${fanAuto ? 'switch-on' : 'switch-off'}`}
                    >
                      <span className={`switch-thumb ${fanAuto ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                    </button>
                    <span className="text-sm text-body">{fanAuto ? 'Auto (PID)' : 'Manual'}</span>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header-wrapper">
              <div className="card-header">
                <h3 className="card-header-title">Display</h3>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Automatic screen shutdown" hint="Turn off miner display after inactivity.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoScreenOff}
                    onClick={() => setAutoScreenOff((v) => !v)}
                    className={`switch ${autoScreenOff ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${autoScreenOff ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{autoScreenOff ? 'On' : 'Off'}</span>
                </div>
              </Field>
              <Field label="Flip screen" hint="Rotate display 180°.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flipScreen}
                    onClick={() => setFlipScreen((v) => !v)}
                    className={`switch ${flipScreen ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${flipScreen ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{flipScreen ? 'On' : 'Off'}</span>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* WiFi Settings */}
        <ChartCard
          title="WiFi Settings"
          loading={false}
          loadingMessage=""
          collapsed={wifiCollapsed}
          onToggleCollapsed={toggleWifiCollapsed}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hostname" hint="Device hostname on the network (alphanumeric and hyphens).">
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="bitaxe"
                maxLength={MAX_HOSTNAME_LENGTH}
                className={`input ${hostnameError ? 'input-danger' : ''}`}
                aria-label="Hostname"
                aria-invalid={!!hostnameError}
                aria-describedby={hostnameError ? 'hostname-error' : undefined}
              />
              {hostnameError && (
                <p id="hostname-error" className="text-danger text-xs mt-1" role="alert">
                  {hostnameError}
                </p>
              )}
            </Field>
            <Field label="WiFi Network (SSID)" hint="Network name to connect to.">
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="WiFi Network (SSID)"
                maxLength={MAX_WIFI_SSID_LENGTH}
                className={`input ${wifiSsidError ? 'input-danger' : ''}`}
                aria-label="WiFi Network (SSID)"
                aria-invalid={!!wifiSsidError}
                aria-describedby={wifiSsidError ? 'wifi-ssid-error' : undefined}
              />
              {wifiSsidError && (
                <p id="wifi-ssid-error" className="text-danger text-xs mt-1" role="alert">
                  {wifiSsidError}
                </p>
              )}
            </Field>
            <Field label="WiFi Password" hint="Leave blank to keep current password. When set, 8–63 characters.">
              <input
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="WiFi Password"
                maxLength={MAX_WIFI_PASSWORD_LENGTH}
                className={`input ${wifiPasswordError ? 'input-danger' : ''}`}
                aria-label="WiFi Password"
                aria-invalid={!!wifiPasswordError}
                aria-describedby={wifiPasswordError ? 'wifi-password-error' : undefined}
              />
              {wifiPasswordError && (
                <p id="wifi-password-error" className="text-danger text-xs mt-1" role="alert">
                  {wifiPasswordError}
                </p>
              )}
            </Field>
            <p className="text-muted-standalone text-xs mt-5">
              Changing the WiFi network or password can disconnect the miner from your current network. You may lose access to the dashboard until you reach the miner on its new address.
            </p>
          </div>
        </ChartCard>
        </>
        )}

        {settingsSubTab === 'pools' && (
        <>
        {/* Pools */}
        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title">Configuration</h3>
            </div>
          </div>
          <div>
          {/* Top: Pool mode + TCP Keepalive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-edge dark:border-edge-dark">
            <Field label="Pool mode" hint="Failover uses fallback when primary is down; Dual uses both pools.">
              <select
                value={poolMode}
                onChange={(e) => setPoolMode(e.target.value)}
                className="input"
                aria-label="Pool mode"
              >
                {POOL_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enable Stratum TCP Keepalive" hint="Keep stratum connection alive with periodic pings.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={stratumTcpKeepalive}
                  aria-label="Enable Stratum TCP Keepalive"
                  onClick={() => setStratumTcpKeepalive((v) => !v)}
                  className={`switch ${stratumTcpKeepalive ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${stratumTcpKeepalive ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-body">{stratumTcpKeepalive ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>

          {/* Pool 1 (left) | Pool 2 (right) with divider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 pt-4">
            <div className="flex flex-col gap-4 pr-4 md:border-r md:border-edge dark:md:border-edge-dark">
              <div className="flex items-center gap-2">
                <p className="label font-semibold text-body mb-0">
                  {poolMode === 'dual' ? 'Pool 1' : 'Pool 1 (Primary)'}
                </p>
                {!(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.stratumURL || '').trim() ? (
                  <span className="badge-success">ACTIVE</span>
                ) : null}
              </div>
              <Field label="Pool" hint="Solo mining pool for block templates.">
                <select
                  value={primaryPoolKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrimaryPoolKey(v);
                    const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                    if (opt) setPrimaryStratumPort(primaryTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
                  }}
                  className="input"
                  aria-label="Primary pool"
                >
                  {SOLO_POOLS.map((opt) => (
                    <option key={opt.identifier} value={opt.identifier}>
                      {opt.name} ({opt.stratumHost})
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </Field>
              {primaryPoolKey === 'other' && (
                <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                  <input
                    type="text"
                    value={primaryCustomURL}
                    onChange={(e) => setPrimaryCustomURL(e.target.value)}
                    placeholder="stratum.example.com"
                    className={`input ${primaryCustomURLError ? 'input-danger' : ''}`}
                    aria-label="Primary pool URL"
                    aria-invalid={!!primaryCustomURLError}
                    aria-describedby={primaryCustomURLError ? 'primary-custom-url-error' : undefined}
                  />
                  {primaryCustomURLError && (
                    <p id="primary-custom-url-error" className="text-danger text-xs mt-1" role="alert">
                      {primaryCustomURLError}
                    </p>
                  )}
                </Field>
              )}
              <Field label="Stratum port" hint={`Port 1–${MAX_STRATUM_PORT}. Usually 3333.`}>
                <input
                  type="number"
                  min={MIN_STRATUM_PORT}
                  max={MAX_STRATUM_PORT}
                  value={primaryStratumPort}
                  onChange={(e) => setPrimaryStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                  className={`input ${!primaryPortValid ? 'input-danger' : ''}`}
                  aria-invalid={!primaryPortValid}
                />
              </Field>
              <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
                <input
                  type="text"
                  value={primaryStratumUser}
                  onChange={(e) => setPrimaryStratumUser(e.target.value)}
                  placeholder="bc1q..."
                  maxLength={MAX_STRATUM_USER_LENGTH}
                  className={`input ${primaryStratumUserError ? 'input-danger' : ''}`}
                  aria-invalid={!!primaryStratumUserError}
                  aria-describedby={primaryStratumUserError ? 'primary-stratum-user-error' : undefined}
                />
                {primaryStratumUserError && (
                  <p id="primary-stratum-user-error" className="text-danger text-xs mt-1" role="alert">
                    {primaryStratumUserError}
                  </p>
                )}
              </Field>
              <Field label="Password" hint="Some devices do not return it. Leave blank to keep the current password.">
                <input
                  type="text"
                  value={primaryPassword}
                  onChange={(e) => setPrimaryPassword(e.target.value)}
                  maxLength={MAX_STRATUM_PASSWORD_LENGTH}
                  className={`input ${primaryPasswordError ? 'input-danger' : ''}`}
                  placeholder="Pool Password"
                  aria-label="Primary pool password"
                  aria-invalid={!!primaryPasswordError}
                  aria-describedby={primaryPasswordError ? 'primary-password-error' : undefined}
                />
                {primaryPasswordError && (
                  <p id="primary-password-error" className="text-danger text-xs mt-1" role="alert">
                    {primaryPasswordError}
                  </p>
                )}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Enable Extranonce Subscribe" hint="Request extranonce updates from pool.">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={primaryExtranonceSubscribe}
                      aria-label="Primary pool Enable Extranonce Subscribe"
                      onClick={() => setPrimaryExtranonceSubscribe((v) => !v)}
                      className={`switch ${primaryExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                    >
                      <span className={`switch-thumb ${primaryExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                    </button>
                    <span className="text-sm text-body">{primaryExtranonceSubscribe ? 'On' : 'Off'}</span>
                  </div>
                </Field>
                <Field label="Encrypted connection (TLS)" hint="Use TLS for primary pool.">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={primaryTLS}
                      aria-label="Primary pool Encrypted connection TLS"
                      onClick={() => {
                        const nextTLS = !primaryTLS;
                        setPrimaryTLS(nextTLS);
                        const opt = primaryPoolKey && primaryPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === primaryPoolKey) : null;
                        if (opt?.tlsPort != null) setPrimaryStratumPort(nextTLS ? opt.tlsPort : opt.port);
                      }}
                      className={`switch ${primaryTLS ? 'switch-on' : 'switch-off'}`}
                    >
                      <span className={`switch-thumb ${primaryTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                    </button>
                    <span className="text-sm text-body">{primaryTLS ? 'On' : 'Off'}</span>
                  </div>
                </Field>
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-4 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2">
                <p className="label font-semibold text-body mb-0">
                  {poolMode === 'dual' ? 'Pool 2' : 'Pool 2 (Fallback)'}
                </p>
                {(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.fallbackStratumURL || '').trim() ? (
                  <span className="badge-warning">ACTIVE</span>
                ) : null}
              </div>
              <Field label="Pool" hint="Used when primary is unreachable.">
                <select
                  value={fallbackPoolKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFallbackPoolKey(v);
                    const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                    if (opt) setFallbackStratumPort(fallbackTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
                  }}
                  className="input"
                  aria-label="Fallback pool"
                >
                  <option value="">None</option>
                  {SOLO_POOLS.map((opt) => (
                    <option key={opt.identifier} value={opt.identifier}>
                      {opt.name} ({opt.stratumHost})
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </Field>
              {fallbackPoolKey === 'other' && (
                <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                  <input
                    type="text"
                    value={fallbackCustomURL}
                    onChange={(e) => setFallbackCustomURL(e.target.value)}
                    placeholder="stratum.example.com"
                    className={`input ${fallbackCustomURLError ? 'input-danger' : ''}`}
                    aria-label="Fallback pool URL"
                    aria-invalid={!!fallbackCustomURLError}
                    aria-describedby={fallbackCustomURLError ? 'fallback-custom-url-error' : undefined}
                  />
                  {fallbackCustomURLError && (
                    <p id="fallback-custom-url-error" className="text-danger text-xs mt-1" role="alert">
                      {fallbackCustomURLError}
                    </p>
                  )}
                </Field>
              )}
              <Field label="Stratum port" hint={`Port 1–${MAX_STRATUM_PORT}. Usually 3333.`}>
                <input
                  type="number"
                  min={MIN_STRATUM_PORT}
                  max={MAX_STRATUM_PORT}
                  value={fallbackStratumPort}
                  onChange={(e) => setFallbackStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                  className={`input ${!fallbackPortValid ? 'input-danger' : ''}`}
                  aria-invalid={!fallbackPortValid}
                />
              </Field>
              <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
                <input
                  type="text"
                  value={fallbackStratumUser}
                  onChange={(e) => setFallbackStratumUser(e.target.value)}
                  placeholder="bc1q..."
                  maxLength={MAX_STRATUM_USER_LENGTH}
                  className={`input ${fallbackStratumUserError ? 'input-danger' : ''}`}
                  aria-invalid={!!fallbackStratumUserError}
                  aria-describedby={fallbackStratumUserError ? 'fallback-stratum-user-error' : undefined}
                />
                {fallbackStratumUserError && (
                  <p id="fallback-stratum-user-error" className="text-danger text-xs mt-1" role="alert">
                    {fallbackStratumUserError}
                  </p>
                )}
              </Field>
              <Field label="Password" hint="Some devices do not return it. Leave blank to keep the current password.">
                <input
                  type="text"
                  value={fallbackPassword}
                  onChange={(e) => setFallbackPassword(e.target.value)}
                  maxLength={MAX_STRATUM_PASSWORD_LENGTH}
                  className={`input ${fallbackPasswordError ? 'input-danger' : ''}`}
                  placeholder="Pool Password"
                  aria-label="Fallback pool password"
                  aria-invalid={!!fallbackPasswordError}
                  aria-describedby={fallbackPasswordError ? 'fallback-password-error' : undefined}
                />
                {fallbackPasswordError && (
                  <p id="fallback-password-error" className="text-danger text-xs mt-1" role="alert">
                    {fallbackPasswordError}
                  </p>
                )}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Enable Extranonce Subscribe" hint="Request extranonce updates from pool.">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={fallbackExtranonceSubscribe}
                      aria-label="Fallback pool Enable Extranonce Subscribe"
                      onClick={() => setFallbackExtranonceSubscribe((v) => !v)}
                      className={`switch ${fallbackExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                    >
                      <span className={`switch-thumb ${fallbackExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                    </button>
                    <span className="text-sm text-body">{fallbackExtranonceSubscribe ? 'On' : 'Off'}</span>
                  </div>
                </Field>
                <Field label="Encrypted connection (TLS)" hint="Use TLS for fallback pool.">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={fallbackTLS}
                      aria-label="Fallback pool Encrypted connection TLS"
                      onClick={() => {
                        const nextTLS = !fallbackTLS;
                        setFallbackTLS(nextTLS);
                        const opt = fallbackPoolKey && fallbackPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === fallbackPoolKey) : null;
                        if (opt?.tlsPort != null) setFallbackStratumPort(nextTLS ? opt.tlsPort : opt.port);
                      }}
                      className={`switch ${fallbackTLS ? 'switch-on' : 'switch-off'}`}
                    >
                      <span className={`switch-thumb ${fallbackTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                    </button>
                    <span className="text-sm text-body">{fallbackTLS ? 'On' : 'Off'}</span>
                  </div>
                </Field>
              </div>
            </div>
          </div>
          </div>
        </div>
        </>
        )}

        {/* Pending changes */}
        {hasChanges && (
          <div className="highlight-box">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="label font-semibold text-body">Pending changes</p>
              <button
                type="button"
                onClick={handleReset}
                className="link-text text-body cursor-pointer"
              >
                Reset
              </button>
            </div>
            <ul className="text-sm text-body space-y-1">
              {changes.map((c) => (
                <li key={c.label}>
                  <span className="text-muted-standalone">{c.label}:</span>{' '}
                  <span className="line-through opacity-75">{c.from}</span>
                  <span className="mx-1">→</span>
                  <span className="text-accent font-medium">{c.to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save (and on Miner tab: Restart & Shutdown) */}
        <div className="card">
          {settingsSubTab === 'miner' && <h3 className="card-title">Restart & Shutdown</h3>}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {hasChanges && !isFormValid && (
                <span className="text-danger text-sm" role="alert">
                  Fix the errors above to save.
                </span>
              )}
              <button
                type="submit"
                disabled={saving || !hasChanges || !isFormValid}
                className="btn-primary"
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
              {message?.type === 'success' && (
                <span role="status" className="toast-success inline-flex items-center gap-1.5 px-3 py-2">
                  <span>Saved successfully</span>
                </span>
              )}
              {message?.type === 'error' && (
                <span role="alert" className="toast-danger inline-flex items-center gap-2 px-3 py-2">
                  <span>{message.text}</span>
                  <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="link-text font-medium opacity-90 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </span>
              )}
            </div>
            {settingsSubTab === 'miner' && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRestart}
                disabled={restarting || shuttingDown}
                className="btn-ghost-accent"
              >
                {restarting ? 'Restarting…' : 'Restart miner'}
              </button>
              <button
                type="button"
                onClick={handleShutdown}
                disabled={restarting || shuttingDown}
                className="btn-ghost-accent"
              >
                {shuttingDown ? 'Shutting down…' : 'Shutdown miner'}
              </button>
            </div>
            )}
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
