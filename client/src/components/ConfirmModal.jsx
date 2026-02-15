import { useId } from 'react';

/**
 * Reusable confirmation modal: overlay, title, description, Cancel + Confirm.
 * Same look as the "Reset to defaults" dialog. Confirm can be async; parent typically closes on confirm.
 */
export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmDisabled = false,
}) {
  const titleId = useId();

  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className="card max-w-md w-full shadow-xl -mt-30" onClick={(e) => e.stopPropagation()}>
        <h2 id={titleId} className="text-lg font-semibold text-body mb-2">
          {title}
        </h2>
        <p className="text-muted dark:text-muted-dark text-sm mb-6">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={confirmDisabled}
            className="btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="btn-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
