/* eslint-disable react-refresh/only-export-components -- context file exports provider + hook */
import { createContext, useContext } from 'react';

const DashboardSettingsContext = createContext(null);

export function DashboardSettingsProvider({ value, children }) {
  return (
    <DashboardSettingsContext.Provider value={value}>
      {children}
    </DashboardSettingsContext.Provider>
  );
}

export function useDashboardSettingsContext() {
  const ctx = useContext(DashboardSettingsContext);
  if (!ctx) throw new Error('useDashboardSettingsContext must be used within DashboardSettingsProvider');
  return ctx;
}
