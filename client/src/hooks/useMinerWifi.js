import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MAX_HOSTNAME_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_SSID_LENGTH,
  MIN_WIFI_PASSWORD_LENGTH,
} from 'shared/schemas/minerApi';
import { patchMinerSettings } from '@/lib/api';
import { MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';

export function useMinerWifi(miner, refetch, onError) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [hostname, setHostname] = useState((miner?.hostname ?? '').toLowerCase());
  const [wifiSsid, setWifiSsid] = useState(miner?.ssid ?? '');
  const [wifiPassword, setWifiPassword] = useState('');

  useEffect(() => {
    if (!miner) return;
    setHostname((miner.hostname ?? '').toLowerCase());
    setWifiSsid(miner.ssid ?? '');
  }, [miner]);

  const baseline = useMemo(() => {
    if (!miner) return null;
    return {
      hostname: miner.hostname ?? '',
      wifiSsid: miner.ssid ?? '',
      wifiPassword: '',
    };
  }, [miner]);

  const changes = useMemo(() => {
    if (!baseline) return [];
    const list = [];
    if (hostname !== baseline.hostname) {
      list.push({ label: 'Hostname', from: baseline.hostname || '—', to: hostname || '—' });
    }
    if (wifiSsid !== baseline.wifiSsid) {
      list.push({ label: 'WiFi network (SSID)', from: baseline.wifiSsid || '—', to: wifiSsid || '—' });
    }
    if (wifiPassword !== baseline.wifiPassword && wifiPassword !== '') {
      list.push({ label: 'WiFi password', from: '—', to: '•••' });
    }
    return list;
  }, [baseline, hostname, wifiSsid, wifiPassword]);

  const hasChanges = changes.length > 0;

  const revert = useCallback(() => {
    if (!baseline) return;
    setHostname((baseline.hostname ?? '').toLowerCase());
    setWifiSsid(baseline.wifiSsid);
    setWifiPassword(baseline.wifiPassword ?? '');
  }, [baseline]);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  const { validationErrors, isFormValid } = useMemo(() => {
    const errors = [];
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
  }, [hostname, wifiSsid, wifiPassword]);

  const save = useCallback(async () => {
    if (validationErrors.some((e) => ['hostname', 'wifiSsid', 'wifiPassword'].includes(e.id))) {
      setMessage({ type: 'error', text: validationErrors.find((e) => e.id === 'hostname' || e.id === 'wifiSsid' || e.id === 'wifiPassword')?.message ?? 'Fix WiFi fields.' });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      const payload = {
        hostname: hostname.trim().toLowerCase(),
        ssid: wifiSsid.trim(),
        ...(wifiPassword.length > 0 ? { wifiPass: wifiPassword } : {}),
      };
      await patchMinerSettings(payload);
      await refetch();
      setMessage({ type: 'success', text: 'WiFi saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [hostname, wifiSsid, wifiPassword, validationErrors, refetch, onError]);

  const validation = {
    hostnameError: validationErrors.find((e) => e.id === 'hostname')?.message ?? null,
    wifiSsidError: validationErrors.find((e) => e.id === 'wifiSsid')?.message ?? null,
    wifiPasswordError: validationErrors.find((e) => e.id === 'wifiPassword')?.message ?? null,
  };

  return {
    hostname,
    setHostname,
    wifiSsid,
    setWifiSsid,
    wifiPassword,
    setWifiPassword,
    saving,
    message,
    setMessage,
    changes,
    hasChanges,
    revert,
    save,
    validationErrors,
    isFormValid,
    validation,
  };
}
