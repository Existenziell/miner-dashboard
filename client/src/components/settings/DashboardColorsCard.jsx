import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { normalizeHex } from '@/lib/colorUtils';
import { Field } from '@/components/settings/Field';
import { useDashboardSettingsContext } from '@/context/DashboardSettingsContext';

export function DashboardColorsCard() {
  const {
    dashboardAccentColor,
    setDashboardAccentColor,
    dashboardChartColors,
    setChartColorValue,
    effectiveAccent,
    CHART_COLOR_SPEC,
  } = useDashboardSettingsContext();

  return (
    <div className="card">
      <div className="card-header-wrapper">
        <div className="card-header">
          <h3 className="card-header-title">Colors</h3>
        </div>
      </div>
      <p className="text-muted-standalone text-sm mb-4">
        Custom accent and chart line colors.
      </p>
      <div className="space-y-4">
        <Field label="Accent color" hint="Buttons, links, and highlights. Darker shade is derived automatically.">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={effectiveAccent}
              onChange={(e) => setDashboardAccentColor(e.target.value)}
              className="w-10 h-10 rounded border border-edge dark:border-edge-dark cursor-pointer bg-transparent"
              aria-label="Accent color picker"
            />
            <input
              type="text"
              value={dashboardAccentColor}
              onChange={(e) => setDashboardAccentColor(e.target.value)}
              placeholder={DASHBOARD_DEFAULTS.accentColor}
              className="input flex-1 min-w-0 font-mono text-sm"
              aria-label="Accent color hex"
            />
          </div>
        </Field>
        <div>
          <p className="text-sm font-medium text-body mb-1">Chart colors</p>
          <p className="text-muted-standalone text-xs mb-3">Line colors for Power, Temperature, and Hashrate charts.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHART_COLOR_SPEC.map((chart) => {
              const chartColors = dashboardChartColors[chart.id] ?? DASHBOARD_DEFAULTS.chartColors[chart.id];
              return (
                <div key={chart.id} className="border border-edge dark:border-edge-dark rounded-lg p-3 space-y-3">
                  <p className="text-sm font-medium text-body">{chart.label}</p>
                  {chart.series.map(({ key, label }) => {
                    const value = chartColors[key] ?? DASHBOARD_DEFAULTS.chartColors[chart.id][key];
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
                          value={chartColors[key] ?? ''}
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
