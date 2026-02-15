/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const SetupContext = createContext(null);

export function SetupProvider({ value, children }) {
  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetupContext() {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetupContext must be used within SetupProvider');
  return ctx;
}
