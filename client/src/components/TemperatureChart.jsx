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
          {entry.name}: {entry.value?.toFixed(1)}{'\u00B0C'}
        </div>
      ))}
    </div>
  );
}

const SERIES = [
  { key: 'temp',    name: 'ASIC Temp', color: '#d946ef', width: 1,   axis: 'temp' },
  { key: 'vrTemp',  name: 'VR Temp',   color: '#2563eb', width: 1, axis: 'temp' },
];

const LEGEND_STORAGE_KEY = 'chartLegend_temperature';
const COLLAPSED_STORAGE_KEY = 'chartCollapsed_temperature';
const SERIES_KEYS = new Set(SERIES.map((s) => s.key));

export default function TemperatureChart() {
  const history = useMiner().historyTemperature;
  const { hidden, toggle } = useChartLegend(LEGEND_STORAGE_KEY, SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(COLLAPSED_STORAGE_KEY);
  const { resolved } = useTheme();
  const chartColors = getChartColors(resolved === 'dark');

  const showTempAxis = SERIES.some((s) => s.axis === 'temp' && !hidden.has(s.key));

  return (
    <ChartCard
      title="Temperature"
      loading={!history || history.length < 2}
      loadingMessage="Collecting temperature data..."
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
    </ChartCard>
  );
}
