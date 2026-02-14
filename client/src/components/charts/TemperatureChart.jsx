import React, { memo, useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer,Tooltip, XAxis, YAxis } from 'recharts';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useConfig } from '@/context/ConfigContext';
import { useTheme } from '@/context/ThemeContext';
import { formatTime, getChartGridAxisColors, useChartCollapsed,useChartLegend } from '@/lib/chartUtils';
import { CHART_COLLAPSED_TMP,CHART_LEGEND_TMP } from '@/lib/constants';
import { ChartCard, ChartTooltip, ClickableLegend } from '@/components/charts/Chart';

const formatTempValue = (entry) =>
  entry.value != null ? `${entry.value.toFixed(1)}\u00B0C` : '--';

const SERIES_DEFAULTS = [
  { key: 'temp', name: 'ASIC Temp', color: DASHBOARD_DEFAULTS.chartColors.temperature.temp, width: 1, axis: 'temp' },
  { key: 'vrTemp', name: 'VR Temp', color: DASHBOARD_DEFAULTS.chartColors.temperature.vrTemp, width: 1, axis: 'temp' },
];
const TEMPERATURE_SERIES_KEYS = new Set(SERIES_DEFAULTS.map((s) => s.key));

function TemperatureChart({ history }) {
  const { config } = useConfig();
  const colors = config.chartColors?.temperature ?? DASHBOARD_DEFAULTS.chartColors.temperature;
  const SERIES = useMemo(
    () => SERIES_DEFAULTS.map((s) => ({ ...s, color: colors[s.key] ?? s.color })),
    [colors]
  );
  const { hidden, toggle } = useChartLegend(CHART_LEGEND_TMP, TEMPERATURE_SERIES_KEYS);
  const { collapsed, toggleCollapsed } = useChartCollapsed(CHART_COLLAPSED_TMP);
  const { resolved } = useTheme();
  const chartColors = getChartGridAxisColors(resolved === 'dark');

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
              <YAxis yAxisId="temp" stroke={chartColors.axis} fontSize={11} domain={[40, 'auto']} tickFormatter={(v) => `${v}\u00B0`} />
            )}
            {!showTempAxis && <YAxis yAxisId="temp" hide />}
            <Tooltip content={<ChartTooltip formatValue={formatTempValue} />} />
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

export default memo(TemperatureChart);
