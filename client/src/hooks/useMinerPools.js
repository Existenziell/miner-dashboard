import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MAX_STRATUM_PASSWORD_LENGTH,
  MAX_STRATUM_PORT,
  MAX_STRATUM_URL_LENGTH,
  MAX_STRATUM_USER_LENGTH,
  MIN_STRATUM_PORT,
} from 'shared/schemas/minerApi';
import { patchMinerSettings } from '@/lib/api';
import {
  DEFAULT_STRATUM_PORT,
  SOLO_POOLS,
  TOAST_AUTO_DISMISS_MS,
} from '@/lib/constants';
import { toBool } from '@/lib/minerApiBools';
import { findSoloPoolOption, getStratumPayloadFromOption } from '@/lib/poolUtils';

const POOL_MODE_OPTIONS = [
  { value: 'failover', label: 'Failover (Primary/Fallback)' },
  { value: 'dual', label: 'Dual Pool' },
];

export function useMinerPools(miner, refetch, onError) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  const baseline = useMemo(() => {
    if (!miner) return null;
    const primaryOpt = findSoloPoolOption(miner.stratumURL, miner.stratumPort);
    const fallbackOpt = findSoloPoolOption(miner.fallbackStratumURL, miner.fallbackStratumPort);
    return {
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
  }, [baseline, primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryPassword, fallbackPassword, primaryStratumUser, fallbackStratumUser, poolMode, stratumTcpKeepalive, primaryTLS, fallbackTLS, primaryExtranonceSubscribe, fallbackExtranonceSubscribe]);

  const hasChanges = changes.length > 0;

  const revert = useCallback(() => {
    if (!baseline) return;
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

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  const { validationErrors, isFormValid } = useMemo(() => {
    const errors = [];
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
    return {
      validationErrors: errors,
      isFormValid: errors.length === 0,
    };
  }, [primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryStratumUser, fallbackStratumUser, primaryPassword, fallbackPassword]);

  const save = useCallback(async () => {
    if (!isFormValid) {
      setMessage({ type: 'error', text: validationErrors[0]?.message ?? 'Fix form errors.' });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      const primaryOpt = primaryPoolKey && primaryPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === primaryPoolKey) : null;
      const fallbackOpt = fallbackPoolKey && fallbackPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === fallbackPoolKey) : null;
      const primaryPort = Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(primaryStratumPort) || DEFAULT_STRATUM_PORT));
      const fallbackPort = Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(fallbackStratumPort) || DEFAULT_STRATUM_PORT));
      const stripStratumHost = (url) => {
        const s = (url || '').trim();
        if (!s) return '';
        return s.replace(/^stratum\+tcp:\/\//i, '').replace(/^stratum2\+tcp:\/\//i, '').split(':')[0].split('/')[0].trim();
      };
      let poolPayload = {};
      if (primaryOpt) {
        const p = getStratumPayloadFromOption(primaryOpt);
        poolPayload = { stratumURL: p.stratumURL, stratumPort: primaryPort, stratumTLS: primaryTLS };
      } else if (primaryPoolKey === 'other') {
        poolPayload = { stratumURL: stripStratumHost(primaryCustomURL), stratumPort: primaryPort, stratumTLS: primaryTLS };
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
      await patchMinerSettings(poolPayload);
      await refetch();
      setMessage({ type: 'success', text: 'Pools saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [isFormValid, validationErrors, primaryPoolKey, fallbackPoolKey, primaryCustomURL, fallbackCustomURL, primaryStratumPort, fallbackStratumPort, primaryTLS, fallbackTLS, primaryExtranonceSubscribe, fallbackExtranonceSubscribe, primaryStratumUser, fallbackStratumUser, primaryPassword, fallbackPassword, poolMode, stratumTcpKeepalive, refetch, onError]);

  const validation = {
    primaryStratumUserError: validationErrors.find((e) => e.id === 'primaryStratumUser')?.message ?? null,
    fallbackStratumUserError: validationErrors.find((e) => e.id === 'fallbackStratumUser')?.message ?? null,
    primaryPortValid: !validationErrors.some((e) => e.id === 'primaryStratumPort'),
    fallbackPortValid: !validationErrors.some((e) => e.id === 'fallbackStratumPort'),
    primaryCustomURLError: validationErrors.find((e) => e.id === 'primaryCustomURL')?.message ?? null,
    fallbackCustomURLError: validationErrors.find((e) => e.id === 'fallbackCustomURL')?.message ?? null,
    primaryPasswordError: validationErrors.find((e) => e.id === 'primaryPassword')?.message ?? null,
    fallbackPasswordError: validationErrors.find((e) => e.id === 'fallbackPassword')?.message ?? null,
  };

  return {
    POOL_MODE_OPTIONS,
    saving,
    message,
    setMessage,
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
    changes,
    hasChanges,
    revert,
    save,
    validationErrors,
    isFormValid,
    validation,
  };
}
