import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import { Field } from '@/components/settings/Field';

export function TabMiner() {
  const { device: form } = useMinerSettingsContext();
  const {
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
    frequencyOptions,
    voltageOptions,
    getFreqTag,
    getVoltTag,
    frequencyVoltageWarning,
    selectedFreqRef,
    absMaxFreq,
    absMaxVolt,
    validation,
  } = form;
  const {
    overheatTempError,
    pidTargetTempError,
    manualFanSpeedError,
  } = validation;

  return (
    <>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title">Temperature & Fan</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Field label="Fan mode" hint="PID adjusts fan speed from ASIC temperature.">
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
    </>
  );
}
