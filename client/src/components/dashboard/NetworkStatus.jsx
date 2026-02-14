import { formatDifficulty, formatNumber, formatPrice } from '@/lib/formatters';

export default function NetworkStatus({ data }) {
  if (!data) return null;

  const { blockHeight, difficulty, fees, prices, networkDifficulty } = data;

  const diffChange = difficulty?.difficultyChange;
  const diffChangeStr = diffChange != null
    ? `${diffChange > 0 ? '+' : ''}${diffChange.toFixed(2)}%`
    : '--';
  const diffProgressPct = difficulty?.progressPercent;

  const HALVING_INTERVAL = 210_000;
  const LAST_HALVING = 840_000;
  const halvingPct = blockHeight != null
    ? ((blockHeight - LAST_HALVING) / HALVING_INTERVAL) * 100
    : null;
  const blocksUntilHalving = blockHeight != null
    ? LAST_HALVING + HALVING_INTERVAL - blockHeight
    : null;

  const adjustedTimeAvg = difficulty?.adjustedTimeAvg;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Block Height */}
      <div className="card">
        <div className="stat-label mb-1">Block Height</div>
        <div className="text-2xl font-bold text-body">{formatNumber(blockHeight)}</div>
        {halvingPct != null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-standalone mb-1">
              <span>Halving Epoch</span>
              <span>{halvingPct.toFixed(1)}% ({formatNumber(blocksUntilHalving)} left)</span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-1.5">
              <div
                className="bg-accent rounded-full h-1.5 transition-all"
                style={{ width: `${Math.min(halvingPct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-standalone mt-1">
              Avg block time: {adjustedTimeAvg != null ? `${(adjustedTimeAvg / 60000).toFixed(1)} min` : '--'}
            </div>
          </div>
        )}
      </div>

      {/* Network Difficulty */}
      <div className="card">
        <div className="stat-label mb-1">Network Difficulty</div>
        <div className="text-2xl font-bold text-body">
          {formatDifficulty(networkDifficulty)}
        </div>
        {diffProgressPct != null && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-muted-standalone mb-1">
              <span>Retarget</span>
              <span>{diffProgressPct.toFixed(1)}% ({formatNumber(difficulty?.remainingBlocks)} left)</span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-1.5">
              <div
                className="bg-accent rounded-full h-1.5 transition-all"
                style={{ width: `${Math.min(diffProgressPct, 100)}%` }}
              />
            </div>
          </div>
        )}
        <div className="text-xs mt-1">
          <span className="text-muted-standalone">Next adjustment: </span>
          <span>{diffChangeStr}</span>
        </div>
      </div>

      {/* BTC Price */}
      <div className="card">
        <div className="stat-label mb-1">BTC Price</div>
        <div className="text-2xl font-bold text-body">{formatPrice(prices?.USD)}</div>
        {prices?.EUR && (
          <div className="text-sm text-muted-standalone mt-1">
            EUR {formatNumber(prices.EUR)}
          </div>
        )}
      </div>

      {/* Fee Estimates */}
      <div className="card">
        <div className="stat-label mb-2">Fee Estimates</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-standalone text-sm">High Priority</span>
            <span className="text-sm font-medium">{fees?.fastestFee ?? '--'} sat/vB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-standalone text-sm">Medium</span>
            <span className="text-sm font-medium">{fees?.halfHourFee ?? '--'} sat/vB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-standalone text-sm">Low Priority</span>
            <span className="text-sm font-medium">{fees?.hourFee ?? '--'} sat/vB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
