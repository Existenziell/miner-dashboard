import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useMiner } from '../context/MinerContext';
import { getChartColors } from '../lib/themeColors';
import { formatTime, useChartLegend, useChartCollapsed } from '../lib/chartUtils';
import { ClickableLegend, ChartCard } from './TimeSeriesChart';

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

const SERIES = [
  { key: 'hashRate',     name: 'Instant',  color: '#f7931a', width: 1 },
  { key: 'hashRate_1m',  name: '1m Avg',   color: '#06b6d4', width: 1 },
  { key: 'hashRate_10m', name: '10m Avg',  color: '#a855f7', width: 1 },
  { key: 'hashRate_1h',  name: '1h Avg',   color: '#16a34a', width: 1 },
  { key: 'hashRate_1d',  name: '1d Avg',   color: '#a21caf', width: 1 },
];

const LEGEND_STORAGE_KEY = 'chartLegend_hashrate';
const COLLAPSED_STORAGE_KEY = 'chartCollapsed_hashrate';
const SERIES_KEYS = new Set(SERIES.map((s) => s.key));

export default function HashrateChart() {
  const history = useMiner().historyHashrate;
  const { hidden, toggle } = useChartLegend(LEGEND_STORAGE_KEY, SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(COLLAPSED_STORAGE_KEY);
  const { resolved } = useTheme();
  const chartColors = getChartColors(resolved === 'dark');

  return (
    <ChartCard
      title="Hashrate"
      loading={!history || history.length < 2}
      loadingMessage="Collecting hashrate data..."
      collapsed={collapsed}
      onToggleCollapsed={toggleCollapsed}
    >
      <>
        <ClickableLegend series={SERIES} hidden={hidden} onToggle={toggle} />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke={chartColors.axis}
              fontSize={11}
              tickCount={6}
            />
            <YAxis
              stroke={chartColors.axis}
              fontSize={11}
              domain={[5000, 'auto']}
              tickCount={10}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}` : v.toFixed(0))}
              unit=" TH/s"
            />
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
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </>
    </ChartCard>
  );
}
