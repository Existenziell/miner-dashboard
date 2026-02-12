/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext, useMemo } from 'react';
import { useMinerData } from '../hooks/useMinerData';
import { POLL_MINER_INTERVAL_MS } from '../lib/constants';

const MinerContext = createContext(null);

export function MinerProvider({ children, pausePolling = false }) {
  const {
    data,
    error,
    loading,
    historyHashrate,
    historyTemperature,
    historyPower,
    refetch,
  } = useMinerData(POLL_MINER_INTERVAL_MS, pausePolling);
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
