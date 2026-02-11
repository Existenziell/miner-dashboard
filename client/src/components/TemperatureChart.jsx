import { useState, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useMiner } from '../context/MinerContext';
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
          {entry.name}: {entry.value?.toFixed(1)} \u00B0C
        </div>
      ))}
    </div>
  );
}

/** All available temperature series */
const SERIES = [
  { key: 'temp',    name: 'ASIC Temp', color: '#f97316', width: 2,   axis: 'temp' },
  { key: 'vrTemp',  name: 'VR Temp',   color: '#2563eb', width: 1.5, axis: 'temp' },
];

const LEGEND_STORAGE_KEY = 'minerDashboard_chartLegend_temperature';
const SERIES_KEYS = new Set(SERIES.map((s) => s.key));

function loadStoredLegendHidden() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LEGEND_STORAGE_KEY) : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((k) => SERIES_KEYS.has(k)));
  } catch {
    return new Set();
  }
}

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

export default function TemperatureChart() {
  const { history } = useMiner();
  const [hidden, setHidden] = useState(loadStoredLegendHidden);
  const { resolved } = useTheme();
  const chartColors = getChartColors(resolved === 'dark');

  useEffect(() => {
    try {
      localStorage.setItem(LEGEND_STORAGE_KEY, JSON.stringify(Array.from(hidden)));
    } catch { /* ignore localStorage */ }
  }, [hidden]);

  const toggle = useCallback((key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  if (!history || history.length < 2) {
    return (
      <div className="card">
        <div className="bg-surface-light dark:bg-surface-light-dark -mx-5 -mt-5 px-5 py-3 rounded-t-xl mb-4">
          <h3 className="text-lg font-semibold text-body m-0">Temperature</h3>
        </div>
        <div className="h-72 flex items-center justify-center">
          <span className="text-muted-standalone text-sm">Collecting temperature data...</span>
        </div>
      </div>
    );
  }

  // Determine which axes are still visible so we can hide unused Y-axes
  const showTempAxis = SERIES.some((s) => s.axis === 'temp' && !hidden.has(s.key));

  return (
    <div className="card">
      <div className="bg-surface-light dark:bg-surface-light-dark -mx-5 -mt-5 px-5 py-3 rounded-t-xl mb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-body m-0">Temperature</h3>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-muted-standalone text-sm underline hover:no-underline cursor-pointer focus:outline-none"
            aria-expanded={!collapsed}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
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
              {showTempAxis && (
                <YAxis yAxisId="temp" stroke={chartColors.axis} fontSize={11} tickFormatter={(v) => `${v}\u00B0`} />
              )}
              {!showTempAxis && <YAxis yAxisId="temp" hide />}
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
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
