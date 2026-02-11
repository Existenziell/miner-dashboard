import { ThemeIcon } from './Icons';

const labels = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle({ mode, onCycle }) {
  return (
    <button
      onClick={onCycle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        bg-surface-subtle text-muted-standalone hover:text-body
        hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors cursor-pointer"
      title={`Theme: ${labels[mode]} (click to cycle)`}
    >
      <ThemeIcon mode={mode} className="w-4 h-4" />
      <span className="hidden sm:inline">{labels[mode]}</span>
    </button>
  );
}
