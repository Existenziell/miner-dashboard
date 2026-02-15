/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const AppearanceContext = createContext(null);

export function AppearanceProvider({ value, children }) {
  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  );
}

export function useAppearanceContext() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearanceContext must be used within AppearanceProvider');
  return ctx;
}
