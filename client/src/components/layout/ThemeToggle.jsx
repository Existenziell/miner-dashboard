import { ThemeIcon } from '@/components/Icons';

const labels = {
  light: 'Light',
  dark: 'Dark',
  'light-high-contrast': 'Light (HC)',
  'dark-high-contrast': 'Dark (HC)',
};

export default function ThemeToggle({ mode, onCycle }) {
  const currentLabel = labels[mode] ?? mode;
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`Theme: ${currentLabel}. Click to cycle.`}
      className="theme-toggle-btn"
    >
      <ThemeIcon mode={mode} className="w-4 h-4" />
      <span className="hidden sm:inline">{currentLabel}</span>
    </button>
  );
}
