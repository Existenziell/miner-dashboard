import { useState, useEffect, useMemo, useCallback } from 'react';
import { patchMinerSettings, restartMiner, shutdownMiner, fetchMinerAsic } from '../lib/api';
import { useMiner } from '../context/MinerContext';

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
  const [autoScreenOff, setAutoScreenOff] = useState(!!(miner?.autoscreenoff === 1 || miner?.autoscreenoff === true));
  const [flipScreen, setFlipScreen] = useState(!!(miner?.flipscreen === 1 || miner?.flipscreen === true));

  // Sync form when miner data updates
  useEffect(() => {
    if (!miner) return;
    setFrequency(miner.frequency ?? 600);
    setCoreVoltage(miner.coreVoltage ?? miner.defaultCoreVoltage ?? 1150);
    setOverheatTemp(miner.overheat_temp ?? 70);
    setFanAuto(!!(miner.autofanspeed != null && miner.autofanspeed !== 0));
    setPidTargetTemp(miner.pidTargetTemp ?? 55);
    setManualFanSpeed(miner.manualFanSpeed ?? 100);
    setAutoScreenOff(!!(miner.autoscreenoff === 1 || miner.autoscreenoff === true));
    setFlipScreen(!!(miner.flipscreen === 1 || miner.flipscreen === true));
  }, [miner]);

  // Fetch ASIC options (frequency/voltage dropdowns)
  useEffect(() => {
    let cancelled = false;
    fetchMinerAsic()
      .then((data) => { if (!cancelled) setAsic(data); })
      .catch(() => { if (!cancelled) setAsic(null); });
    return () => { cancelled = true; };
  }, []);

  // Official options from AxeOS / board; defaults and absolute max from ASIC endpoint
  const officialFreq = asic?.frequencyOptions ?? [miner?.defaultFrequency ?? 600];
  const officialVolt = asic?.voltageOptions ?? [miner?.defaultCoreVoltage ?? 1150];
  const defaultFreq = asic?.defaultFrequency ?? miner?.defaultFrequency ?? 600;
  const defaultVolt = asic?.defaultVoltage ?? miner?.defaultCoreVoltage ?? 1150;
  const absMaxFreq = asic?.absMaxFrequency ?? 800;
  const BOARD_MAX_VOLTAGE = 1200; // NerdQaxe++ board max; do not use API absMaxVoltage (can report higher)
  const absMaxVolt = BOARD_MAX_VOLTAGE;

  // Frequency: official AxeOS options + 25 MHz steps from 625 up to board max, plus current value
  const extendedFreq = new Set(officialFreq);
  for (let f = 625; f <= absMaxFreq; f += 25) extendedFreq.add(f);
  extendedFreq.add(frequency);
  const frequencyOptions = [...extendedFreq].sort((a, b) => a - b);

  // Voltage: official + current value + board max, capped at board max (1200 mV)
  const voltageOptions = [...new Set([...officialVolt, coreVoltage, absMaxVolt])]
    .filter((v) => v <= BOARD_MAX_VOLTAGE)
    .sort((a, b) => a - b);

  const getFreqTag = (f) => {
    if (f === defaultFreq) return 'default';
    if (f === absMaxFreq) return 'max';
    if (!officialFreq.includes(f)) return 'custom';
    return null;
  };
  const getVoltTag = (v) => {
    if (v === defaultVolt) return 'default';
    if (v === absMaxVolt) return 'max';
    if (!officialVolt.includes(v)) return 'custom';
    return null;
  };

  // Baseline from miner (current saved state) for change detection
  const baseline = useMemo(
    () =>
      miner
        ? {
            frequency: miner.frequency ?? 600,
            coreVoltage: miner.coreVoltage ?? miner.defaultCoreVoltage ?? 1150,
            overheatTemp: miner.overheat_temp ?? 70,
            fanAuto: !!(miner.autofanspeed != null && miner.autofanspeed !== 0),
            pidTargetTemp: miner.pidTargetTemp ?? 55,
            manualFanSpeed: miner.manualFanSpeed ?? 100,
            autoScreenOff: !!(miner.autoscreenoff === 1 || miner.autoscreenoff === true),
            flipScreen: !!(miner.flipscreen === 1 || miner.flipscreen === true),
          }
        : null,
    [miner]
  );

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
  }, [baseline]);

  const handleSave = async (e) => {
    e.preventDefault();
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

  if (!miner) {
    return (
      <div className="card p-8 text-center text-muted-standalone">
        Connect to the miner to change settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {message && (
        <div className={message.type === 'success' ? 'toast-success' : 'toast-danger'}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ASIC */}
        <div className="card">
          <h3 className="card-title">ASIC</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Frequency (MHz)"
              hint={`Up to ${absMaxFreq} MHz is the board maximum; custom values above the AxeOS list are overclock.`}
            >
              <select
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="input"
              >
                {frequencyOptions.map((f) => {
                  const tag = getFreqTag(f);
                  const label = tag ? `${f} MHz (${tag})` : `${f} MHz`;
                  return (
                    <option key={f} value={f}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Core voltage (mV)" hint="Do not exceed board max limit (1200 mV).">
              <select
                value={coreVoltage}
                onChange={(e) => setCoreVoltage(Number(e.target.value))}
                className="input"
              >
                {voltageOptions.map((v) => {
                  const tag = getVoltTag(v);
                  const label = tag ? `${v} mV (${tag})` : `${v} mV`;
                  return (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>
        </div>

        {/* Temperature & Fan */}
        <div className="card">
          <h3 className="card-title">Temperature & Fan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Overheat limit (°C)" hint="Miner shuts down above this temperature.">
              <input
                type="number"
                min={50}
                max={80}
                value={overheatTemp}
                onChange={(e) => setOverheatTemp(Math.min(80, Math.max(50, Number(e.target.value) || 50)))}
                className="input"
              />
            </Field>
            <Field label="Fan mode">
              <div className="flex items-center gap-2">
                <span className="text-sm text-body">Manual</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={fanAuto}
                  aria-label="Fan mode"
                  onClick={() => setFanAuto((v) => !v)}
                  className={`switch ${fanAuto ? 'bg-accent border-accent' : 'bg-surface-subtle border-default'}`}
                >
                  <span className={`switch-thumb ${fanAuto ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-body">Auto (PID)</span>
              </div>
            </Field>
            {fanAuto ? (
              <Field label="PID target temperature (°C)" hint="Fan aims to keep ASIC at this temp.">
                <input
                  type="number"
                  min={40}
                  max={75}
                  value={pidTargetTemp}
                  onChange={(e) => setPidTargetTemp(Math.min(75, Math.max(40, Number(e.target.value) || 40)))}
                  className="input"
                />
              </Field>
            ) : (
              <Field label="Manual fan speed (%)">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={manualFanSpeed}
                  onChange={(e) => setManualFanSpeed(Number(e.target.value))}
                  className="input-range"
                />
                <span className="text-sm text-body">{manualFanSpeed}%</span>
              </Field>
            )}
          </div>
        </div>

        {/* Display */}
        <div className="card">
          <h3 className="card-title">Display</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Automatic screen shutdown" hint="Turn off miner display after inactivity.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoScreenOff}
                  onClick={() => setAutoScreenOff((v) => !v)}
                  className={`switch ${autoScreenOff ? 'bg-accent border-accent' : 'bg-surface-subtle border-default'}`}
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
                  className={`switch ${flipScreen ? 'bg-accent border-accent' : 'bg-surface-subtle border-default'}`}
                >
                  <span className={`switch-thumb ${flipScreen ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-body">{flipScreen ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Restart & Shutdown */}
        <div className="card">
          <h3 className="card-title">Restart & Shutdown</h3>
          <p className="text-muted-standalone text-sm mb-4">
            Restart reconnects the miner after a short disconnect. Shutdown stops the miner until you power it on again.
          </p>
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
        </div>

        {/* Pending changes */}
        {hasChanges && (
          <div className="highlight-box">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="label font-semibold">Pending changes</p>
              <button
                type="button"
                onClick={handleReset}
                className="link-text text-body"
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

        {/* Save */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
