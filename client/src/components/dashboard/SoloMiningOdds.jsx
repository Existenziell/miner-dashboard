import { useEffect, useState } from 'react';
import { useMiner } from '@/context/MinerContext';
import { ODDS_COLLAPSED_KEY } from '@/lib/constants';
import {
  computeSoloOdds,
  formatChancePct,
  formatExpectedTime,
} from '@/lib/soloMiningOdds';

const HASHRATE_PRESETS = [
  { value: 0.1, label: '0.1 TH/s' },
  { value: 0.25, label: '0.25 TH/s' },
  { value: 0.5, label: '0.5 TH/s' },
  { value: 1, label: '1 TH/s' },
  { value: 2, label: '2 TH/s' },
  { value: 5, label: '5 TH/s' },
  { value: 10, label: '10 TH/s' },
  { value: 14, label: '14 TH/s (S9)' },
  { value: 20, label: '20 TH/s' },
  { value: 50, label: '50 TH/s' },
  { value: 100, label: '100 TH/s' },
  { value: 200, label: '200 TH/s' },
];

const CUSTOM_VALUE = 'custom';

export default function SoloMiningOdds({ network }) {
  const { data: minerData } = useMiner();
  const [collapsed, setCollapsed] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem(ODDS_COLLAPSED_KEY) === 'true'
  );
  const [presetKey, setPresetKey] = useState(CUSTOM_VALUE);
  const [customTh, setCustomTh] = useState('');
  const [initializedFromMiner, setInitializedFromMiner] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ODDS_COLLAPSED_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const thPerSec =
    presetKey === CUSTOM_VALUE
      ? parseFloat(customTh, 10)
      : Number(presetKey);
  const validTh = Number.isFinite(thPerSec) && thPerSec > 0;

  useEffect(() => {
    if (initializedFromMiner || !minerData?.hashRate) return;
    const minerTh = minerData.hashRate / 1000;
    const match = HASHRATE_PRESETS.find((p) => Math.abs(p.value - minerTh) < 0.01);
    queueMicrotask(() => {
      if (match) {
        setPresetKey(match.value);
      } else {
        setPresetKey(CUSTOM_VALUE);
        setCustomTh(minerTh > 0 ? Number(minerTh).toFixed(2) : '');
      }
      setInitializedFromMiner(true);
    });
  }, [minerData?.hashRate, initializedFromMiner]);

  const networkDifficulty = network?.networkDifficulty ?? null;
  const blockTimeMs = network?.difficulty?.adjustedTimeAvg ?? null;
  const hasNetwork = Number.isFinite(networkDifficulty) && networkDifficulty > 0;

  const odds =
    hasNetwork && validTh
      ? computeSoloOdds(thPerSec, networkDifficulty, blockTimeMs)
      : null;

  return (
    <div className={`card${collapsed ? ' card--collapsed' : ''}`}>
      <div className="card-header-wrapper">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`card-header cursor-pointer border-0 focus:outline-none w-full flex items-center justify-between gap-2${collapsed ? ' rounded-b-md' : ''}`}
          aria-expanded={!collapsed}
          aria-label="Solo Mining Odds, Expand or collapse"
        >
          <h3 className="card-header-title">Solo Mining Odds</h3>
          <span className="text-muted text-sm shrink-0">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>
      {!collapsed && (
      <div className="space-y-4">
        <div>
          <label htmlFor="solo-odds-hashrate" className="stat-label block mb-1">
            Hashrate (TH/s)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              id="solo-odds-preset"
              aria-label="Hashrate preset"
              value={presetKey === CUSTOM_VALUE ? CUSTOM_VALUE : String(presetKey)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === CUSTOM_VALUE) {
                  setPresetKey(CUSTOM_VALUE);
                } else {
                  const n = parseFloat(v, 10);
                  setPresetKey(Number.isFinite(n) ? n : CUSTOM_VALUE);
                  if (Number.isFinite(n)) setCustomTh(String(n));
                }
              }}
              className="rounded-md border border-edge dark:border-edge-dark bg-surface dark:bg-surface-dark text-normal dark:text-normal-dark px-3 py-2 min-w-40 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {HASHRATE_PRESETS.map((p) => (
                <option key={p.value} value={String(p.value)}>
                  {p.label}
                </option>
              ))}
              <option value={CUSTOM_VALUE}>Custom</option>
            </select>
            {presetKey === CUSTOM_VALUE && (
              <input
                id="solo-odds-hashrate"
                type="number"
                min="0.01"
                step="0.1"
                placeholder="e.g. 14"
                value={customTh}
                onChange={(e) => setCustomTh(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(customTh, 10);
                  if (Number.isFinite(n) && n > 0) setCustomTh(Number(n).toFixed(2));
                }}
                aria-label="Hashrate in TH/s"
                className="rounded-md border border-edge dark:border-edge-dark bg-surface dark:bg-surface-dark text-normal dark:text-normal-dark px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
          </div>
        </div>

        {!hasNetwork && (
          <p className="text-sm text-muted">
            Need network data to compute odds.
          </p>
        )}

        {hasNetwork && !validTh && (
          <p className="text-sm text-muted">
            Enter a hashrate to see odds.
          </p>
        )}

        {odds && (
          <>
            <div className="space-y-0 border-t border-edge dark:border-edge-dark pt-3 text-sm">
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Expected time to block</span>
                <span className="font-medium tabular-nums">{formatExpectedTime(odds.expectedSeconds)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 1 day</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance1DayPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 7 days</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance7DaysPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 30 days</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance30DaysPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 90 days</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance90DaysPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 1 year</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance1YearPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-edge dark:border-edge-dark">
                <span className="text-muted">Chance in 2 years</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance2YearsPct)}</span>
              </div>
              <div className="flex justify-between items-baseline py-1.5">
                <span className="text-muted">Chance in 5 years</span>
                <span className="font-medium tabular-nums">{formatChancePct(odds.chance5YearsPct)}</span>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
