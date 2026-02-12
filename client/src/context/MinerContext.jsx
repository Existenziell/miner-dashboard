/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext, useMemo } from 'react';
import { useMinerData } from '../hooks/useMinerData';

const MinerContext = createContext(null);

const MINER_POLL_MS = 10_000;

export function MinerProvider({ children, pausePolling = false }) {
  const {
    data,
    error,
    loading,
    historyHashrate,
    historyTemperature,
    historyPower,
    refetch,
  } = useMinerData(MINER_POLL_MS, pausePolling);
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
