import { useMiner } from '@/context/MinerContext';
import { formatBestDiff,formatNumber } from '@/lib/formatters';

export default function MinerShares() {
  const { data } = useMiner();
  if (!data) return null;

  const accepted = data.sharesAccepted ?? 0;
  const rejected = data.sharesRejected ?? 0;
  const total = accepted + rejected;
  const rejectRatePct = total > 0 ? (rejected / total) * 100 : 0;
  const rejectRate = total > 0 ? rejectRatePct.toFixed(2) : '0.00';
  // Reject rate colour: green < 0.1%, orange 0.1–1%, red > 1%
  const rejectRateColor =
    rejectRatePct < 0.1 ? 'text-success dark:text-success-dark' : rejectRatePct <= 1 ? 'text-warning dark:text-warning-dark' : 'text-danger dark:text-danger-dark';

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h3 className="card-header-title">Shares & Performance</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <div className="stat-label">Accepted</div>
          <div className="text-xl font-bold">{formatNumber(accepted)}</div>
        </div>
        <div>
          <div className="stat-label">Rejected</div>
          <div className="text-body text-xl font-bold">{formatNumber(rejected)}</div>
        </div>
        <div>
          <div className="stat-label">Reject Rate</div>
          <div className={`${rejectRateColor} text-xl font-semibold`}>{rejectRate}%</div>
        </div>
        <div>
          <div className="stat-label">Best Diff (All-time)</div>
          <div className="text-body text-lg font-bold">{formatBestDiff(data.bestDiff)}</div>
        </div>
        <div>
          <div className="stat-label">Best Diff (Session)</div>
          <div className="text-body text-lg font-bold">{formatBestDiff(data.bestSessionDiff)}</div>
        </div>
        <div>
          <div className="stat-label">Pool Difficulty</div>
          <div className="text-body text-lg font-semibold">{formatNumber(data.poolDifficulty)}</div>
        </div>
        <div>
          <div className="stat-label">Ping RTT</div>
          <div className="text-body text-lg font-semibold">
            {data.lastpingrtt != null ? `${data.lastpingrtt.toFixed(1)} ms` : '--'}
          </div>
        </div>
        <div>
          <div className="stat-label">Ping Loss</div>
          <div className="text-body text-lg font-semibold">
            {data.recentpingloss != null ? `${data.recentpingloss}%` : '--'}
          </div>
        </div>
        <div>
          <div className="stat-label">Block Found</div>
          <div className={`text-lg font-bold ${data.foundBlocks || data.blockFound ? 'text-success dark:text-success-dark' : 'text-muted'}`}>
            {data.foundBlocks || data.totalFoundBlocks || data.blockFound ? `${data.totalFoundBlocks ?? data.foundBlocks ?? 'YES!'}` : 'Not yet'}
          </div>
        </div>
      </div>

      {/* Reject reasons (when miner provides them, or note when it doesn't) */}
      {rejected > 0 && (
        <div className="mt-6 pt-3 border-t border-default">
          <div className="text-sm font-medium text-muted mb-1">Reject reasons</div>
          {(() => {
            const raw = data.sharesRejectedReasons ?? data.shares_rejected_reasons;
            const reasons = Array.isArray(raw)
              ? raw.map((r) => ({
                message: r.message ?? r.reason ?? r.msg ?? 'Unknown',
                count: Number(r.count ?? r.cnt ?? 0) || 0,
              })).filter((r) => r.count > 0)
              : [];
            if (reasons.length > 0) {
              return (
                <ul className="text-sm space-y-0.5">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-body">{r.message}</span>
                      <span className="text-warning dark:text-warning-dark font-medium shrink-0">{formatNumber(r.count)}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p className="text-sm text-muted">This device does not report reject reasons in its API.</p>
            );
          })()}
        </div>
      )}

      {/* Duplicate HW nonces */}
      {data.duplicateHWNonces > 0 && (
        <div className="mt-4 pt-3 border-t border-default">
          <div className="text-sm">
            <span className="text-muted">Duplicate HW Nonces:</span>{' '}
            <span className="text-warning dark:text-warning-dark font-medium">{data.duplicateHWNonces}</span>
          </div>
        </div>
      )}
    </div>
  );
}
