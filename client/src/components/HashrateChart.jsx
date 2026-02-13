import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useConfig } from '../context/ConfigContext';
import { getChartGridAxisColors, formatTime, useChartLegend, useChartCollapsed } from '../lib/chartUtils';
import { CHART_LEGEND_STORAGE_KEY_HASHRATE, CHART_COLLAPSED_STORAGE_KEY_HASHRATE } from '../lib/constants';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { ClickableLegend, ChartCard, ChartTooltip } from './TimeSeriesChart';

const formatHashrateValue = (entry) =>
  entry.value != null ? `${entry.value.toFixed(2)} GH/s` : '--';

const h = DASHBOARD_DEFAULTS.chartColors.hashrate;
const SERIES_DEFAULTS = [
  { key: 'hashRate', name: 'Instant', color: h.hashRate, width: 1 },
  { key: 'hashRate_1m', name: '1m Avg', color: h.hashRate_1m, width: 1 },
  { key: 'hashRate_10m', name: '10m Avg', color: h.hashRate_10m, width: 1 },
  { key: 'hashRate_1h', name: '1h Avg', color: h.hashRate_1h, width: 1 },
  { key: 'hashRate_1d', name: '1d Avg', color: h.hashRate_1d, width: 1 },
];
const HASHRATE_SERIES_KEYS = new Set(SERIES_DEFAULTS.map((s) => s.key));

function HashrateChart({ history }) {
  const { config } = useConfig();
  const colors = config.chartColors?.hashrate ?? DASHBOARD_DEFAULTS.chartColors.hashrate;
  const SERIES = useMemo(
    () => SERIES_DEFAULTS.map((s) => ({ ...s, color: colors[s.key] ?? s.color })),
    [colors]
  );
  const { hidden, toggle } = useChartLegend(CHART_LEGEND_STORAGE_KEY_HASHRATE, HASHRATE_SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(CHART_COLLAPSED_STORAGE_KEY_HASHRATE);
  const { resolved } = useTheme();
  const chartColors = getChartGridAxisColors(resolved === 'dark');

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
            />
            <Tooltip content={<ChartTooltip formatValue={formatHashrateValue} />} />
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

export default memo(HashrateChart);
