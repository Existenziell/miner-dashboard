/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const InitContext = createContext(null);

export function InitProvider({ value, children }) {
  return <InitContext.Provider value={value}>{children}</InitContext.Provider>;
}

export function useInitContext() {
  const ctx = useContext(InitContext);
  if (!ctx) throw new Error('useInitContext must be used within InitProvider');
  return ctx;
}
