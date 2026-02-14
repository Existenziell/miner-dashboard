import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useDashboardContext } from '@/context/DashboardContext';
import { Field } from '@/components/settings/Field';

export function DashboardConfig() {
  const {
    metricRanges,
    setMetricRangeValue,
    METRIC_LABELS,
    METRIC_KEY_LABELS,
  } = useDashboardContext();

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header mb-4">
          <h3 className="card-header-title">Metric ranges</h3>
        </div>
      </div>
      <div className="space-y-4">
        <Field label="Metric ranges" hint="Customize display ranges for temperature, power, efficiency, and hashrate metrics." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-2">
          {Object.keys(DASHBOARD_DEFAULTS.metricRanges).map((metric) => {
            const keys = Object.keys(DASHBOARD_DEFAULTS.metricRanges[metric]);
            const values = metricRanges[metric] ?? {};
            return (
              <div key={metric} className="border border-edge dark:border-edge-dark rounded-md px-4 py-3 space-y-2">
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
  );
}
