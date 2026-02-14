import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useColorContext } from '@/context/ColorContext';
import { normalizeHex } from '@/lib/colorUtils';
import { Field } from '@/components/settings/Field';

export function DashboardColors() {
  const {
    accentColor,
    setAccentColor,
    chartColors,
    setChartColorValue,
    effectiveAccent,
    CHART_COLOR_SPEC,
  } = useColorContext();

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header mb-4">
          <h3 className="card-header-title">Colors</h3>
        </div>
      </div>
      <div className="space-y-4">
        <Field label="Accent color" hint="Buttons, links, and highlights. Darker shade is derived automatically.">
          <div className="flex items-center gap-2 max-w-96">
            <input
              type="color"
              value={effectiveAccent}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded border border-edge dark:border-edge-dark cursor-pointer bg-transparent"
              aria-label="Accent color picker"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder={DASHBOARD_DEFAULTS.accentColor}
              className="input flex-1 min-w-0 font-mono text-sm"
              aria-label="Accent color hex"
            />
          </div>
        </Field>
        <div className="mt-8">
          <Field label="Chart colors" hint="Line colors for Power, Temperature, and Hashrate charts." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {CHART_COLOR_SPEC.map((chart) => {
              const seriesColors = chartColors[chart.id] ?? DASHBOARD_DEFAULTS.chartColors[chart.id];
              return (
                <div key={chart.id} className="border border-edge dark:border-edge-dark rounded-md px-4 py-3 space-y-1">
                  <p className="text-sm font-medium text-body">{chart.label}</p>
                  {chart.series.map(({ key, label }) => {
                    const value = seriesColors[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id][key];
                    const effective = normalizeHex(value, DASHBOARD_DEFAULTS.chartColors[chart.id][key]);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={effective}
                          onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                          className="w-8 h-8 rounded border border-edge dark:border-edge-dark cursor-pointer bg-transparent shrink-0"
                          aria-label={`${chart.label} ${label} color`}
                        />
                        <label className="text-xs text-muted shrink-0 min-w-16" htmlFor={`chart-${chart.id}-${key}`}>
                          {label}
                        </label>
                        <input
                          id={`chart-${chart.id}-${key}`}
                          type="text"
                          value={seriesColors[key] ?? ''}
                          onChange={(e) => setChartColorValue(chart.id, key, e.target.value)}
                          placeholder={DASHBOARD_DEFAULTS.chartColors[chart.id][key]}
                          className="input text-sm flex-1 min-w-0 font-mono"
                          aria-label={`${chart.label} ${label} hex`}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
