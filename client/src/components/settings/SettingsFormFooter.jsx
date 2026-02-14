/**
 * Footer for Dashboard and Colors tabs: Save button, message, Reset to defaults + confirm dialog.
 * Receives form state as props (from useDashboard or useColor).
 */
import { useEffect } from 'react';
import { TOAST_AUTO_DISMISS_MS } from '@/lib/constants';
import { ConfirmModal } from '@/components/ConfirmModal';

export function SettingsFormFooter({
  form,
  resetDialogDescription = 'Reset all settings to their default values and save.',
  saveButtonLabel = 'Save settings',
  resetDialogTitle = 'Reset to defaults',
}) {
  if (!form) throw new Error('SettingsFormFooter requires a form prop.');
  const { saving, hasChanges, message, setMessage, hasDefaultsDiff, showResetConfirm, setShowResetConfirm, resetToDefaults } = form;

  useEffect(() => {
    if (message?.type !== 'error' || !message?.text) return;
    const id = setTimeout(() => setMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [message?.type, message?.text, setMessage]);

  return (
    <>
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="btn-primary"
            >
              {saving ? 'Saving…' : saveButtonLabel}
            </button>
            {message?.type === 'success' && (
              <span role="status" className="toast-success">
                {message.text}
              </span>
            )}
            {message?.type === 'error' && message?.text && (
              <span role="alert" className="toast-warning">
                {message.text}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={!hasDefaultsDiff}
            className="link-text text-body cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            aria-disabled={!hasDefaultsDiff}
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title={resetDialogTitle}
        description={resetDialogDescription}
        confirmLabel="Reset"
        onConfirm={resetToDefaults}
        confirmDisabled={saving}
      />
    </>
  );
}
