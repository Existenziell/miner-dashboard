/**
 * Chart colors for Recharts (grid/axis). Use when Tailwind utilities can't apply (e.g. stroke prop).
 * Resolved theme is applied via .dark on document; pass isDark from useTheme().resolved.
 */
export const CHART_COLORS = {
  light: { grid: '#d1d5db', axis: '#9ca3af' },
  dark: { grid: '#333366', axis: '#666688' },
};

export function getChartColors(isDark) {
  return CHART_COLORS[isDark ? 'dark' : 'light'];
}
