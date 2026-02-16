import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMinerAsic, patchMinerSettings, restartMiner, shutdownMiner } from '@/lib/api';
import { MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';
import { toBool } from '@/lib/minerApiBools';

export function useMinerDevice(miner, refetch, onError) {
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
    return {
      frequency: miner.frequency ?? 600,
      coreVoltage: miner.coreVoltage ?? miner.defaultCoreVoltage ?? 1150,
      overheatTemp: miner.overheat_temp ?? 70,
      fanAuto: !!(miner.autofanspeed != null && miner.autofanspeed !== 0),
      pidTargetTemp: miner.pidTargetTemp ?? 55,
      manualFanSpeed: miner.manualFanSpeed ?? 100,
      autoScreenOff: toBool(miner.autoscreenoff),
      flipScreen: toBool(miner.flipscreen),
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
    return list;
  }, [baseline, frequency, coreVoltage, overheatTemp, fanAuto, pidTargetTemp, manualFanSpeed, autoScreenOff, flipScreen]);

  const hasChanges = changes.length > 0;

  const hasAsicChanges =
    baseline != null &&
    (frequency !== baseline.frequency || coreVoltage !== baseline.coreVoltage);
  const hasTempFanChanges =
    baseline != null &&
    (overheatTemp !== baseline.overheatTemp ||
      fanAuto !== baseline.fanAuto ||
      (fanAuto && pidTargetTemp !== baseline.pidTargetTemp) ||
      (!fanAuto && manualFanSpeed !== baseline.manualFanSpeed));
  const hasDisplayChanges =
    baseline != null &&
    (autoScreenOff !== baseline.autoScreenOff || flipScreen !== baseline.flipScreen);

  const revert = useCallback(() => {
    if (!baseline) return;
    setFrequency(baseline.frequency);
    setCoreVoltage(baseline.coreVoltage);
    setOverheatTemp(baseline.overheatTemp);
    setFanAuto(baseline.fanAuto);
    setPidTargetTemp(baseline.pidTargetTemp);
    setManualFanSpeed(baseline.manualFanSpeed);
    setAutoScreenOff(baseline.autoScreenOff);
    setFlipScreen(baseline.flipScreen);
  }, [baseline]);

  useEffect(() => {
    if (message?.type !== 'success') return;
    const t = setTimeout(() => setMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message?.type]);

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
    return {
      validationErrors: errors,
      isFormValid: errors.length === 0,
    };
  }, [overheatTemp, pidTargetTemp, manualFanSpeed]);

  const save = useCallback(async () => {
    if (validationErrors.some((e) => ['overheatTemp', 'pidTargetTemp', 'manualFanSpeed'].includes(e.id))) {
      setMessage({ type: 'error', text: validationErrors.find((e) => e.id === 'overheatTemp' || e.id === 'pidTargetTemp' || e.id === 'manualFanSpeed')?.message ?? 'Fix device fields.' });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      await patchMinerSettings({
        frequency: Number(frequency),
        coreVoltage: Number(coreVoltage),
        overheat_temp: Number(overheatTemp),
        autofanspeed: fanAuto ? 2 : 0,
        ...(fanAuto ? { pidTargetTemp: Number(pidTargetTemp) } : { manualFanSpeed: Number(manualFanSpeed) }),
        autoscreenoff: autoScreenOff,
        flipscreen: flipScreen,
      });
      await refetch();
      setMessage({ type: 'success', text: 'Device settings saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      onError?.(err);
    } finally {
      setSaving(false);
    }
  }, [frequency, coreVoltage, overheatTemp, fanAuto, pidTargetTemp, manualFanSpeed, autoScreenOff, flipScreen, validationErrors, refetch, onError]);

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
    overheatTempError: validationErrors.find((e) => e.id === 'overheatTemp')?.message ?? null,
    pidTargetTempError: validationErrors.find((e) => e.id === 'pidTargetTemp')?.message ?? null,
    manualFanSpeedError: validationErrors.find((e) => e.id === 'manualFanSpeed')?.message ?? null,
  };

  return {
    asic: {
      ...asic,
      frequency,
      setFrequency,
      coreVoltage,
      setCoreVoltage,
      frequencyOptions,
      voltageOptions,
      getFreqTag,
      getVoltTag,
      frequencyVoltageWarning,
      selectedFreqRef,
      absMaxFreq,
      absMaxVolt,
    },
    tempFan: {
      overheatTemp,
      setOverheatTemp,
      fanAuto,
      setFanAuto,
      pidTargetTemp,
      setPidTargetTemp,
      manualFanSpeed,
      setManualFanSpeed,
    },
    display: {
      autoScreenOff,
      setAutoScreenOff,
      flipScreen,
      setFlipScreen,
      baseline,
    },
    status: {
      saving,
      restarting,
      shuttingDown,
      message,
      setMessage,
      changes,
      hasChanges,
      hasAsicChanges,
      hasTempFanChanges,
      hasDisplayChanges,
    },
    validation: {
      validationErrors,
      isFormValid,
      validation,
    },
    actions: {
      revert,
      save,
      handleRestart,
      handleShutdown,
    },
  };
}
