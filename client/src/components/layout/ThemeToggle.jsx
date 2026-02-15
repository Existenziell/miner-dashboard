import { ThemeIcon } from '@/components/Icons';

const labels = {
  light: 'Light',
  dark: 'Dark',
  'light-high-contrast': 'Light (high contrast)',
  'dark-high-contrast': 'Dark (high contrast)',
};

export default function ThemeToggle({ mode, onCycle }) {
  return (
    <button
      onClick={onCycle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
        bg-surface-subtle text-muted dark:text-muted-dark hover:text-body
        hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors cursor-pointer"
    >
      <ThemeIcon mode={mode} className="w-4 h-4" />
      <span className="hidden sm:inline">{labels[mode] ?? mode}</span>
    </button>
  );
}
