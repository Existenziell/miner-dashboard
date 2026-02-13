import { IconInfo } from '@/components/Icons';

export function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="label">{label}</label>
        {hint && (
          <span className="field-hint-trigger" aria-label="More info">
            <IconInfo className="w-4 h-4" />
            <span className="field-hint-tooltip" role="tooltip">
              {hint}
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
