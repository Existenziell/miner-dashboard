import {
  MAX_STRATUM_PASSWORD_LENGTH,
  MAX_STRATUM_PORT,
  MAX_STRATUM_USER_LENGTH,
  MIN_STRATUM_PORT,
} from 'shared/schemas/minerApi';
import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import {
  DEFAULT_STRATUM_PORT,
  POOL_MODE_OPTIONS,
  SOLO_POOLS,
} from '@/lib/constants';
import { IconSwap } from '@/components/Icons';
import { Field } from '@/components/settings/Field';
import { PendingIndicator } from '@/components/settings/PendingChanges';

export function TabPools({ miner }) {
  const { pools } = useMinerSettingsContext();
  const { mode, primary, fallback, status, validation, actions } = pools;
  const {
    primaryStratumUserError,
    fallbackStratumUserError,
    primaryPortValid,
    fallbackPortValid,
    primaryCustomURLError,
    fallbackCustomURLError,
    primaryPasswordError,
    fallbackPasswordError,
  } = validation.validation;

  return (
    <>
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Configuration<PendingIndicator hasPending={status.hasConfigurationChanges} /></h3>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-4 md:max-w-[33%]">
            <Field label="Pool mode" hint="Failover uses fallback when primary is down; Dual uses both pools.">
              <select
                value={mode.poolMode}
                onChange={(e) => mode.setPoolMode(e.target.value)}
                className="input"
                aria-label="Pool mode"
              >
                {POOL_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enable Stratum TCP Keepalive" hint="Sends keepalive every 30 s to prevent timeouts.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={mode.stratumTcpKeepalive}
                  aria-label="Enable Stratum TCP Keepalive"
                  onClick={() => mode.setStratumTcpKeepalive((v) => !v)}
                  className={`switch ${mode.stratumTcpKeepalive ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${mode.stratumTcpKeepalive ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{mode.stratumTcpKeepalive ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title flex items-center gap-2">
                {mode.poolMode === 'dual' ? 'Pool 1' : 'Pool 1 (Primary)'}
                {!(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.stratumURL || '').trim() ? (
                  <span className="status-active">ACTIVE</span>
                ) : null}
                <PendingIndicator hasPending={status.hasPrimaryPoolChanges} />
              </h3>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Pool" hint="Solo mining pool for block templates. See Docs for full list.">
              <select
                value={primary.primaryPoolKey}
                onChange={(e) => {
                  const v = e.target.value;
                  primary.setPrimaryPoolKey(v);
                  const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                  if (opt) primary.setPrimaryStratumPort(primary.primaryTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
                }}
                className="input"
                aria-label="Primary pool"
              >
                {SOLO_POOLS.map((opt) => (
                  <option key={opt.identifier} value={opt.identifier}>
                    {opt.name} ({opt.stratumHost})
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </Field>
            {primary.primaryPoolKey === 'other' && (
              <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                <input
                  type="text"
                  value={primary.primaryCustomURL}
                  onChange={(e) => primary.setPrimaryCustomURL(e.target.value)}
                  placeholder="stratum.example.com"
                  className={`input ${primaryCustomURLError ? 'input-danger' : ''}`}
                  aria-label="Primary pool URL"
                  aria-invalid={!!primaryCustomURLError}
                  aria-describedby={primaryCustomURLError ? 'primary-custom-url-error' : undefined}
                />
                {primaryCustomURLError && (
                  <p id="primary-custom-url-error" className="text-danger text-xs mt-1" role="alert">
                    {primaryCustomURLError}
                  </p>
                )}
              </Field>
            )}
            <Field label="Stratum port" hint={`Port 1–${MAX_STRATUM_PORT}. Usually 3333.`}>
              <input
                type="number"
                min={MIN_STRATUM_PORT}
                max={MAX_STRATUM_PORT}
                value={primary.primaryStratumPort}
                onChange={(e) => primary.setPrimaryStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                className={`input ${!primaryPortValid ? 'input-danger' : ''}`}
                aria-label="Primary pool Stratum port"
                aria-invalid={!primaryPortValid}
              />
            </Field>
            <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
              <input
                type="text"
                value={primary.primaryStratumUser}
                onChange={(e) => primary.setPrimaryStratumUser(e.target.value)}
                placeholder="bc1q..."
                maxLength={MAX_STRATUM_USER_LENGTH}
                className={`input ${primaryStratumUserError ? 'input-danger' : ''}`}
                aria-label="Primary pool Worker / payout address"
                aria-invalid={!!primaryStratumUserError}
                aria-describedby={primaryStratumUserError ? 'primary-stratum-user-error' : undefined}
              />
              {primaryStratumUserError && (
                <p id="primary-stratum-user-error" className="text-danger text-xs mt-1" role="alert">
                  {primaryStratumUserError}
                </p>
              )}
            </Field>
            <Field label="Password" hint="Some devices do not return it. Leave blank to keep the current password.">
              <input
                type="text"
                value={primary.primaryPassword}
                onChange={(e) => primary.setPrimaryPassword(e.target.value)}
                maxLength={MAX_STRATUM_PASSWORD_LENGTH}
                className={`input ${primaryPasswordError ? 'input-danger' : ''}`}
                placeholder="Pool Password"
                aria-label="Primary pool password"
                aria-invalid={!!primaryPasswordError}
                aria-describedby={primaryPasswordError ? 'primary-password-error' : undefined}
              />
              {primaryPasswordError && (
                <p id="primary-password-error" className="text-danger text-xs mt-1" role="alert">
                  {primaryPasswordError}
                </p>
              )}
            </Field>
            <Field label="Enable Extranonce Subscribe" hint="Allows longer extranonce for better efficiency.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={primary.primaryExtranonceSubscribe}
                  aria-label="Primary pool Enable Extranonce Subscribe"
                  onClick={() => primary.setPrimaryExtranonceSubscribe((v) => !v)}
                  className={`switch ${primary.primaryExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${primary.primaryExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{primary.primaryExtranonceSubscribe ? 'On' : 'Off'}</span>
              </div>
            </Field>
            <Field label="Encrypted connection (TLS)" hint="Improves security by encrypting the connection to the pool.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={primary.primaryTLS}
                  aria-label="Primary pool Encrypted connection TLS"
                  onClick={() => {
                    const nextTLS = !primary.primaryTLS;
                    primary.setPrimaryTLS(nextTLS);
                    const opt = primary.primaryPoolKey && primary.primaryPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === primary.primaryPoolKey) : null;
                    if (opt?.tlsPort != null) primary.setPrimaryStratumPort(nextTLS ? opt.tlsPort : opt.port);
                  }}
                  className={`switch ${primary.primaryTLS ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${primary.primaryTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{primary.primaryTLS ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-center -mx-2">
          <button
            type="button"
            onClick={actions.swapPools}
            className="swap-pool-btn"
            aria-label="Swap Pool 1 and Pool 2 settings"
            title="Swap pools"
          >
            <IconSwap className="w-5 h-5" />
          </button>
        </div>

        <div className="card">
          <div className="card-header-wrapper">
            <div className="card-header">
              <h3 className="card-header-title flex items-center gap-2">
                {mode.poolMode === 'dual' ? 'Pool 2' : 'Pool 2 (Fallback)'}
                {(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.fallbackStratumURL || '').trim() ? (
                  <span className="status-active">ACTIVE</span>
                ) : null}
                <PendingIndicator hasPending={status.hasFallbackPoolChanges} />
              </h3>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Pool" hint="Used when primary is unreachable.">
              <select
                value={fallback.fallbackPoolKey}
                onChange={(e) => {
                  const v = e.target.value;
                  fallback.setFallbackPoolKey(v);
                  const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                  if (opt) fallback.setFallbackStratumPort(fallback.fallbackTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
                }}
                className="input"
                aria-label="Fallback pool"
              >
                <option value="">None</option>
                {SOLO_POOLS.map((opt) => (
                  <option key={opt.identifier} value={opt.identifier}>
                    {opt.name} ({opt.stratumHost})
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </Field>
            {fallback.fallbackPoolKey === 'other' && (
              <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                <input
                  type="text"
                  value={fallback.fallbackCustomURL}
                  onChange={(e) => fallback.setFallbackCustomURL(e.target.value)}
                  placeholder="stratum.example.com"
                  className={`input ${fallbackCustomURLError ? 'input-danger' : ''}`}
                  aria-label="Fallback pool URL"
                  aria-invalid={!!fallbackCustomURLError}
                  aria-describedby={fallbackCustomURLError ? 'fallback-custom-url-error' : undefined}
                />
                {fallbackCustomURLError && (
                  <p id="fallback-custom-url-error" className="text-danger text-xs mt-1" role="alert">
                    {fallbackCustomURLError}
                  </p>
                )}
              </Field>
            )}
            <Field label="Stratum port" hint={`Port 1–${MAX_STRATUM_PORT}. Usually 3333.`}>
              <input
                type="number"
                min={MIN_STRATUM_PORT}
                max={MAX_STRATUM_PORT}
                value={fallback.fallbackStratumPort}
                onChange={(e) => fallback.setFallbackStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                className={`input ${!fallbackPortValid ? 'input-danger' : ''}`}
                aria-label="Fallback pool Stratum port"
                aria-invalid={!fallbackPortValid}
              />
            </Field>
            <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
              <input
                type="text"
                value={fallback.fallbackStratumUser}
                onChange={(e) => fallback.setFallbackStratumUser(e.target.value)}
                placeholder="bc1q..."
                maxLength={MAX_STRATUM_USER_LENGTH}
                className={`input ${fallbackStratumUserError ? 'input-danger' : ''}`}
                aria-label="Fallback pool Worker / payout address"
                aria-invalid={!!fallbackStratumUserError}
                aria-describedby={fallbackStratumUserError ? 'fallback-stratum-user-error' : undefined}
              />
              {fallbackStratumUserError && (
                <p id="fallback-stratum-user-error" className="text-danger text-xs mt-1" role="alert">
                  {fallbackStratumUserError}
                </p>
              )}
            </Field>
            <Field label="Password" hint="Some devices do not return it. Leave blank to keep the current password.">
              <input
                type="text"
                value={fallback.fallbackPassword}
                onChange={(e) => fallback.setFallbackPassword(e.target.value)}
                maxLength={MAX_STRATUM_PASSWORD_LENGTH}
                className={`input ${fallbackPasswordError ? 'input-danger' : ''}`}
                placeholder="Pool Password"
                aria-label="Fallback pool password"
                aria-invalid={!!fallbackPasswordError}
                aria-describedby={fallbackPasswordError ? 'fallback-password-error' : undefined}
              />
              {fallbackPasswordError && (
                <p id="fallback-password-error" className="text-danger text-xs mt-1" role="alert">
                  {fallbackPasswordError}
                </p>
              )}
            </Field>
            <Field label="Enable Extranonce Subscribe" hint="Allows longer extranonce for better efficiency.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={fallback.fallbackExtranonceSubscribe}
                  aria-label="Fallback pool Enable Extranonce Subscribe"
                  onClick={() => fallback.setFallbackExtranonceSubscribe((v) => !v)}
                  className={`switch ${fallback.fallbackExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${fallback.fallbackExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{fallback.fallbackExtranonceSubscribe ? 'On' : 'Off'}</span>
              </div>
            </Field>
            <Field label="Encrypted connection (TLS)" hint="Improves security by encrypting the connection to the pool.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={fallback.fallbackTLS}
                  aria-label="Fallback pool Encrypted connection TLS"
                  onClick={() => {
                    const nextTLS = !fallback.fallbackTLS;
                    fallback.setFallbackTLS(nextTLS);
                    const opt = fallback.fallbackPoolKey && fallback.fallbackPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === fallback.fallbackPoolKey) : null;
                    if (opt?.tlsPort != null) fallback.setFallbackStratumPort(nextTLS ? opt.tlsPort : opt.port);
                  }}
                  className={`switch ${fallback.fallbackTLS ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${fallback.fallbackTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-normal">{fallback.fallbackTLS ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}
