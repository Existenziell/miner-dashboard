import { formatNumber, formatBestDiff } from '../lib/formatters';

export default function SharesCard({ data }) {
  if (!data) return null;

  const accepted = data.sharesAccepted ?? 0;
  const rejected = data.sharesRejected ?? 0;
  const total = accepted + rejected;
  const rejectRatePct = total > 0 ? (rejected / total) * 100 : 0;
  const rejectRate = total > 0 ? rejectRatePct.toFixed(2) : '0.00';
  // Reject rate colour: green < 0.1%, orange 0.1–1%, red > 1%
  const rejectRateColor =
    rejectRatePct < 0.1 ? 'text-success' : rejectRatePct <= 1 ? 'text-warning' : 'text-danger';

  return (
    <div className="bg-surface-card rounded-xl p-5 border border-[var(--c-border)]">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Shares & Performance</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-text-secondary text-xs">Accepted</div>
          <div className="text-xl font-bold">{formatNumber(accepted)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Rejected</div>
          <div className="text-text-primary text-xl font-bold">{formatNumber(rejected)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Reject Rate</div>
          <div className={`${rejectRateColor} text-xl font-semibold`}>{rejectRate}%</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Best Diff (All-time)</div>
          <div className="text-text-primary text-lg font-bold">{formatBestDiff(data.bestDiff)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Best Diff (Session)</div>
          <div className="text-text-primary text-lg font-bold">{formatBestDiff(data.bestSessionDiff)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Pool Difficulty</div>
          <div className="text-text-primary text-lg font-semibold">{formatNumber(data.poolDifficulty)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Ping RTT</div>
          <div className="text-text-primary text-lg font-semibold">
            {data.lastpingrtt != null ? `${data.lastpingrtt.toFixed(1)} ms` : '--'}
          </div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Ping Loss</div>
          <div className="text-text-primary text-lg font-semibold">
            {data.recentpingloss != null ? `${data.recentpingloss}%` : '--'}
          </div>
        </div>
        <div>
          <div className="text-text-secondary text-xs">Block Found</div>
          <div className={`text-lg font-bold ${data.foundBlocks || data.blockFound ? 'text-success' : 'text-text-secondary'}`}>
            {data.foundBlocks || data.totalFoundBlocks || data.blockFound ? `${data.totalFoundBlocks ?? data.foundBlocks ?? 'YES!'}` : 'Not yet'}
          </div>
        </div>
      </div>

      {/* Duplicate HW nonces */}
      {data.duplicateHWNonces > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--c-border)]">
          <div className="text-sm">
            <span className="text-text-secondary">Duplicate HW Nonces:</span>{' '}
            <span className="text-warning font-medium">{data.duplicateHWNonces}</span>
          </div>
        </div>
      )}
    </div>
  );
}
