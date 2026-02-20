import { useCallback, useEffect, useMemo, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { patchDashboardConfig } from '@/lib/api';
import { MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';

export function useSetup(config, refetchConfig, onError) {
  const [minerIp, setMinerIp] = useState(config.minerIp);
  const [expectedHashrateGh, setExpectedHashrateGh] = useState(config.defaultExpectedHashrateGh);
  const [pollMinerMs, setPollMinerMs] = useState(config.pollMinerIntervalMs);
  const [pollNetworkMs, setPollNetworkMs] = useState(config.pollNetworkIntervalMs);
  const [pollSystemMs, setPollSystemMs] = useState(config.pollSystemIntervalMs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMinerIp(config.minerIp);
    setExpectedHashrateGh(config.defaultExpectedHashrateGh);
    setPollMinerMs(config.pollMinerIntervalMs);
    setPollNetworkMs(config.pollNetworkIntervalMs);
    setPollSystemMs(config.pollSystemIntervalMs);
  }, [config]);

  const minerSettingsChanges = useMemo(() => {
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
    return list;
  }, [config.minerIp, config.defaultExpectedHashrateGh, minerIp, expectedHashrateGh]);

  const pollingChanges = useMemo(() => {
    const list = [];
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
    if (pollSystemMs !== config.pollSystemIntervalMs) {
      list.push({
        label: 'System poll interval',
        from: `${config.pollSystemIntervalMs} ms`,
        to: `${pollSystemMs} ms`,
      });
    }
    return list;
  }, [config.pollMinerIntervalMs, config.pollNetworkIntervalMs, config.pollSystemIntervalMs, pollMinerMs, pollNetworkMs, pollSystemMs]);

  const hasMinerSettingsChanges = minerSettingsChanges.length > 0;
  const hasPollingChanges = pollingChanges.length > 0;
  const hasChanges = hasMinerSettingsChanges || hasPollingChanges;

  const changes = useMemo(
    () => [...minerSettingsChanges, ...pollingChanges],
    [minerSettingsChanges, pollingChanges]
  );

  const hasDefaultsDiff =
    expectedHashrateGh !== DASHBOARD_DEFAULTS.defaultExpectedHashrateGh ||
    pollMinerMs !== DASHBOARD_DEFAULTS.pollMinerIntervalMs ||
    pollNetworkMs !== DASHBOARD_DEFAULTS.pollNetworkIntervalMs ||
    pollSystemMs !== DASHBOARD_DEFAULTS.pollSystemIntervalMs;

  const revertMinerSettings = useCallback(() => {
    setMinerIp(config.minerIp);
    setExpectedHashrateGh(config.defaultExpectedHashrateGh);
  }, [config.minerIp, config.defaultExpectedHashrateGh]);

  const revertPolling = useCallback(() => {
    setPollMinerMs(config.pollMinerIntervalMs);
    setPollNetworkMs(config.pollNetworkIntervalMs);
    setPollSystemMs(config.pollSystemIntervalMs);
  }, [config.pollMinerIntervalMs, config.pollNetworkIntervalMs, config.pollSystemIntervalMs]);

  const revert = useCallback(() => {
    revertMinerSettings();
    revertPolling();
  }, [revertMinerSettings, revertPolling]);

  const saveMinerSettings = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        await patchDashboardConfig({
          minerIp: minerIp.trim(),
          defaultExpectedHashrateGh: Number(expectedHashrateGh),
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
    [minerIp, expectedHashrateGh, refetchConfig, onError]
  );

  const savePolling = useCallback(
    async (e) => {
      e?.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        await patchDashboardConfig({
          pollMinerIntervalMs: Number(pollMinerMs),
          pollNetworkIntervalMs: Number(pollNetworkMs),
          pollSystemIntervalMs: Number(pollSystemMs),
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
    [pollMinerMs, pollNetworkMs, pollSystemMs, refetchConfig, onError]
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
        pollSystemIntervalMs: Number(DASHBOARD_DEFAULTS.pollSystemIntervalMs),
      });
      await refetchConfig();
      setExpectedHashrateGh(DASHBOARD_DEFAULTS.defaultExpectedHashrateGh);
      setPollMinerMs(DASHBOARD_DEFAULTS.pollMinerIntervalMs);
      setPollNetworkMs(DASHBOARD_DEFAULTS.pollNetworkIntervalMs);
      setPollSystemMs(DASHBOARD_DEFAULTS.pollSystemIntervalMs);
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
      pollSystemMs,
      setPollSystemMs,
    },
    status: {
      changes,
      hasChanges,
      hasMinerSettingsChanges,
      hasPollingChanges,
      minerSettingsChanges,
      pollingChanges,
      hasDefaultsDiff,
      saving,
      message,
      setMessage,
      showResetConfirm,
      setShowResetConfirm,
    },
    actions: {
      revert,
      revertMinerSettings,
      revertPolling,
      saveMinerSettings,
      savePolling,
      resetToDefaults,
    },
  };
}
