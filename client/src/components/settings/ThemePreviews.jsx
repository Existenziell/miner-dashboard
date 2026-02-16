import { THEME_LABELS } from '@/lib/constants';
import { ThemeIcon } from '@/components/Icons';

export function ThemePreviews({ themeId, isSelected, onSelect, previewClassName, useDarkVariant }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(themeId)}
      className={`theme-preview-card w-full text-left rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark ${isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-edge dark:border-edge-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
      aria-pressed={isSelected}
      aria-label={`Theme: ${THEME_LABELS[themeId]}. Click to select.`}
    >
      <div className={`rounded-md overflow-hidden ${previewClassName} ${useDarkVariant ? 'dark' : ''}`}>
        <div className="h-7 bg-surface-light border-b border-edge" />
        <div className="p-2 space-y-1.5 bg-surface-card min-h-[52px]">
          <div className="h-2 rounded w-full bg-fg opacity-100" />
          <div className="h-1.5 rounded w-4/5 bg-muted opacity-100" />
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2 px-2 bg-surface-light border-t border-edge">
          <ThemeIcon mode={themeId} className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-xs font-medium text-fg dark:text-fg-dark truncate">{THEME_LABELS[themeId]}</span>
        </div>
      </div>
    </button>
  );
}
