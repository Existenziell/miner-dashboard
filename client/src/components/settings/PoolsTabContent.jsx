import { useMinerSettingsContext } from '@/context/MinerSettingsContext';
import {
  DEFAULT_STRATUM_PORT,
  MAX_STRATUM_PASSWORD_LENGTH,
  MAX_STRATUM_PORT,
  MAX_STRATUM_USER_LENGTH,
  MIN_STRATUM_PORT,
  SOLO_POOLS,
} from '@/lib/constants';
import { Field } from '@/components/settings/Field';

export function PoolsTabContent({ miner }) {
  const form = useMinerSettingsContext();
  const {
    POOL_MODE_OPTIONS,
    poolMode,
    setPoolMode,
    stratumTcpKeepalive,
    setStratumTcpKeepalive,
    primaryPoolKey,
    setPrimaryPoolKey,
    primaryCustomURL,
    setPrimaryCustomURL,
    primaryStratumPort,
    setPrimaryStratumPort,
    primaryStratumUser,
    setPrimaryStratumUser,
    primaryPassword,
    setPrimaryPassword,
    primaryTLS,
    setPrimaryTLS,
    primaryExtranonceSubscribe,
    setPrimaryExtranonceSubscribe,
    fallbackPoolKey,
    setFallbackPoolKey,
    fallbackCustomURL,
    setFallbackCustomURL,
    fallbackStratumPort,
    setFallbackStratumPort,
    fallbackStratumUser,
    setFallbackStratumUser,
    fallbackPassword,
    setFallbackPassword,
    fallbackTLS,
    setFallbackTLS,
    fallbackExtranonceSubscribe,
    setFallbackExtranonceSubscribe,
    validation,
  } = form;
  const {
    primaryStratumUserError,
    fallbackStratumUserError,
    primaryPortValid,
    fallbackPortValid,
    primaryCustomURLError,
    fallbackCustomURLError,
    primaryPasswordError,
    fallbackPasswordError,
  } = validation;

  return (
    <>
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Configuration</h3>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-4 md:max-w-1/3 mb-4">
            <Field label="Pool mode" hint="Failover uses fallback when primary is down; Dual uses both pools.">
              <select
                value={poolMode}
                onChange={(e) => setPoolMode(e.target.value)}
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
            <Field label="Enable Stratum TCP Keepalive" hint="Prevents connection timeouts by sending a keepalive packet every 30 seconds.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={stratumTcpKeepalive}
                  aria-label="Enable Stratum TCP Keepalive"
                  onClick={() => setStratumTcpKeepalive((v) => !v)}
                  className={`switch ${stratumTcpKeepalive ? 'switch-on' : 'switch-off'}`}
                >
                  <span className={`switch-thumb ${stratumTcpKeepalive ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                </button>
                <span className="text-sm text-body">{stratumTcpKeepalive ? 'On' : 'Off'}</span>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 pt-4 border-t border-edge dark:border-edge-dark">
            <div className="flex flex-col gap-4 pr-4 md:border-r md:border-edge dark:md:border-edge-dark">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg mb-0">
                  {poolMode === 'dual' ? 'Pool 1' : 'Pool 1 (Primary)'}
                </p>
                {!(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.stratumURL || '').trim() ? (
                  <span className="badge-success">ACTIVE</span>
                ) : null}
              </div>
              <Field label="Pool" hint="Solo mining pool for block templates. See Docs for full list.">
                <select
                  value={primaryPoolKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrimaryPoolKey(v);
                    const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                    if (opt) setPrimaryStratumPort(primaryTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
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
              {primaryPoolKey === 'other' && (
                <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                  <input
                    type="text"
                    value={primaryCustomURL}
                    onChange={(e) => setPrimaryCustomURL(e.target.value)}
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
                  value={primaryStratumPort}
                  onChange={(e) => setPrimaryStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                  className={`input ${!primaryPortValid ? 'input-danger' : ''}`}
                  aria-invalid={!primaryPortValid}
                />
              </Field>
              <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
                <input
                  type="text"
                  value={primaryStratumUser}
                  onChange={(e) => setPrimaryStratumUser(e.target.value)}
                  placeholder="bc1q..."
                  maxLength={MAX_STRATUM_USER_LENGTH}
                  className={`input ${primaryStratumUserError ? 'input-danger' : ''}`}
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
                  value={primaryPassword}
                  onChange={(e) => setPrimaryPassword(e.target.value)}
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
              <Field label="Enable Extranonce Subscribe" hint="Improves mining efficiency by allowing the miner to use a longer extranonce.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={primaryExtranonceSubscribe}
                    aria-label="Primary pool Enable Extranonce Subscribe"
                    onClick={() => setPrimaryExtranonceSubscribe((v) => !v)}
                    className={`switch ${primaryExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${primaryExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{primaryExtranonceSubscribe ? 'On' : 'Off'}</span>
                </div>
              </Field>
              <Field label="Encrypted connection (TLS)" hint="Improves security by encrypting the connection to the pool.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={primaryTLS}
                    aria-label="Primary pool Encrypted connection TLS"
                    onClick={() => {
                      const nextTLS = !primaryTLS;
                      setPrimaryTLS(nextTLS);
                      const opt = primaryPoolKey && primaryPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === primaryPoolKey) : null;
                      if (opt?.tlsPort != null) setPrimaryStratumPort(nextTLS ? opt.tlsPort : opt.port);
                    }}
                    className={`switch ${primaryTLS ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${primaryTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{primaryTLS ? 'On' : 'Off'}</span>
                </div>
              </Field>
            </div>
            <div className="flex flex-col gap-4 pt-4 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg mb-0">
                  {poolMode === 'dual' ? 'Pool 2' : 'Pool 2 (Fallback)'}
                </p>
                {(miner?.stratum?.usingFallback ?? miner?.isUsingFallbackStratum === 1) && (miner?.fallbackStratumURL || '').trim() ? (
                  <span className="badge-warning">ACTIVE</span>
                ) : null}
              </div>
              <Field label="Pool" hint="Used when primary is unreachable.">
                <select
                  value={fallbackPoolKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFallbackPoolKey(v);
                    const opt = v && v !== 'other' ? SOLO_POOLS.find((o) => o.identifier === v) : null;
                    if (opt) setFallbackStratumPort(fallbackTLS && opt.tlsPort != null ? opt.tlsPort : opt.port);
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
              {fallbackPoolKey === 'other' && (
                <Field label="Pool URL" hint="Do not include 'stratum+tcp://' or port.">
                  <input
                    type="text"
                    value={fallbackCustomURL}
                    onChange={(e) => setFallbackCustomURL(e.target.value)}
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
                  value={fallbackStratumPort}
                  onChange={(e) => setFallbackStratumPort(Math.min(MAX_STRATUM_PORT, Math.max(MIN_STRATUM_PORT, Number(e.target.value) || DEFAULT_STRATUM_PORT)))}
                  className={`input ${!fallbackPortValid ? 'input-danger' : ''}`}
                  aria-invalid={!fallbackPortValid}
                />
              </Field>
              <Field label="Worker / payout address" hint="Bitcoin address or pool username.">
                <input
                  type="text"
                  value={fallbackStratumUser}
                  onChange={(e) => setFallbackStratumUser(e.target.value)}
                  placeholder="bc1q..."
                  maxLength={MAX_STRATUM_USER_LENGTH}
                  className={`input ${fallbackStratumUserError ? 'input-danger' : ''}`}
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
                  value={fallbackPassword}
                  onChange={(e) => setFallbackPassword(e.target.value)}
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
              <Field label="Enable Extranonce Subscribe" hint="Improves mining efficiency by allowing the miner to use a longer extranonce.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fallbackExtranonceSubscribe}
                    aria-label="Fallback pool Enable Extranonce Subscribe"
                    onClick={() => setFallbackExtranonceSubscribe((v) => !v)}
                    className={`switch ${fallbackExtranonceSubscribe ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${fallbackExtranonceSubscribe ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{fallbackExtranonceSubscribe ? 'On' : 'Off'}</span>
                </div>
              </Field>
              <Field label="Encrypted connection (TLS)" hint="Improves security by encrypting the connection to the pool.">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fallbackTLS}
                    aria-label="Fallback pool Encrypted connection TLS"
                    onClick={() => {
                      const nextTLS = !fallbackTLS;
                      setFallbackTLS(nextTLS);
                      const opt = fallbackPoolKey && fallbackPoolKey !== 'other' ? SOLO_POOLS.find((o) => o.identifier === fallbackPoolKey) : null;
                      if (opt?.tlsPort != null) setFallbackStratumPort(nextTLS ? opt.tlsPort : opt.port);
                    }}
                    className={`switch ${fallbackTLS ? 'switch-on' : 'switch-off'}`}
                  >
                    <span className={`switch-thumb ${fallbackTLS ? 'switch-thumb-on' : 'switch-thumb-off'}`} />
                  </button>
                  <span className="text-sm text-body">{fallbackTLS ? 'On' : 'Off'}</span>
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
