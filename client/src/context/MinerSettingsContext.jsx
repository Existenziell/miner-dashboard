/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext } from 'react';

const MinerSettingsContext = createContext(null);

export function MinerSettingsProvider({ value, children }) {
  return (
    <MinerSettingsContext.Provider value={value}>
      {children}
    </MinerSettingsContext.Provider>
  );
}

export function useMinerSettingsContext() {
  const ctx = useContext(MinerSettingsContext);
  if (!ctx) throw new Error('useMinerSettingsContext must be used within MinerSettingsProvider');
  return ctx;
}
