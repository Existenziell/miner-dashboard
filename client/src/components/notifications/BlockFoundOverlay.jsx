import { useEffect, useId, useState } from 'react';
import confetti from 'canvas-confetti';
import { fetchNetworkStatus } from '@/lib/api';
import {
  BLOCK_FOUND_CONFETTI_DURATION_MS,
  BLOCK_FOUND_CONFETTI_FIRST_BURST_DELAY_MS,
  BLOCK_FOUND_CONFETTI_OPTIONS,
  BLOCK_FOUND_CONFETTI_SECOND_BURST_DELAY_MS,
  MEMPOOL_BASE_URL,
} from '@/lib/constants';
import {
  formatBytes,
  formatNumber,
  formatTimeAgo,
  formatWeight,
} from '@/lib/formatters';

/**
 * Full-screen overlay when the miner finds a block.
 */
export default function BlockFoundOverlay({ onDismiss, blockFoundSnapshot, blockDetailsOverride }) {
  const titleId = useId();
  const descriptionId = useId();
  const [blockDetails, setBlockDetails] = useState(null);

  // Fetch latest block from network API unless override provided (e.g. Settings preview with fake data)
  useEffect(() => {
    if (blockDetailsOverride) return;
    let cancelled = false;
    fetchNetworkStatus()
      .then((data) => {
        if (!cancelled && data?.previousBlock) setBlockDetails(data.previousBlock);
      })
      .catch(() => {
        if (!cancelled) setBlockDetails(null);
      });
    return () => { cancelled = true; };
  }, [blockDetailsOverride]);

  // Confetti on mount; respect reduced motion
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const end = Date.now() + BLOCK_FOUND_CONFETTI_DURATION_MS;
    const { sideLeft, sideRight, firstBurst, secondBurst } = BLOCK_FOUND_CONFETTI_OPTIONS;

    const frame = () => {
      confetti({ ...sideLeft, origin: { x: 0 } });
      confetti({ ...sideRight, origin: { x: 1 } });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    const t1 = setTimeout(() => {
      confetti({ ...firstBurst, origin: { y: 0.6 } });
    }, BLOCK_FOUND_CONFETTI_FIRST_BURST_DELAY_MS);
    const t2 = setTimeout(() => {
      confetti({ ...secondBurst, origin: { y: 0.5, x: 0.5 } });
    }, BLOCK_FOUND_CONFETTI_SECOND_BURST_DELAY_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Escape to dismiss
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  const totalBlocks = blockFoundSnapshot?.totalFoundBlocks;
  const block = blockDetailsOverride ?? blockDetails;
  const hasBlockInfo = block && (block.height != null || block.tx_count != null || block.weight != null || block.size != null);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 min-h-screen h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className="card max-w-md w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-2xl font-bold text-accent mb-2"
        >
          Block found
        </h2>
        <p id={descriptionId} className="text-muted dark:text-muted-dark text-sm mb-2">
          Congratulation, your miner found a block!
        </p>
        {typeof totalBlocks === 'number' && totalBlocks > 0 && (
          <p className="text-fg dark:text-fg-dark text-sm font-medium mb-3">
            Total blocks found: {totalBlocks}
          </p>
        )}

        {hasBlockInfo && (
          <div className="mt-3 mb-4 p-4 rounded-lg bg-surface-light dark:bg-surface-light-dark border border-edge dark:border-edge-dark text-left">
            <div className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wide mb-2">
              Block details
            </div>
            {block.height != null && (
              <div className="flex justify-between text-sm gap-4 mb-1">
                <span className="text-muted dark:text-muted-dark">Height</span>
                <span className="font-medium text-fg dark:text-fg-dark">{formatNumber(block.height)}</span>
              </div>
            )}
            {block.id && (
              <div className="flex justify-between text-sm gap-4 mb-1 items-center">
                <span className="text-muted dark:text-muted-dark shrink-0">Block ID</span>
                <a
                  href={`${MEMPOOL_BASE_URL}/block/${block.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline truncate font-mono text-xs"
                >
                  {block.id.slice(0, 12)}…
                </a>
              </div>
            )}
            {block.timestamp != null && (
              <div className="flex justify-between text-sm gap-4 mb-1">
                <span className="text-muted dark:text-muted-dark">Time</span>
                <span className="text-fg dark:text-fg-dark">{formatTimeAgo(block.timestamp)}</span>
              </div>
            )}
            {block.tx_count != null && (
              <div className="flex justify-between text-sm gap-4 mb-1">
                <span className="text-muted dark:text-muted-dark">Transactions</span>
                <span className="text-fg dark:text-fg-dark">{formatNumber(block.tx_count)}</span>
              </div>
            )}
            {block.size != null && (
              <div className="flex justify-between text-sm gap-4 mb-1">
                <span className="text-muted dark:text-muted-dark">Size</span>
                <span className="text-fg dark:text-fg-dark">{formatBytes(block.size)}</span>
              </div>
            )}
            {block.weight != null && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted dark:text-muted-dark">Weight</span>
                <span className="text-fg dark:text-fg-dark">{formatWeight(block.weight)}</span>
              </div>
            )}
          </div>
        )}

        {(!totalBlocks || totalBlocks <= 0) && !hasBlockInfo && <div className="mb-6" />}
        {((totalBlocks && totalBlocks > 0) || hasBlockInfo) && <div className="mb-4" />}
        <button
          type="button"
          onClick={onDismiss}
          className="btn-primary"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
