import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import {
  MAX_HOSTNAME_LENGTH,
  MAX_WIFI_PASSWORD_LENGTH,
  MAX_WIFI_SSID_LENGTH,
} from 'shared/schemas/minerApi';
import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import { useSetupContext } from '@/context/SetupContext';
import { MINER_IP_PLACEHOLDER } from '@/lib/constants';
import { Field } from '@/components/settings/Field';
import { PendingChanges, PendingIndicator } from '@/components/settings/PendingChanges';

export function TabSetup({ minerReachable }) {
  const setup = useSetupContext();
  const { connection, status, actions } = setup;

  const { wifi: wifiSettings } = useMinerSettingsContext();
  const { wifi, status: wifiStatus, validation: wifiValidation, actions: wifiActions } = wifiSettings;
  const { hostnameError, wifiSsidError, wifiPasswordError } = wifiValidation.validation;

  return (
    <>
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header mb-4">
            <h3 className="card-header-title">Miner Settings<PendingIndicator hasPending={status.changes?.length > 0} /></h3>
          </div>
        </div>
        <form onSubmit={actions.save} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Miner IP" hint="Miner IP. Leave empty to use .env MINER_IP.">
              <input
                type="text"
                value={connection.minerIp}
                onChange={(e) => connection.setMinerIp(e.target.value)}
                placeholder={MINER_IP_PLACEHOLDER}
                className="input"
                aria-label="Miner IP"
              />
            </Field>
            <Field
              label="Expected hashrate (GH/s)"
              hint="Used for gauge and display."
              suffix={`(= ${(connection.expectedHashrateGh / 1000).toFixed(2)} TH/s)`}
            >
              <input
                type="number"
                min={1}
                max={100000}
                value={connection.expectedHashrateGh}
                onChange={(e) => connection.setExpectedHashrateGh(Number(e.target.value) || DASHBOARD_DEFAULTS.defaultExpectedHashrateGh)}
                className="input"
                aria-label="Expected hashrate (GH/s)"
              />
            </Field>
            <Field
              label="Miner poll interval (ms)"
              hint="How often the dashboard fetches miner status."
              suffix={`(= ${(connection.pollMinerMs / 1000).toFixed(1)} sec)`}
            >
              <input
                type="number"
                min={1000}
                max={300000}
                value={connection.pollMinerMs}
                onChange={(e) => connection.setPollMinerMs(Number(e.target.value) || DASHBOARD_DEFAULTS.pollMinerIntervalMs)}
                className="input"
                aria-label="Miner poll interval (ms)"
              />
            </Field>
            <Field
              label="Network poll interval (ms)"
              hint="How often to fetch network stats from mempool.space."
              suffix={`(= ${(connection.pollNetworkMs / 1000).toFixed(1)} sec)`}
            >
              <input
                type="number"
                min={5000}
                max={600000}
                value={connection.pollNetworkMs}
                onChange={(e) => connection.setPollNetworkMs(Number(e.target.value) || DASHBOARD_DEFAULTS.pollNetworkIntervalMs)}
                className="input"
                aria-label="Network poll interval (ms)"
              />
            </Field>
          </div>
          <PendingChanges
            changes={status.changes}
            onReset={actions.revert}
            title="Pending changes"
          />
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              type="submit"
              disabled={status.saving || !status.hasChanges}
              className="btn-primary"
            >
              {status.saving ? 'Saving…' : 'Save settings'}
            </button>
            {status.message?.type === 'success' && (
              <span role="status" className="message-success">
                <span>{status.message.text}</span>
              </span>
            )}
            {status.message?.type === 'error' && (
              <span role="alert" className="message-warning">
                {status.message.text}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">WiFi Settings<PendingIndicator hasPending={wifiStatus.changes?.length > 0} /></h3>
          </div>
        </div>
        {!minerReachable ? (
          <p className="text-muted text-sm">
            Connect to the miner to configure WiFi. Set Miner IP above and save, then this section will be available.
          </p>
        ) : (
          <>
            <form onSubmit={(e) => { e.preventDefault(); wifiActions.save(); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Hostname" hint="Device hostname on the network.">
                  <input
                    type="text"
                    value={wifi.hostname}
                    onChange={(e) => wifi.setHostname(e.target.value.toLowerCase())}
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
                    value={wifi.wifiSsid}
                    onChange={(e) => wifi.setWifiSsid(e.target.value)}
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
                <Field label="WiFi Password" hint={`Leave blank to keep current password.`}>
                  <input
                    type="password"
                    value={wifi.wifiPassword}
                    onChange={(e) => wifi.setWifiPassword(e.target.value)}
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
                <p className="text-muted text-sm max-w-prose">
                  Changing the WiFi network or password can disconnect the miner from your current network. You may lose access to the dashboard until you reach the miner on its new address.
                </p>
              </div>
              <PendingChanges
                changes={wifiStatus.changes}
                onReset={wifiActions.revert}
                title="Pending changes"
              />
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {wifiStatus.hasChanges && !wifiValidation.isFormValid && (
                  <span className="text-danger text-sm" role="alert">
                    Fix the errors above to save.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={wifiStatus.saving || !wifiStatus.hasChanges || !wifiValidation.isFormValid}
                  className="btn-primary"
                >
                  {wifiStatus.saving ? 'Saving…' : 'Save settings'}
                </button>
                {wifiStatus.message?.type === 'success' && (
                  <span role="status" className="message-success">
                    <span>Saved successfully</span>
                  </span>
                )}
                {wifiStatus.message?.type === 'error' && (
                  <span role="alert" className="message-warning">
                    {wifiStatus.message.text}
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
