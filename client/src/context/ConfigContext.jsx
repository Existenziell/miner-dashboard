/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDashboardConfig } from '../lib/api';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { setMetricRanges } from '../lib/metricRanges';

const ConfigContext = createContext(null);

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
