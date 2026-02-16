import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';

export function useSetup(config, refetchConfig, onError) {
  const [minerIp, setMinerIp] = useState(config.minerIp);
  const [expectedHashrateGh, setExpectedHashrateGh] = useState(config.defaultExpectedHashrateGh);
  const [pollMinerMs, setPollMinerMs] = useState(config.pollMinerIntervalMs);
  const [pollNetworkMs, setPollNetworkMs] = useState(config.pollNetworkIntervalMs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMinerIp(config.minerIp);
    setExpectedHashrateGh(config.defaultExpectedHashrateGh);
    setPollMinerMs(config.pollMinerIntervalMs);
    setPollNetworkMs(config.pollNetworkIntervalMs);
  }, [config]);

  const hasChanges =
    minerIp !== config.minerIp ||
    expectedHashrateGh !== config.defaultExpectedHashrateGh ||
    pollMinerMs !== config.pollMinerIntervalMs ||
    pollNetworkMs !== config.pollNetworkIntervalMs;

  const hasDefaultsDiff =
    expectedHashrateGh !== DASHBOARD_DEFAULTS.defaultExpectedHashrateGh ||
    pollMinerMs !== DASHBOARD_DEFAULTS.pollMinerIntervalMs ||
    pollNetworkMs !== DASHBOARD_DEFAULTS.pollNetworkIntervalMs;

  const changes = useMemo(() => {
    const list = [];
    if (minerIp !== config.minerIp) {
      list.push({ label: 'Miner IP', from: config.minerIp || '—', to: minerIp.trim() || '—' });
    }
    if (expectedHashrateGh !== config.defaultExpectedHashrateGh) {
      list.push({
        label: 'Expected hashrate',
        from: `${config.defaultExpectedHashrateGh} GH/s`,
        to: `${expectedHashrateGh} GH/s`,
      });
    }
    if (pollMinerMs !== config.pollMinerIntervalMs) {
      list.push({
        label: 'Miner poll interval',
        from: `${config.pollMinerIntervalMs} ms`,
        to: `${pollMinerMs} ms`,
      });
    }
    if (pollNetworkMs !== config.pollNetworkIntervalMs) {
      list.push({
        label: 'Network poll interval',
        from: `${config.pollNetworkIntervalMs} ms`,
        to: `${pollNetworkMs} ms`,
      });
    }
    return list;
  }, [config.minerIp, config.defaultExpectedHashrateGh, config.pollMinerIntervalMs, config.pollNetworkIntervalMs, minerIp, expectedHashrateGh, pollMinerMs, pollNetworkMs]);

  const revert = useCallback(() => {
    setMinerIp(config.minerIp);
    setExpectedHashrateGh(config.defaultExpectedHashrateGh);
    setPollMinerMs(config.pollMinerIntervalMs);
    setPollNetworkMs(config.pollNetworkIntervalMs);
  }, [config]);

  const save = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        await patchDashboardConfig({
          minerIp: minerIp.trim(),
          defaultExpectedHashrateGh: Number(expectedHashrateGh),
          pollMinerIntervalMs: Number(pollMinerMs),
          pollNetworkIntervalMs: Number(pollNetworkMs),
        });
        await refetchConfig();
        setMessage({ type: 'success', text: 'Settings saved.' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        onError?.(err);
      } finally {
        setSaving(false);
      }
    },
    [minerIp, expectedHashrateGh, pollMinerMs, pollNetworkMs, refetchConfig, onError]
  );

  const resetToDefaults = useCallback(async () => {
    setMessage(null);
    setSaving(true);
    try {
      await patchDashboardConfig({
        minerIp: minerIp.trim(),
        defaultExpectedHashrateGh: Number(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh),
        pollMinerIntervalMs: Number(DASHBOARD_DEFAULTS.pollMinerIntervalMs),
        pollNetworkIntervalMs: Number(DASHBOARD_DEFAULTS.pollNetworkIntervalMs),
      });
      await refetchConfig();
      setExpectedHashrateGh(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh);
      setPollMinerMs(DASHBOARD_DEFAULTS.pollMinerIntervalMs);
      setPollNetworkMs(DASHBOARD_DEFAULTS.pollNetworkIntervalMs);
      setShowResetConfirm(false);
      setMessage({ type: 'success', text: 'Settings reset to default values.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [minerIp, refetchConfig, onError]);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

  return {
    connection: {
      minerIp,
      setMinerIp,
      expectedHashrateGh,
      setExpectedHashrateGh,
      pollMinerMs,
      setPollMinerMs,
      pollNetworkMs,
      setPollNetworkMs,
    },
    status: {
      changes,
      hasChanges,
      hasDefaultsDiff,
      saving,
      message,
      setMessage,
      showResetConfirm,
      setShowResetConfirm,
    },
    actions: {
      revert,
      save,
      resetToDefaults,
    },
  };
}
