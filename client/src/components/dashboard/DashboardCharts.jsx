import { useMemo } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useConfig } from '@/context/ConfigContext';
import HashrateChart from '@/components/charts/HashrateChart';
import PowerChart from '@/components/charts/PowerChart';
import TemperatureChart from '@/components/charts/TemperatureChart';

const CHART_SPEC = [
  { id: 'hashrate', Component: HashrateChart },
  { id: 'temperature', Component: TemperatureChart },
  { id: 'power', Component: PowerChart },
];

const KNOWN_CHART_IDS = new Set(CHART_SPEC.map((c) => c.id));

function getOrderedChartIds(config) {
  const order = config?.chartOrder ?? DASHBOARD_DEFAULTS.chartOrder;
  if (!Array.isArray(order)) return [...KNOWN_CHART_IDS];
  const result = order.filter((id) => KNOWN_CHART_IDS.has(id));
  for (const id of KNOWN_CHART_IDS) {
    if (!result.includes(id)) result.push(id);
  }
  return result;
}

function getChartSpec(id) {
  return CHART_SPEC.find((c) => c.id === id);
}

export default function DashboardCharts({
  historyHashrate,
  historyTemperature,
  historyPower,
}) {
  const { config } = useConfig();

  const visibleOrderedIds = useMemo(() => {
    const orderedIds = getOrderedChartIds(config);
    return orderedIds.filter((id) => config?.chartVisible?.[id] !== false);
  }, [config]);

  const historyByChart = useMemo(
    () => ({
      hashrate: historyHashrate,
      temperature: historyTemperature,
      power: historyPower,
    }),
    [historyHashrate, historyTemperature, historyPower]
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {visibleOrderedIds.map((id) => {
        const spec = getChartSpec(id);
        const history = historyByChart[id];
        if (!spec) return null;
        const Component = spec.Component;
        return <Component key={id} history={history} />;
      })}
    </div>
  );
}
