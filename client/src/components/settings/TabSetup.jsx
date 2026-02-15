import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import {
  MAX_HOSTNAME_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_SSID_LENGTH,
  MIN_WIFI_PASSWORD_LENGTH,
} from 'shared/schemas/minerApi';
import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import { useSetupContext } from '@/context/SetupContext';
import { Field } from '@/components/settings/Field';
import { PendingChanges } from '@/components/settings/PendingChanges';

export function TabSetup({ minerReachable }) {
  const setupForm = useSetupContext();
  const {
    minerIp,
    setMinerIp,
    expectedHashrateGh,
    setExpectedHashrateGh,
    pollMinerMs,
    setPollMinerMs,
    pollNetworkMs,
    setPollNetworkMs,
    changes: connectionChanges,
    hasChanges: hasConnectionChanges,
    revert,
    save: saveConnection,
    saving: savingConnection,
    message: configMessage,
  } = setupForm;

  const { wifi: wifiForm } = useMinerSettingsContext();
  const {
    hostname,
    setHostname,
    wifiSsid,
    setWifiSsid,
    wifiPassword,
    setWifiPassword,
    validation,
    saving,
    isFormValid: minerFormValid,
    message: minerMessage,
    changes: wifiChanges,
    hasChanges: minerHasChanges,
    revert: wifiRevert,
    save: wifiSave,
  } = wifiForm;
  const { hostnameError, wifiSsidError, wifiPasswordError } = validation;

  return (
    <>
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Miner settings</h3>
          </div>
        </div>
        <form onSubmit={saveConnection} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Miner IP" hint="IP address of the miner. Leave empty if using .env MINER_IP.">
              <input
                type="text"
                value={minerIp}
                onChange={(e) => setMinerIp(e.target.value)}
                placeholder="192.168.1.3"
                className="input"
                aria-label="Miner IP"
              />
            </Field>
            <Field
              label="Expected hashrate (GH/s)"
              hint="Used for gauge and display."
              suffix={`(= ${(expectedHashrateGh / 1000).toFixed(2)} TH/s)`}
            >
              <input
                type="number"
                min={1}
                max={100000}
                value={expectedHashrateGh}
                onChange={(e) => setExpectedHashrateGh(Number(e.target.value) || DASHBOARD_DEFAULTS.defaultExpectedHashrateGh)}
                className="input"
                aria-label="Expected hashrate GH/s"
              />
            </Field>
            <Field
              label="Miner poll interval (ms)"
              hint="How often to fetch miner status for dashboard refresh."
              suffix={`(= ${(pollMinerMs / 1000).toFixed(1)} sec)`}
            >
              <input
                type="number"
                min={1000}
                max={300000}
                value={pollMinerMs}
                onChange={(e) => setPollMinerMs(Number(e.target.value) || DASHBOARD_DEFAULTS.pollMinerIntervalMs)}
                className="input"
                aria-label="Miner poll interval ms"
              />
            </Field>
            <Field
              label="Network poll interval (ms)"
              hint="How often to fetch network stats from mempool.space."
              suffix={`(= ${(pollNetworkMs / 1000).toFixed(1)} sec)`}
            >
              <input
                type="number"
                min={5000}
                max={600000}
                value={pollNetworkMs}
                onChange={(e) => setPollNetworkMs(Number(e.target.value) || DASHBOARD_DEFAULTS.pollNetworkIntervalMs)}
                className="input"
                aria-label="Network poll interval ms"
              />
            </Field>
          </div>
          <PendingChanges
            changes={connectionChanges}
            onReset={revert}
            title="Pending changes"
          />
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              type="submit"
              disabled={savingConnection || !hasConnectionChanges}
              className="btn-primary"
            >
              {savingConnection ? 'Saving…' : 'Save settings'}
            </button>
            {configMessage?.type === 'success' && (
              <span role="status" className="toast-success">
                <span>{configMessage.text}</span>
              </span>
            )}
            {configMessage?.type === 'error' && (
              <span role="alert" className="toast-warning">
                {configMessage.text}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">WiFi settings</h3>
          </div>
        </div>
        {!minerReachable ? (
          <p className="text-muted dark:text-muted-dark text-sm">
            Connect to the miner to configure WiFi. Set Miner IP above and save, then this section will be available.
          </p>
        ) : (
          <>
        <form onSubmit={(e) => { e.preventDefault(); wifiSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hostname" hint="Device hostname on the network (alphanumeric and hyphens).">
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value.toLowerCase())}
                placeholder="bitaxe"
                maxLength={MAX_HOSTNAME_LENGTH}
                className={`input ${hostnameError ? 'input-danger' : ''}`}
                aria-label="Hostname"
                aria-invalid={!!hostnameError}
                aria-describedby={hostnameError ? 'setup-hostname-error' : undefined}
              />
              {hostnameError && (
                <p id="setup-hostname-error" className="text-danger text-xs mt-1" role="alert">
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
                aria-describedby={wifiSsidError ? 'setup-wifi-ssid-error' : undefined}
              />
              {wifiSsidError && (
                <p id="setup-wifi-ssid-error" className="text-danger text-xs mt-1" role="alert">
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
                aria-describedby={wifiPasswordError ? 'setup-wifi-password-error' : undefined}
              />
              {wifiPasswordError && (
                <p id="setup-wifi-password-error" className="text-danger text-xs mt-1" role="alert">
                  {wifiPasswordError}
                </p>
              )}
            </Field>
          </div>
          <p className="text-muted dark:text-muted-dark text-xs mt-5">
            Changing the WiFi network or password can disconnect the miner from your current network. You may lose access to the dashboard until you reach the miner on its new address.
          </p>
          <PendingChanges
            changes={wifiChanges}
            onReset={wifiRevert}
            title="Pending changes"
          />
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {minerHasChanges && !minerFormValid && (
              <span className="text-danger text-sm" role="alert">
                Fix the errors above to save.
              </span>
            )}
            <button
              type="submit"
              disabled={saving || !minerHasChanges || !minerFormValid}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {minerMessage?.type === 'success' && (
              <span role="status" className="toast-success">
                <span>Saved successfully</span>
              </span>
            )}
            {minerMessage?.type === 'error' && (
              <span role="alert" className="toast-warning">
                {minerMessage.text}
              </span>
            )}
          </div>
        </form>
          </>
        )}
      </div>
    </>
  );
}
