import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMinerAsic, patchMinerSettings, restartMiner, shutdownMiner } from '@/lib/api';
import {
  DEFAULT_STRATUM_PORT,
  MAX_HOSTNAME_LENGTH,
  MAX_STRATUM_PASSWORD_LENGTH,
  MAX_STRATUM_PORT,
  MAX_STRATUM_URL_LENGTH,
  MAX_STRATUM_USER_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_SSID_LENGTH,
  MIN_STRATUM_PORT,
  MIN_WIFI_PASSWORD_LENGTH,
  SOLO_POOLS,
  TOAST_AUTO_DISMISS_MS,
} from '@/lib/constants';
import { toBool } from '@/lib/minerApiBools';
import { findSoloPoolOption, getStratumPayloadFromOption } from '@/lib/poolUtils';

const POOL_MODE_OPTIONS = [
  { value: 'failover', label: 'Failover (Primary/Fallback)' },
  { value: 'dual', label: 'Dual Pool' },
];

export function useMinerSettingsForm(miner, refetch, onError) {
  const [asic, setAsic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [message, setMessage] = useState(null);

  const [frequency, setFrequency] = useState(miner?.frequency ?? 600);
  const [coreVoltage, setCoreVoltage] = useState(miner?.coreVoltage ?? miner?.defaultCoreVoltage ?? 1150);
  const [overheatTemp, setOverheatTemp] = useState(miner?.overheat_temp ?? 70);
  const [fanAuto, setFanAuto] = useState(!!(miner?.autofanspeed != null && miner.autofanspeed !== 0));
  const [pidTargetTemp, setPidTargetTemp] = useState(miner?.pidTargetTemp ?? 55);
  const [manualFanSpeed, setManualFanSpeed] = useState(miner?.manualFanSpeed ?? 100);
  const [autoScreenOff, setAutoScreenOff] = useState(toBool(miner?.autoscreenoff));
  const [flipScreen, setFlipScreen] = useState(toBool(miner?.flipscreen));

  const [hostname, setHostname] = useState(miner?.hostname ?? '');
  const [wifiSsid, setWifiSsid] = useState(miner?.ssid ?? '');
  const [wifiPassword, setWifiPassword] = useState('');

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

  useEffect(() => {
    let cancelled = false;
    fetchMinerAsic()
      .then((data) => { if (!cancelled) setAsic(data); })
      .catch(() => { if (!cancelled) setAsic(null); });
    return () => { cancelled = true; };
  }, []);

  const officialFreq = asic?.frequencyOptions ?? (miner?.defaultFrequency != null ? [miner.defaultFrequency] : []);
  const officialVolt = asic?.voltageOptions ?? (miner?.defaultCoreVoltage != null ? [miner.defaultCoreVoltage] : []);
  const defaultFreq = asic?.defaultFrequency ?? miner?.defaultFrequency;
  const defaultVolt = asic?.defaultVoltage ?? miner?.defaultCoreVoltage;
  const absMinFreq = asic?.absMinFrequency;
  const absMaxFreq = asic?.absMaxFrequency;
  const absMinVolt = asic?.absMinVoltage;
  const absMaxVolt = asic?.absMaxVoltage ?? 1200;

  const extendedFreq = new Set(officialFreq);
  const freqRangeStart = absMinFreq != null ? absMinFreq : 625;
  if (absMaxFreq != null) {
    for (let f = freqRangeStart; f <= absMaxFreq; f += 25) extendedFreq.add(f);
  }
  extendedFreq.add(frequency);
  const frequencyOptions = [...extendedFreq].sort((a, b) => a - b);

  const VOLTAGE_STEP_MV = 50;
  const extendedVolt = new Set([...officialVolt, coreVoltage, absMaxVolt, ...(absMinVolt != null ? [absMinVolt] : [])]);
  const voltRangeStart = absMinVolt ?? (officialVolt.length ? Math.min(...officialVolt) : 1000);
  if (absMaxVolt != null) {
    for (let v = voltRangeStart; v <= absMaxVolt; v += VOLTAGE_STEP_MV) extendedVolt.add(v);
  }
  const voltageOptions = [...extendedVolt]
    .filter((v) => v <= absMaxVolt && (absMinVolt == null || v >= absMinVolt))
    .sort((a, b) => a - b);

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

  const selectedFreqRef = useRef(null);

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

  useEffect(() => {
    selectedFreqRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [frequency]);

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

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), TOAST_AUTO_DISMISS_MS);
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

  const { validationErrors, isFormValid } = useMemo(() => {
    const errors = [];
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
    if (primaryPoolKey === 'other') {
      const url = primaryCustomURL.trim();
      if (!url) {
        errors.push({ id: 'primaryCustomURL', message: 'Enter a pool URL for Primary pool.' });
      } else if (url.length > MAX_STRATUM_URL_LENGTH) {
        errors.push({ id: 'primaryCustomURL', message: `Pool URL must be at most ${MAX_STRATUM_URL_LENGTH} characters` });
      }
    }
    if (fallbackPoolKey === 'other') {
      const url = fallbackCustomURL.trim();
      if (!url) {
        errors.push({ id: 'fallbackCustomURL', message: 'Enter a pool URL for Fallback pool, or set Pool to None.' });
      } else if (url.length > MAX_STRATUM_URL_LENGTH) {
        errors.push({ id: 'fallbackCustomURL', message: `Pool URL must be at most ${MAX_STRATUM_URL_LENGTH} characters` });
      }
    }
    const primaryPortNum = Number(primaryStratumPort);
    if (!Number.isFinite(primaryPortNum) || primaryPortNum < MIN_STRATUM_PORT || primaryPortNum > MAX_STRATUM_PORT) {
      errors.push({ id: 'primaryStratumPort', message: `Primary port must be between ${MIN_STRATUM_PORT} and ${MAX_STRATUM_PORT}` });
    }
    const fallbackPortNum = Number(fallbackStratumPort);
    if (!Number.isFinite(fallbackPortNum) || fallbackPortNum < MIN_STRATUM_PORT || fallbackPortNum > MAX_STRATUM_PORT) {
      errors.push({ id: 'fallbackStratumPort', message: `Fallback port must be between ${MIN_STRATUM_PORT} and ${MAX_STRATUM_PORT}` });
    }
    if (primaryStratumUser.length > MAX_STRATUM_USER_LENGTH) {
      errors.push({ id: 'primaryStratumUser', message: `Primary worker: max ${MAX_STRATUM_USER_LENGTH} characters` });
    }
    if (fallbackStratumUser.length > MAX_STRATUM_USER_LENGTH) {
      errors.push({ id: 'fallbackStratumUser', message: `Fallback worker: max ${MAX_STRATUM_USER_LENGTH} characters` });
    }
    if (primaryPassword.length > MAX_STRATUM_PASSWORD_LENGTH) {
      errors.push({ id: 'primaryPassword', message: `Primary password: max ${MAX_STRATUM_PASSWORD_LENGTH} characters` });
    }
    if (fallbackPassword.length > MAX_STRATUM_PASSWORD_LENGTH) {
      errors.push({ id: 'fallbackPassword', message: `Fallback password: max ${MAX_STRATUM_PASSWORD_LENGTH} characters` });
    }
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

  const handleSave = useCallback(async (e) => {
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
  }, [isFormValid, validationErrors, primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryTLS, fallbackTLS, primaryExtranonceSubscribe, fallbackExtranonceSubscribe, primaryStratumUser, fallbackStratumUser, primaryPassword, fallbackPassword, poolMode, stratumTcpKeepalive, hostname, wifiSsid, wifiPassword, frequency, coreVoltage, overheatTemp, fanAuto, pidTargetTemp, manualFanSpeed, autoScreenOff, flipScreen, refetch, onError]);

  const handleRestart = useCallback(async () => {
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
  }, [refetch]);

  const handleShutdown = useCallback(async () => {
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
  }, [refetch]);

  const validation = {
    primaryStratumUserError: validationErrors.find((e) => e.id === 'primaryStratumUser')?.message ?? null,
    fallbackStratumUserError: validationErrors.find((e) => e.id === 'fallbackStratumUser')?.message ?? null,
    primaryPortValid: !validationErrors.some((e) => e.id === 'primaryStratumPort'),
    fallbackPortValid: !validationErrors.some((e) => e.id === 'fallbackStratumPort'),
    primaryCustomURLError: validationErrors.find((e) => e.id === 'primaryCustomURL')?.message ?? null,
    fallbackCustomURLError: validationErrors.find((e) => e.id === 'fallbackCustomURL')?.message ?? null,
    primaryPasswordError: validationErrors.find((e) => e.id === 'primaryPassword')?.message ?? null,
    fallbackPasswordError: validationErrors.find((e) => e.id === 'fallbackPassword')?.message ?? null,
    overheatTempError: validationErrors.find((e) => e.id === 'overheatTemp')?.message ?? null,
    pidTargetTempError: validationErrors.find((e) => e.id === 'pidTargetTemp')?.message ?? null,
    manualFanSpeedError: validationErrors.find((e) => e.id === 'manualFanSpeed')?.message ?? null,
    hostnameError: validationErrors.find((e) => e.id === 'hostname')?.message ?? null,
    wifiSsidError: validationErrors.find((e) => e.id === 'wifiSsid')?.message ?? null,
    wifiPasswordError: validationErrors.find((e) => e.id === 'wifiPassword')?.message ?? null,
  };

  return {
    POOL_MODE_OPTIONS,
    asic,
    saving,
    restarting,
    shuttingDown,
    message,
    setMessage,
    frequency,
    setFrequency,
    coreVoltage,
    setCoreVoltage,
    overheatTemp,
    setOverheatTemp,
    fanAuto,
    setFanAuto,
    pidTargetTemp,
    setPidTargetTemp,
    manualFanSpeed,
    setManualFanSpeed,
    autoScreenOff,
    setAutoScreenOff,
    flipScreen,
    setFlipScreen,
    hostname,
    setHostname,
    wifiSsid,
    setWifiSsid,
    wifiPassword,
    setWifiPassword,
    primaryPoolKey,
    setPrimaryPoolKey,
    fallbackPoolKey,
    setFallbackPoolKey,
    primaryCustomURL,
    setPrimaryCustomURL,
    fallbackCustomURL,
    setFallbackCustomURL,
    primaryStratumPort,
    setPrimaryStratumPort,
    fallbackStratumPort,
    setFallbackStratumPort,
    primaryPassword,
    setPrimaryPassword,
    fallbackPassword,
    setFallbackPassword,
    primaryStratumUser,
    setPrimaryStratumUser,
    fallbackStratumUser,
    setFallbackStratumUser,
    poolMode,
    setPoolMode,
    stratumTcpKeepalive,
    setStratumTcpKeepalive,
    primaryTLS,
    setPrimaryTLS,
    fallbackTLS,
    setFallbackTLS,
    primaryExtranonceSubscribe,
    setPrimaryExtranonceSubscribe,
    fallbackExtranonceSubscribe,
    setFallbackExtranonceSubscribe,
    baseline,
    changes,
    hasChanges,
    handleReset,
    validationErrors,
    isFormValid,
    validation,
    handleSave,
    handleRestart,
    handleShutdown,
    frequencyOptions,
    voltageOptions,
    getFreqTag,
    getVoltTag,
    frequencyVoltageWarning,
    selectedFreqRef,
    absMaxFreq,
    absMaxVolt,
  };
}
