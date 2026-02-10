import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { getChartColors } from '../lib/themeColors';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-card">
      <div className="text-muted-standalone text-xs mb-1">{formatTime(label)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(2)} GH/s
        </div>
      ))}
    </div>
  );
}

/** All available hashrate series — distinct hues (no yellow/orange cluster). */
const SERIES = [
  { key: 'hashRate',     name: 'Instant',  color: '#f7931a', width: 2,   dash: undefined },
  { key: 'hashRate_1m',  name: '1m Avg',   color: '#06b6d4', width: 1.5, dash: '6 3' },
  { key: 'hashRate_10m', name: '10m Avg',  color: '#a855f7', width: 1.5, dash: '4 2' },
  { key: 'hashRate_1h',  name: '1h Avg',   color: '#22c55e', width: 1.5, dash: '8 4' },
  { key: 'hashRate_1d',  name: '1d Avg',   color: '#3b82f6', width: 1.5, dash: '2 2' },
];

function ClickableLegend({ series, hidden, onToggle }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
      {series.map((s) => {
        const off = hidden.has(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onToggle(s.key)}
            className="legend-btn"
            style={{ opacity: off ? 0.35 : 1 }}
          >
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-standalone">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function HashrateChart({ history }) {
  const [hidden, setHidden] = useState(new Set());
  const { resolved } = useTheme();
  const chartColors = getChartColors(resolved === 'dark');

  const toggle = useCallback((key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!history || history.length < 2) {
    return (
      <div className="card h-72 flex items-center justify-center">
        <span className="text-muted-standalone text-sm">Collecting hashrate data...</span>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title mb-3">Hashrate</h3>
      <ClickableLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke={chartColors.axis}
            fontSize={11}
            tickCount={6}
          />
          <YAxis stroke={chartColors.axis} fontSize={11} tickFormatter={(v) => `${v.toFixed(0)}`} />
          <Tooltip content={<CustomTooltip />} />
          {SERIES.map((s) =>
            hidden.has(s.key) ? null : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.width}
                strokeDasharray={s.dash}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
