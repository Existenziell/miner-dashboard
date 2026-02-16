import { ThemeIcon } from '@/components/Icons';

const labels = {
  light: 'Light',
  dark: 'Dark',
  'light-high-contrast': 'Light (high contrast)',
  'dark-high-contrast': 'Dark (high contrast)',
};

export default function ThemeToggle({ mode, onCycle }) {
  const currentLabel = labels[mode] ?? mode;
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`Theme: ${currentLabel}. Click to cycle.`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
        bg-surface-subtle text-muted hover:text-normal
        hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors cursor-pointer
        hover:text-accent"
    >
      <ThemeIcon mode={mode} className="w-4 h-4" />
      <span className="hidden sm:inline">{currentLabel}</span>
    </button>
  );
}
