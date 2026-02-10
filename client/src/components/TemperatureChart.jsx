import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-[var(--c-border)] rounded-lg p-3 text-sm shadow-xl">
      <div className="text-text-secondary text-xs mb-1">{formatTime(label)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(1)} {entry.dataKey === 'power' ? 'W' : '\u00B0C'}
        </div>
      ))}
    </div>
  );
}

/** All available temperature / power series */
const SERIES = [
  { key: 'temp',    name: 'ASIC Temp', color: '#ef4444', width: 2,   dash: undefined, axis: 'temp' },
  { key: 'vrTemp',  name: 'VR Temp',   color: '#fb923c', width: 1.5, dash: '4 2',     axis: 'temp' },
  { key: 'power',   name: 'Power',     color: '#22c55e', width: 2,   dash: undefined, axis: 'power' },
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
            className="flex items-center gap-1.5 text-xs cursor-pointer select-none transition-opacity"
            style={{ opacity: off ? 0.35 : 1 }}
          >
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-text-secondary">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function TemperatureChart({ history }) {
  const [hidden, setHidden] = useState(new Set());

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
      <div className="bg-surface-card rounded-xl p-5 border border-[var(--c-border)] h-72 flex items-center justify-center">
        <span className="text-text-secondary text-sm">Collecting temperature data...</span>
      </div>
    );
  }

  // Determine which axes are still visible so we can hide unused Y-axes
  const showTempAxis = SERIES.some((s) => s.axis === 'temp' && !hidden.has(s.key));
  const showPowerAxis = SERIES.some((s) => s.axis === 'power' && !hidden.has(s.key));

  return (
    <div className="bg-surface-card rounded-xl p-5 border border-[var(--c-border)]">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Temperature & Power
      </h3>
      <ClickableLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-chart-grid)" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="var(--c-chart-axis)"
            fontSize={11}
            tickCount={6}
          />
          {showTempAxis && (
            <YAxis yAxisId="temp" stroke="#ef4444" fontSize={11} tickFormatter={(v) => `${v}\u00B0`} />
          )}
          {showPowerAxis && (
            <YAxis yAxisId="power" orientation="right" stroke="#22c55e" fontSize={11} tickFormatter={(v) => `${v}W`} />
          )}
          {/* Hidden axes still needed so hidden-then-reshown lines have an axis ref */}
          {!showTempAxis && <YAxis yAxisId="temp" hide />}
          {!showPowerAxis && <YAxis yAxisId="power" hide />}
          <Tooltip content={<CustomTooltip />} />
          {SERIES.map((s) =>
            hidden.has(s.key) ? null : (
              <Line
                key={s.key}
                yAxisId={s.axis}
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
