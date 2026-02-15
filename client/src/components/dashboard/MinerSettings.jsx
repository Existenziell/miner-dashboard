import { useMiner } from '@/context/MinerContext';
import { getPoolInfo } from '@/lib/poolUtils';

function SettingRow({ label, value, highlight, truncate, href }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1">
      <span className="text-muted dark:text-muted-dark text-xs shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm text-right ${truncate ? 'truncate max-w-[250px]' : ''}`}
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-sm text-right ${highlight ? 'text-accent font-medium' : 'text-body'} ${truncate ? 'truncate max-w-[250px]' : ''}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
export default function MinerSettings() {
  const { data } = useMiner();
  if (!data) return null;

  const isUsingFallback = data.stratum?.usingFallback ?? data.isUsingFallbackStratum === 1;

  // Get pool-specific data if available
  const poolData = data.stratum?.pools?.[0];

  const primary = getPoolInfo(data.stratumURL);
  const fallback = getPoolInfo(data.fallbackStratumURL);

  // Worker may come as stratumUser, stratum_user (snake_case from device), or nested stratum.pools[0].user
  const primaryWorker = data.stratumUser ?? data.stratum_user ?? poolData?.user ?? '';
  const fallbackWorker = data.fallbackStratumUser ?? data.fallback_stratum_user ?? data.stratum?.pools?.[1]?.user ?? '';

  const primaryMisconfigured = !isUsingFallback && (!(data.stratumURL || '').trim() || !(primaryWorker || '').trim());
  const fallbackMisconfigured = isUsingFallback && (!(data.fallbackStratumURL || '').trim() || !(fallbackWorker || '').trim());

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h3 className="card-header-title">Pool & Settings</h3>
        </div>
      </div>

      {/* Primary Pool */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="label font-semibold">Primary Pool</span>
          {!isUsingFallback && (
            <span className="badge-success">ACTIVE</span>
          )}
        </div>
        {primaryMisconfigured && (
          <p className="notification-warning text-xs mb-2" role="alert">
            Pool may be misconfigured: add Pool URL and Worker in Settings.
          </p>
        )}
        <div className="space-y-0.5">
          <SettingRow label="Name" value={primary.name} href={primary.webUrl} />
          <SettingRow label="URL" value={data.stratumURL ? `${data.stratumURL}:${data.stratumPort || ''}` : '--'} />
          <SettingRow label="Worker" value={primaryWorker || '--'} truncate />
          <SettingRow label="Pool Difficulty" value={poolData?.poolDifficulty ?? data.stratumDifficulty ?? data.poolDifficulty ?? '--'} />
          <SettingRow label="TLS" value={data.stratumTLS ? 'Enabled' : 'Disabled'} />
        </div>
      </div>

      {/* Fallback Pool */}
      <div className="pt-3 border-t border-default">
        <div className="flex items-center gap-2 mb-2">
          <span className="label font-semibold">Fallback Pool</span>
          {isUsingFallback && (
            <span className="badge-warning">ACTIVE</span>
          )}
        </div>
        {fallbackMisconfigured && (
          <p className="notification-warning text-xs mb-2" role="alert">
            Pool may be misconfigured: add Pool URL and Worker in Settings.
          </p>
        )}
        <div className="space-y-0.5">
          <SettingRow label="Name" value={fallback.name === '--' ? 'Not configured' : fallback.name} href={fallback.webUrl} />
          <SettingRow label="URL" value={data.fallbackStratumURL ? `${data.fallbackStratumURL}:${data.fallbackStratumPort || ''}` : '--'} />
          <SettingRow label="Worker" value={fallbackWorker || '--'} truncate />
          <SettingRow label="TLS" value={data.fallbackStratumTLS ? 'Enabled' : 'Disabled'} />
        </div>
      </div>
    </div>
  );
}
