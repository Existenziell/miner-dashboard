/**
 * Footer for dashboard settings forms (config and colors): Save button, message, Reset to defaults + confirm dialog.
 * Reads form state from DashboardSettingsContext; use mode to pick config vs colors slice.
 */
import { useEffect } from 'react';
import { useDashboardSettingsContext } from '@/context/DashboardSettingsContext';
import { ERROR_MESSAGE_DISMISS_MS } from '@/lib/constants';
import { ConfirmModal } from '@/components/ConfirmModal';

export function DashboardSettingsFormFooter({
  mode,
  resetDialogDescription = 'Reset all settings to their default values and save immediately.',
  saveButtonLabel = 'Save settings',
  resetDialogTitle = 'Reset to defaults',
}) {
  const form = useDashboardSettingsContext();
  const slice = mode === 'colors'
    ? {
        saving: form.savingColors,
        hasChanges: form.hasColorsChanges,
        message: form.colorsMessage,
        setMessage: form.setColorsMessage,
        hasDefaultsDiff: form.hasColorsDefaultsDiff,
        showResetConfirm: form.showResetColorsConfirm,
        setShowResetConfirm: form.setShowResetColorsConfirm,
        onResetToDefaults: form.handleResetColorsToDefaults,
      }
    : {
        saving: form.savingConfig,
        hasChanges: form.hasConfigChanges,
        message: form.configMessage,
        setMessage: form.setConfigMessage,
        hasDefaultsDiff: form.hasConfigDefaultsDiff,
        showResetConfirm: form.showResetConfigConfirm,
        setShowResetConfirm: form.setShowResetConfigConfirm,
        onResetToDefaults: form.handleResetConfigToDefaults,
      };
  const { saving, hasChanges, message, setMessage, hasDefaultsDiff, showResetConfirm, setShowResetConfirm, onResetToDefaults } = slice;

  useEffect(() => {
    if (message?.type !== 'error' || !message?.text) return;
    const id = setTimeout(() => setMessage(null), ERROR_MESSAGE_DISMISS_MS);
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
              <span role="status" className="text-success dark:text-success-dark text-sm">
                {message.text}
              </span>
            )}
            {message?.type === 'error' && message?.text && (
              <span role="alert" className="toast-danger">
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
        onConfirm={onResetToDefaults}
        confirmDisabled={saving}
      />
    </>
  );
}
