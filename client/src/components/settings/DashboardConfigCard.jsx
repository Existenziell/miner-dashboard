import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useDashboardSettingsContext } from '@/context/DashboardSettingsContext';
import { Field } from '@/components/settings/Field';

export function DashboardConfigCard() {
  const {
    dashboardMinerIp,
    setDashboardMinerIp,
    dashboardExpectedHashrate,
    setDashboardExpectedHashrate,
    dashboardPollMiner,
    setDashboardPollMiner,
    dashboardPollNetwork,
    setDashboardPollNetwork,
    dashboardMetricRanges,
    setMetricRangeValue,
    METRIC_LABELS,
    METRIC_KEY_LABELS,
  } = useDashboardSettingsContext();

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h3 className="card-header-title">Configuration</h3>
        </div>
      </div>
      <p className="text-muted-standalone text-sm mb-6">
        Server-persisted config for dashboard.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Miner IP or hostname" hint="Address of the miner. Leave empty if using .env MINER_IP.">
          <input
            type="text"
            value={dashboardMinerIp}
            onChange={(e) => setDashboardMinerIp(e.target.value)}
            placeholder="192.168.1.3"
            className="input"
            aria-label="Miner IP"
          />
        </Field>
        <Field label="Expected hashrate (GH/s)" hint="Used for gauge and display.">
          <input
            type="number"
            min={1}
            max={100000}
            value={dashboardExpectedHashrate}
            onChange={(e) => setDashboardExpectedHashrate(Number(e.target.value) || DASHBOARD_DEFAULTS.defaultExpectedHashrateGh)}
            className="input"
            aria-label="Expected hashrate GH/s"
          />
        </Field>
        <Field label="Miner poll interval (ms)" hint="How often to fetch miner status.">
          <input
            type="number"
            min={1000}
            max={300000}
            value={dashboardPollMiner}
            onChange={(e) => setDashboardPollMiner(Number(e.target.value) || DASHBOARD_DEFAULTS.pollMinerIntervalMs)}
            className="input"
            aria-label="Miner poll interval ms"
          />
        </Field>
        <Field label="Network poll interval (ms)" hint="How often to fetch network stats.">
          <input
            type="number"
            min={5000}
            max={600000}
            value={dashboardPollNetwork}
            onChange={(e) => setDashboardPollNetwork(Number(e.target.value) || DASHBOARD_DEFAULTS.pollNetworkIntervalMs)}
            className="input"
            aria-label="Network poll interval ms"
          />
        </Field>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-body mb-1 mt-8">Metric ranges</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(DASHBOARD_DEFAULTS.metricRanges).map((metric) => {
              const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
              const values = dashboardMetricRanges[metric] ?? {};
              return (
                <div key={metric} className="border border-edge dark:border-edge-dark rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-body capitalize">
                    {METRIC_LABELS[metric] ?? metric}
                  </p>
                  {keys.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-xs text-muted shrink-0 min-w-[100px]" htmlFor={`metric-${metric}-${key}`}>
                        {METRIC_KEY_LABELS[key] ?? key}
                      </label>
                      <input
                        id={`metric-${metric}-${key}`}
                        type="number"
                        step={key.includes('Mv') || key.includes('Pct') ? 1 : 0.1}
                        value={values[key] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') return;
                          const num = Number(v);
                          if (!Number.isNaN(num)) setMetricRangeValue(metric, key, num);
                        }}
                        className="input text-sm w-24"
                        aria-label={`${METRIC_LABELS[metric] ?? metric} ${METRIC_KEY_LABELS[key] ?? key}`}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="text-muted-standalone text-xs my-3 space-y-1.5">
            <span className="block"><strong>Gauge max:</strong> value that maps to 100% on the needle (the scale).</span>
            <span className="block"><strong>Min:</strong> lower bound for &quot;higher is better&quot; (hashrate, frequency).</span>
            <span className="block"><strong>Max:</strong> upper bound for &quot;lower is better&quot; (temp, power, efficiency, current).</span>
            <span className="block"><strong>Max (mV):</strong> allowed voltage deviation from set.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
