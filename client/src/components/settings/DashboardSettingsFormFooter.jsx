/**
 * Footer for dashboard settings forms (config and colors): Save button, message, Reset to defaults + confirm dialog.
 * Reads form state from DashboardSettingsContext; use mode to pick config vs colors slice.
 */
import { useDashboardSettingsContext } from '@/context/DashboardSettingsContext';

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
            {message?.type === 'error' && (
              <span role="alert" className="toast-danger inline-flex items-center gap-2 px-3 py-2">
                <span>{message.text}</span>
                <button type="button" onClick={() => setMessage(null)} className="link-text font-medium opacity-90 hover:opacity-100">Dismiss</button>
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

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="reset-dashboard-dialog-title">
          <div className="card max-w-md w-full shadow-xl">
            <h2 id="reset-dashboard-dialog-title" className="text-lg font-semibold text-body mb-2">{resetDialogTitle}</h2>
            <p className="text-muted-standalone text-sm mb-6">{resetDialogDescription}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowResetConfirm(false)} disabled={saving} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={onResetToDefaults} disabled={saving} className="btn-primary">
                {saving ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
