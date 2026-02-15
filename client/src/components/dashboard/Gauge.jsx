/**
 * Circular gauge for a single metric: 270° arc open at the bottom (speedometer style).
 * Ring fill is 0–100%; ring and value use the given Tailwind color.
 */
import { useMemo } from 'react';
import { GAUGE_RADIUS } from '@/lib/constants';

function getArcPath(radius) {
  const startX = 50 + radius * Math.cos((135 * Math.PI) / 180);
  const startY = 50 + radius * Math.sin((135 * Math.PI) / 180);
  const endX = 50 + radius * Math.cos((45 * Math.PI) / 180);
  const endY = 50 + radius * Math.sin((45 * Math.PI) / 180);
  return `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
}

export default function Gauge({ label, value, sub, color = 'text-accent', percent = null }) {
  const arcPath = useMemo(() => getArcPath(GAUGE_RADIUS), []);
  const fillPercent = percent != null ? Math.max(0, Math.min(100, percent)) : 0;

  return (
    <div className="gauge-card hover:border-accent/20 transition-colors flex flex-col items-center">
      {/* Centered, with max size so ring stays inside card and isn't cut off */}
      <div className={`relative w-52 h-52 sm:w-52 sm:h-52 max-w-full flex shrink-0 ${color}`} aria-hidden>
        <svg
          className="w-full h-full overflow-visible"
          viewBox="-8 -8 116 116"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
        >
          {/* Track (muted) – full 270° arc */}
          <path
            d={arcPath}
            pathLength="100"
            strokeDasharray="100 0"
            className="stroke-muted/40"
            stroke="currentColor"
          />
          {/* Fill (green/orange/red) */}
          <path
            d={arcPath}
            pathLength="100"
            strokeDasharray={`${fillPercent} ${100 - fillPercent}`}
            stroke="currentColor"
            className="transition-[stroke-dasharray] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl sm:text-2xl font-bold leading-tight tabular-nums">{value}</span>
          {sub && (
            <span className="text-sm text-muted mt-0.5 max-w-[90%] truncate">
              {sub}
            </span>
          )}
        </div>
      </div>
      <div className="text-muted font-medium -mt-6 text-center">{label}</div>
    </div>
  );
}
