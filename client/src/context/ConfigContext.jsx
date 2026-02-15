/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useCallback,useContext, useEffect, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { fetchDashboardConfig } from '@/lib/api';
import { getContrastColor, CONTRAST_THRESHOLD_TOGGLE, hexWithAlpha, normalizeHex } from '@/lib/colorUtils';
import { setMetricRanges } from '@/lib/metricRanges';

const ConfigContext = createContext(null);

/** Build CSS that overrides Tailwind's compiled accent (literal hex) with our dynamic color. */
function buildAccentOverrideCSS(accent) {
  const a10 = hexWithAlpha(accent, 0.1);
  const a15 = hexWithAlpha(accent, 0.15);
  const a20 = hexWithAlpha(accent, 0.2);
  const a25 = hexWithAlpha(accent, 0.25);
  const a30 = hexWithAlpha(accent, 0.3);
  const a50 = hexWithAlpha(accent, 0.5);
  const a60 = hexWithAlpha(accent, 0.6);
  const contrastFg = getContrastColor(accent);
  const toggleThumbFg = getContrastColor(accent, CONTRAST_THRESHOLD_TOGGLE);
  return `/* Accent override - Tailwind compiles to literal hex */
:root{--color-accent:${accent};--color-accent-dark:color-mix(in srgb,${accent} 78%,black)}
.drop-zone-indicator{border-color:${a60} !important}
.bg-accent{background-color:${accent} !important}
.text-accent{color:${accent} !important}
.btn-primary{background-color:${accent} !important;color:${contrastFg} !important}
@media (hover: hover){.btn-primary:hover{background-color:color-mix(in srgb,${accent} 78%,black) !important}}
.btn-ghost-accent{background-color:${a10} !important;border-color:${accent} !important}
@media (hover: hover){.btn-ghost-accent:hover{background-color:${a20} !important}}
.input:focus{--tw-ring-color:${accent} !important}
.switch:focus{--tw-ring-color:${accent} !important}
.switch-on{background-color:${accent} !important;border-color:${accent} !important}
.switch-on .switch-thumb{background-color:${toggleThumbFg} !important}
@media (hover: hover){.hover\\:border-accent\\/20:hover{border-color:${a20} !important}}
.highlight-box{background-color:${a10} !important;border-color:${a50} !important}
.option-row-selected{background-color:${a15} !important;border-left-color:${accent} !important}
.dark .option-row-selected{background-color:${a20} !important}
.option-row:has(.option-radio-input:checked) .option-radio-dot,.option-row-selected .option-radio-dot{--tw-ring-color:${a25} !important;background-color:${accent} !important;border-color:${accent} !important}
.checkbox-input:checked~.checkbox-box{--tw-ring-color:${a25} !important;background-color:${accent} !important;border-color:${accent} !important}
.checkbox-input:checked~.checkbox-box .checkbox-check{color:${contrastFg} !important}
.input-range{accent-color:${accent} !important}
.theme-preview-card[aria-pressed="true"]{border-color:${accent} !important;--tw-ring-color:${a30} !important}`;
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => ({ ...DASHBOARD_DEFAULTS }));
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchDashboardConfig();
      setConfig(data);
    } catch {
      setConfig({ ...DASHBOARD_DEFAULTS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const ranges = { ...config.metricRanges };
    if (ranges.hashrate) {
      const expected = config.defaultExpectedHashrateGh > 0 ? config.defaultExpectedHashrateGh : 0;
      const gaugeMax = ranges.hashrate.gaugeMax ?? 0;
      const effective = Math.max(expected, gaugeMax) || DASHBOARD_DEFAULTS.metricRanges.hashrate.gaugeMax;
      ranges.hashrate = { ...ranges.hashrate, gaugeMax: effective };
    }
    setMetricRanges(ranges);
  }, [config.metricRanges, config.defaultExpectedHashrateGh]);

  useEffect(() => {
    const accent = (config.accentColor && config.accentColor.trim() !== '')
      ? normalizeHex(config.accentColor, DASHBOARD_DEFAULTS.accentColor)
      : DASHBOARD_DEFAULTS.accentColor;
    // Tailwind compiles accent to literal #d946ef, so override those utility classes with our color.
    const id = 'accent-color-override';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = buildAccentOverrideCSS(accent);
  }, [config.accentColor]);

  const value = {
    config,
    setConfig,
    refetch,
    loading,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
