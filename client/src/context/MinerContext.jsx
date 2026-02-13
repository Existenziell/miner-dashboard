/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext, useMemo } from 'react';
import { useMinerData } from '@/hooks/useMinerData';
import { useConfig } from '@/context/ConfigContext';

const MinerContext = createContext(null);

export function MinerProvider({ children, pausePolling = false }) {
  const { config } = useConfig();
  const {
    data,
    error,
    loading,
    historyHashrate,
    historyTemperature,
    historyPower,
    refetch,
  } = useMinerData(config.pollMinerIntervalMs, pausePolling);
  const value = useMemo(
    () => ({
      data,
      error,
      loading,
      historyHashrate,
      historyTemperature,
      historyPower,
      refetch,
    }),
    [
      data,
      error,
      loading,
      historyHashrate,
      historyTemperature,
      historyPower,
      refetch,
    ]
  );
  return <MinerContext.Provider value={value}>{children}</MinerContext.Provider>;
}

export function useMiner() {
  const ctx = useContext(MinerContext);
  if (!ctx) throw new Error('useMiner must be used within MinerProvider');
  return ctx;
}
