import React, { memo, useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer,Tooltip, XAxis, YAxis } from 'recharts';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useConfig } from '@/context/ConfigContext';
import { useTheme } from '@/hooks/useTheme';
import { formatTime, getChartGridAxisColors, useChartCollapsed,useChartLegend } from '@/lib/chartUtils';
import { CHART_COLLAPSED_PW,CHART_LEGEND_PW } from '@/lib/constants';
import { ChartCard, ChartTooltip,ClickableLegend } from '@/components/charts/TimeSeriesChart';

const SERIES_DEFAULTS = [
  { key: 'power', name: 'Power', color: DASHBOARD_DEFAULTS.chartColors.power.power, width: 1, axis: 'power', fmt: (v) => (v != null ? `${v.toFixed(1)} W` : '--') },
  { key: 'currentA', name: 'Current', color: DASHBOARD_DEFAULTS.chartColors.power.currentA, width: 1, axis: 'current', fmt: (v) => (v != null ? `${v.toFixed(2)} A` : '--') },
];
const POWER_SERIES_KEYS = new Set(SERIES_DEFAULTS.map((s) => s.key));

const formatPowerValue = (entry, series) => {
  const s = series.find((x) => x.key === entry.dataKey);
  return s?.fmt(entry.value) ?? (entry.value != null ? String(entry.value) : '--');
};

function PowerChart({ history }) {
  const { config } = useConfig();
  const colors = config.chartColors?.power ?? DASHBOARD_DEFAULTS.chartColors.power;
  const SERIES = useMemo(
    () => SERIES_DEFAULTS.map((s) => ({ ...s, color: colors[s.key] ?? s.color })),
    [colors]
  );
  const { hidden, toggle } = useChartLegend(CHART_LEGEND_PW, POWER_SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(CHART_COLLAPSED_PW);
  const { resolved } = useTheme();
  const chartColors = getChartGridAxisColors(resolved === 'dark');

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
            <Tooltip content={<ChartTooltip formatValue={(entry) => formatPowerValue(entry, SERIES)} />} />
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
