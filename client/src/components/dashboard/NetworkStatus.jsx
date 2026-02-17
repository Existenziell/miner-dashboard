import {
  BITCOIN_HALVING_INTERVAL_BLOCKS,
  BITCOIN_LAST_HALVING_HEIGHT,
  MEMPOOL_BASE_URL,
} from '@/lib/constants';
import {
  formatBytes,
  formatDifficulty,
  formatHash,
  formatNumber,
  formatPrice,
  formatTimeAgo,
  formatWeight,
} from '@/lib/formatters';

function BlockCard({ label, block }) {
  if (!block) return null;
  const { id, height, timestamp, tx_count, size, weight, extras } = block;
  const poolName = extras?.pool?.name;
  const reward = extras?.reward;
  return (
    <div className="card">
      <div className="stat-label mb-1">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-bold text-normal">{formatNumber(height)}</div>
        {id && (
          <a
            href={`${MEMPOOL_BASE_URL}/block/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline shrink-0 truncate max-w-[50%]"
            title={id}
          >
            {formatHash(id)}
          </a>
        )}
      </div>
      <div className="mt-1.5 space-y-0.5 text-sm">
        <div className="flex justify-between text-muted">
          <span>Time</span>
          <span>{formatTimeAgo(timestamp)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Transactions</span>
          <span>{formatNumber(tx_count)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Size</span>
          <span>{formatBytes(size)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Weight</span>
          <span>{formatWeight(weight)}</span>
        </div>
        {poolName && (
          <div className="flex justify-between text-muted">
            <span>Pool</span>
            <span className="truncate max-w-[60%]" title={poolName}>{poolName}</span>
          </div>
        )}
        {reward != null && (
          <div className="flex justify-between text-muted">
            <span>Reward</span>
            <span>{formatNumber(reward)} sat</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetworkStatus({ data }) {
  if (!data) return null;

  const { blockHeight, difficulty, fees, prices, networkDifficulty, mempool, previousBlock, previousBlock2, previousBlock3 } = data;

  const diffChange = difficulty?.difficultyChange;
  const diffChangeStr = diffChange != null
    ? `${diffChange > 0 ? '+' : ''}${diffChange.toFixed(2)}%`
    : '--';
  const diffProgressPct = difficulty?.progressPercent;

  const halvingPct = blockHeight != null
    ? ((blockHeight - BITCOIN_LAST_HALVING_HEIGHT) / BITCOIN_HALVING_INTERVAL_BLOCKS) * 100
    : null;
  const blocksUntilHalving = blockHeight != null
    ? BITCOIN_LAST_HALVING_HEIGHT + BITCOIN_HALVING_INTERVAL_BLOCKS - blockHeight
    : null;

  const adjustedTimeAvg = difficulty?.adjustedTimeAvg;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Block Height */}
      <div className="card">
        <div className="stat-label mb-1">Block Height</div>
        <div className="text-2xl font-bold text-normal">{formatNumber(blockHeight)}</div>
        {halvingPct != null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Halving Epoch</span>
              <span>{halvingPct.toFixed(1)}% ({formatNumber(blocksUntilHalving)} left)</span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-1.5">
              <div
                className="bg-accent rounded-full h-1.5 transition-all"
                style={{ width: `${Math.min(halvingPct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted mt-1">
              Avg block time: {adjustedTimeAvg != null ? `${(adjustedTimeAvg / 60000).toFixed(1)} min` : '--'}
            </div>
          </div>
        )}
      </div>

      {/* Network Difficulty */}
      <div className="card">
        <div className="stat-label mb-1">Network Difficulty</div>
        <div className="text-2xl font-bold text-normal">
          {formatDifficulty(networkDifficulty)}
        </div>
        {diffProgressPct != null && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-muted mb-1">
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
          <span className="text-muted">Next adjustment: </span>
          <span>{diffChangeStr}</span>
        </div>
      </div>

      {/* BTC Price */}
      <div className="card">
        <div className="stat-label mb-1">BTC Price</div>
        <div className="text-2xl font-bold text-normal">{formatPrice(prices?.USD)}</div>
        {prices?.EUR && (
          <div className="text-sm text-muted mt-1">
            EUR {formatNumber(prices.EUR)}
          </div>
        )}
      </div>

      {/* Fee Estimates */}
      <div className="card">
        <div className="stat-label mb-2">Fee Estimates</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted text-sm">High Priority</span>
            <span className="text-sm font-medium">{fees?.fastestFee ?? '--'} sat/vB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted text-sm">Medium</span>
            <span className="text-sm font-medium">{fees?.halfHourFee ?? '--'} sat/vB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted text-sm">Low Priority</span>
            <span className="text-sm font-medium">{fees?.hourFee ?? '--'} sat/vB</span>
          </div>
        </div>
      </div>

      {/* Second row: Current block (mempool), Previous blocks */}
      {blockHeight != null && (
        <div className="card">
          <div className="stat-label mb-1">Current block</div>
          <div className="text-lg font-bold text-normal">{formatNumber(blockHeight + 1)}</div>
          <div className="mt-1.5 space-y-0.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Pending transactions</span>
              <span>{mempool?.count != null ? formatNumber(mempool.count) : '--'}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Mempool size</span>
              <span>{mempool?.vsize != null ? `${(mempool.vsize / 1e6).toFixed(2)} MB (vB)` : '--'}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Total fee</span>
              <span>{mempool?.total_fee != null ? `${formatNumber(mempool.total_fee)} sat` : '--'}</span>
            </div>
          </div>
        </div>
      )}
      <BlockCard label="Previous block" block={previousBlock} />
      <BlockCard label="2 blocks ago" block={previousBlock2} />
      <BlockCard label="3 blocks ago" block={previousBlock3} />
    </div>
  );
}
