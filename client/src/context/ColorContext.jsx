/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

const ColorContext = createContext(null);

export function ColorProvider({ value, children }) {
  return <ColorContext.Provider value={value}>{children}</ColorContext.Provider>;
}

export function useColorContext() {
  const ctx = useContext(ColorContext);
  if (!ctx) throw new Error('useColorContext must be used within ColorProvider');
  return ctx;
}
