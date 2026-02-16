import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import { Field } from '@/components/settings/Field';
import { PendingIndicator } from '@/components/settings/PendingChanges';

export function TabMiner() {
  const { device } = useMinerSettingsContext();
  const { asic, tempFan, display, status, validation } = device;
  const {
    overheatTempError,
    pidTargetTempError,
    manualFanSpeedError,
  } = validation.validation;

  return (
    <>
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">ASIC<PendingIndicator hasPending={status.hasAsicChanges} /></h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Frequency (MHz)"
            hint={asic.absMaxFreq != null ? `Max: ${asic.absMaxFreq} MHz` : undefined}
          >
            <div className="option-list" role="radiogroup" aria-label="Frequency (MHz)">
              {asic.frequencyOptions.map((f) => {
                const tag = asic.getFreqTag(f);
                const isSelected = asic.frequency === f;
                return (
                  <label
                    key={f}
                    ref={isSelected ? asic.selectedFreqRef : undefined}
                    className={`option-row ${isSelected ? 'option-row-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={f}
                      checked={isSelected}
                      onChange={() => asic.setFrequency(f)}
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
          <Field label="Core voltage (mV)" hint={`Max: ${asic.absMaxVolt} mV`}>
            <div className="option-list" role="radiogroup" aria-label="Core voltage (mV)">
              {asic.voltageOptions.map((v) => {
                const tag = asic.getVoltTag(v);
                const isSelected = asic.coreVoltage === v;
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
                      onChange={() => asic.setCoreVoltage(v)}
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
        {asic.frequencyVoltageWarning && (
          <p className="mt-3 text-warning dark:text-warning-dark text-sm" role="alert">
            {asic.frequencyVoltageWarning}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title">Temperature & Fan<PendingIndicator hasPending={status.hasTempFanChanges} /></h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              {tempFan.fanAuto ? (
                <Field label="PID target temperature (°C)" hint="Fan aims to keep ASIC at this temp.">
                  <input
                    type="number"
                    min={40}
                    max={75}
                    value={tempFan.pidTargetTemp}
                    onChange={(e) => tempFan.setPidTargetTemp(Math.min(75, Math.max(40, Number(e.target.value) || 40)))}
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
                    value={tempFan.manualFanSpeed}
                    onChange={(e) => tempFan.setManualFanSpeed(Number(e.target.value))}
                    className={`input-range ${manualFanSpeedError ? 'input-danger' : ''}`}
                    aria-invalid={!!manualFanSpeedError}
                    aria-describedby={manualFanSpeedError ? 'manual-fan-speed-error' : undefined}
                  />
                  <span className="text-sm text-normal">{tempFan.manualFanSpeed}%</span>
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
                    aria-checked={tempFan.fanAuto}
                    aria-label="Fan mode: Manual / Auto (PID)"
                    onClick={() => tempFan.setFanAuto((v) => !v)}
                    className={`switch ${tempFan.fanAuto ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${tempFan.fanAuto ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-normal">{tempFan.fanAuto ? 'Auto (PID)' : 'Manual'}</span>
                </div>
              </Field>
            </div>
            <Field label="Overheat limit (°C)" hint="Miner shuts down above this temperature.">
              <input
                type="number"
                min={50}
                max={80}
                value={tempFan.overheatTemp}
                onChange={(e) => tempFan.setOverheatTemp(Math.min(80, Math.max(50, Number(e.target.value) || 50)))}
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
              <h3 className="card-header-title">Display<PendingIndicator hasPending={status.hasDisplayChanges} /></h3>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Automatic screen shutdown" hint="Turn off miner display after inactivity.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={display.autoScreenOff}
                  aria-label="Automatic screen shutdown"
                  onClick={() => display.setAutoScreenOff((v) => !v)}
                  className={`switch ${display.autoScreenOff ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${display.autoScreenOff ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{display.autoScreenOff ? 'On' : 'Off'}</span>
              </div>
            </Field>
            <Field label="Flip screen" hint="Rotate display 180°.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={display.flipScreen}
                  aria-label="Flip screen"
                  onClick={() => display.setFlipScreen((v) => !v)}
                  className={`switch ${display.flipScreen ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${display.flipScreen ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{display.flipScreen ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}
