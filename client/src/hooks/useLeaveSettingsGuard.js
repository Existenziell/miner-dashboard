import { useCallback, useState } from 'react';

/**
 * Guards main-tab navigation when leaving Settings with unsaved changes.
 * Returns a wrapped onTabChange and state/handlers for a "Leave settings?" confirm modal.
 *
 * @param {string} activeTab - Current main tab id
 * @param {(tab: string, options?: { section?: string }) => void} setActiveTab - Direct tab setter
 * @param {boolean} settingsHasPending - Whether any settings section has unsaved changes
 * @returns {{ onTabChange, showLeaveConfirm, leaveTargetTab, confirmLeave, cancelLeave }}
 */
export function useLeaveSettingsGuard(activeTab, setActiveTab, settingsHasPending) {
  const [leaveTargetTab, setLeaveTargetTab] = useState(null);
  const showLeaveConfirm = leaveTargetTab != null;

  const onTabChange = useCallback(
    (tab, options) => {
      if (activeTab === 'settings' && settingsHasPending && tab !== 'settings') {
        setLeaveTargetTab({ tab, options });
        return;
      }
      setActiveTab(tab, options);
    },
    [activeTab, settingsHasPending, setActiveTab]
  );

  const confirmLeave = useCallback(() => {
    if (leaveTargetTab != null) {
      setActiveTab(leaveTargetTab.tab, leaveTargetTab.options);
      setLeaveTargetTab(null);
    }
  }, [leaveTargetTab, setActiveTab]);

  const cancelLeave = useCallback(() => {
    setLeaveTargetTab(null);
  }, []);

  return { onTabChange, showLeaveConfirm, leaveTargetTab, confirmLeave, cancelLeave };
}
