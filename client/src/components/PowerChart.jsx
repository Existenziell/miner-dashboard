import React, { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { getChartColors } from '../lib/themeColors';
import { formatTime, useChartLegend, useChartCollapsed } from '../lib/chartUtils';
import { ClickableLegend, ChartCard } from './TimeSeriesChart';

const SERIES = [
  { key: 'power', name: 'Power', color: '#d946ef', width: 1, axis: 'power', fmt: (v) => (v != null ? `${v.toFixed(1)} W` : '--') },
  { key: 'currentA', name: 'Current', color: '#2563eb', width: 1, axis: 'current', fmt: (v) => (v != null ? `${v.toFixed(2)} A` : '--') },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const seriesMap = new Map(SERIES.map((s) => [s.key, s]));
  return (
    <div className="tooltip-card">
      <div className="text-muted-standalone text-xs mb-1">{formatTime(label)}</div>
      {payload.map((entry) => {
        const s = seriesMap.get(entry.dataKey);
        return (
          <div key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {s?.fmt(entry.value) ?? entry.value}
          </div>
        );
      })}
    </div>
  );
}

const LEGEND_STORAGE_KEY = 'chartLegend_power';
const COLLAPSED_STORAGE_KEY = 'chartCollapsed_power';
const SERIES_KEYS = new Set(SERIES.map((s) => s.key));

function PowerChart({ history }) {
  const { hidden, toggle } = useChartLegend(LEGEND_STORAGE_KEY, SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(COLLAPSED_STORAGE_KEY);
  const { resolved } = useTheme();
  const chartColors = getChartColors(resolved === 'dark');

  const showPowerAxis = SERIES.some((s) => s.axis === 'power' && !hidden.has(s.key));
  const showCurrentAxis = SERIES.some((s) => s.axis === 'current' && !hidden.has(s.key));

  return (
    <ChartCard
      title="Power"
      loading={!history || history.length < 2}
      loadingMessage="Collecting power data..."
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
              yAxisId="power"
              orientation="left"
              stroke={chartColors.axis}
              fontSize={11}
              tickFormatter={(v) => `${v} W`}
              domain={[80, 'auto']}
              allowDataOverflow
              hide={!showPowerAxis}
            />
            <YAxis
              yAxisId="current"
              orientation="right"
              stroke={chartColors.axis}
              fontSize={11}
              tickFormatter={(v) => `${v} A`}
              domain={[4, 'auto']}
              allowDataOverflow
              hide={!showCurrentAxis}
            />
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
    </ChartCard>
  );
}

export default memo(PowerChart);
