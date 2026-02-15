import { IconInfo } from '@/components/Icons';

export function Field({ label, children, hint, suffix }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="label">{label}</label>
        {hint && (
          <span className="field-hint-trigger" aria-label={label ? `Info: ${label}` : 'More info'}>
            <IconInfo className="w-4 h-4" />
            <span className="field-hint-tooltip" role="tooltip">
              {hint}
            </span>
          </span>
        )}
        {suffix != null && <span className="ml-auto text-xs text-muted dark:text-muted-dark">{suffix}</span>}
      </div>
      {children}
    </div>
  );
}
