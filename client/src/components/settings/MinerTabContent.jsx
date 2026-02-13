import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import {
  MAX_HOSTNAME_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_SSID_LENGTH,
  MIN_WIFI_PASSWORD_LENGTH,
} from '@/lib/constants';
import { ChartCard } from '@/components/charts/TimeSeriesChart';
import { Field } from '@/components/settings/Field';

export function MinerTabContent({ wifiCollapsed, toggleWifiCollapsed }) {
  const form = useMinerSettingsContext();
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
    hostname,
    setHostname,
    wifiSsid,
    setWifiSsid,
    wifiPassword,
    setWifiPassword,
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
    hostnameError,
    wifiSsidError,
    wifiPasswordError,
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
          <Field label="WiFi Password" hint={`Leave blank to keep current password. When set, ${MIN_WIFI_PASSWORD_LENGTH}–${MAX_WIFI_PASSWORD_LENGTH} characters.`}>
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
  );
}
