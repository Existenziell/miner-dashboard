import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppearanceProvider } from '@/context/AppearanceContext';
import { useConfig } from '@/context/ConfigContext';
import { useMiner } from '@/context/MinerContext';
import { MinerSettingsProvider } from '@/context/MinerSettingsContext';
import { SetupProvider } from '@/context/SetupContext';
import { useAppearance } from '@/hooks/useAppearance';
import { useMinerDevice } from '@/hooks/useMinerDevice';
import { useMinerPools } from '@/hooks/useMinerPools';
import { useMinerWifi } from '@/hooks/useMinerWifi';
import { useSetup } from '@/hooks/useSetup';
import { MESSAGE_AUTO_DISMISS_MS } from '@/lib/constants';
import { getSettingsSectionFromUrl, setSettingsSectionInUrl } from '@/lib/tabUrl';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PendingChanges } from '@/components/settings/PendingChanges';
import { SettingsTabBar } from '@/components/settings/SettingsTabBar';
import { TabAppearance } from '@/components/settings/TabAppearance';
import { TabFirmware } from '@/components/settings/TabFirmware';
import { TabMiner } from '@/components/settings/TabMiner';
import { TabPools } from '@/components/settings/TabPools';
import { TabSetup } from '@/components/settings/TabSetup';

export default function SettingsPage({ onError, onPendingChange }) {
  const { data: miner, refetch } = useMiner();
  const { config, refetch: refetchConfig } = useConfig();
  const [settingsSubTab, setSettingsSubTab] = useState(getSettingsSectionFromUrl);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [pendingSectionSwitch, setPendingSectionSwitch] = useState(null);

  useEffect(() => {
    const onPopState = () => setSettingsSubTab(getSettingsSectionFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setupForm = useSetup(config, refetchConfig, onError);
  const appearanceForm = useAppearance(config, refetchConfig, onError);
  const deviceForm = useMinerDevice(miner, refetch, onError);
  const wifiForm = useMinerWifi(miner, refetch, onError);
  const poolsForm = useMinerPools(miner, refetch, onError);
  const minerSettingsValue = { device: deviceForm, wifi: wifiForm, pools: poolsForm };

  const currentSectionHasPending = useMemo(() => {
    switch (settingsSubTab) {
      case 'setup':
        return setupForm.status.hasChanges || (miner && wifiForm.status.hasChanges);
      case 'miner':
        return deviceForm.status.hasChanges;
      case 'pools':
        return poolsForm.status.hasChanges;
      case 'appearance':
        return appearanceForm.status.hasChanges;
      case 'firmware':
      default:
        return false;
    }
  }, [
    settingsSubTab,
    setupForm.status.hasChanges,
    miner,
    wifiForm.status.hasChanges,
    deviceForm.status.hasChanges,
    poolsForm.status.hasChanges,
    appearanceForm.status.hasChanges,
  ]);

  const anySectionHasPending =
    setupForm.status.hasChanges ||
    (miner && wifiForm.status.hasChanges) ||
    deviceForm.status.hasChanges ||
    poolsForm.status.hasChanges ||
    appearanceForm.status.hasChanges;

  useEffect(() => {
    if (onPendingChange) {
      onPendingChange(anySectionHasPending);
      return () => onPendingChange(false);
    }
  }, [anySectionHasPending, onPendingChange]);

  const activeErrorMessage =
    settingsSubTab === 'miner' ? deviceForm.message : settingsSubTab === 'pools' ? poolsForm.message : null;
  const clearActiveMessage = useMemo(
    () =>
      settingsSubTab === 'miner'
        ? deviceForm.setMessage
        : settingsSubTab === 'pools'
          ? poolsForm.setMessage
          : () => {},
    [settingsSubTab, deviceForm.setMessage, poolsForm.setMessage]
  );

  useEffect(() => {
    if (activeErrorMessage?.type !== 'error' || !activeErrorMessage?.text) return;
    const id = setTimeout(() => clearActiveMessage(null), MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [settingsSubTab, activeErrorMessage?.type, activeErrorMessage?.text, clearActiveMessage]);

  const handleTabChange = (id) => {
    if (id === settingsSubTab) return;
    if (currentSectionHasPending) {
      setPendingSectionSwitch(id);
      return;
    }
    setSettingsSubTab(id);
    setSettingsSectionInUrl(id);
  };

  const revertSection = useCallback(
    (section) => {
      switch (section) {
        case 'setup':
          setupForm.actions.revert();
          if (miner) wifiForm.actions.revert();
          break;
        case 'miner':
          deviceForm.actions.revert();
          break;
        case 'pools':
          poolsForm.actions.revert();
          break;
        case 'appearance':
          appearanceForm.actions.revert();
          break;
        case 'firmware':
        default:
          break;
      }
    },
    [miner, setupForm.actions, wifiForm.actions, deviceForm.actions, poolsForm.actions, appearanceForm.actions]
  );

  const goToSetupTab = () => {
    setSettingsSubTab('setup');
    setSettingsSectionInUrl('setup');
  };

  if (!miner) {
    return (
      <div className="space-y-4">
        <SettingsTabBar currentTab={settingsSubTab} onTabChange={handleTabChange} />
        {settingsSubTab === 'setup' && (
          <SetupProvider value={setupForm}>
            <MinerSettingsProvider value={minerSettingsValue}>
              <TabSetup minerReachable={false} />
            </MinerSettingsProvider>
          </SetupProvider>
        )}
        {settingsSubTab === 'appearance' && (
          <AppearanceProvider value={appearanceForm}>
            <TabAppearance />
          </AppearanceProvider>
        )}
        {settingsSubTab === 'miner' && (
          <div className="card p-8 text-center text-muted">
            Connect to the miner to change device settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="text-link">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'pools' && (
          <div className="card p-8 text-center text-muted">
            Connect to the miner to change pool settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="text-link">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'firmware' && (
          <div className="card p-8 text-center text-muted">
            Connect to the miner to update firmware. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="text-link">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        <ConfirmModal
          open={pendingSectionSwitch != null}
          onClose={() => setPendingSectionSwitch(null)}
          title="Unsaved changes"
          description="This section has unsaved changes. Switch anyway? Your changes will not be saved."
          confirmLabel="Switch"
          onConfirm={() => {
            if (pendingSectionSwitch != null) {
              revertSection(settingsSubTab);
              setSettingsSubTab(pendingSectionSwitch);
              setSettingsSectionInUrl(pendingSectionSwitch);
              setPendingSectionSwitch(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsTabBar currentTab={settingsSubTab} onTabChange={handleTabChange} />

      {settingsSubTab === 'setup' && (
        <SetupProvider value={setupForm}>
          <MinerSettingsProvider value={minerSettingsValue}>
            <TabSetup minerReachable={true} />
          </MinerSettingsProvider>
        </SetupProvider>
      )}

      {settingsSubTab === 'appearance' && (
        <AppearanceProvider value={appearanceForm}>
          <TabAppearance />
        </AppearanceProvider>
      )}

      {settingsSubTab === 'firmware' && (
        <TabFirmware />
      )}

      {(settingsSubTab === 'miner' || settingsSubTab === 'pools') && (() => {
        const minerTabShowError = deviceForm.status.hasChanges && !deviceForm.validation.isFormValid;
        const poolsTabShowError = poolsForm.status.hasChanges && !poolsForm.validation.isFormValid;
        const minerTabSaveDisabled =
          deviceForm.status.saving || !deviceForm.status.hasChanges || !deviceForm.validation.isFormValid;
        const poolsTabSaveDisabled =
          poolsForm.status.saving || !poolsForm.status.hasChanges || !poolsForm.validation.isFormValid;
        return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            settingsSubTab === 'miner' ? deviceForm.actions.save() : poolsForm.actions.save();
          }}
          className="space-y-4"
        >
          <MinerSettingsProvider value={minerSettingsValue}>
            {settingsSubTab === 'miner' && (
              <TabMiner />
            )}
            {settingsSubTab === 'pools' && (
              <TabPools miner={miner} />
            )}

            <PendingChanges
              changes={settingsSubTab === 'miner' ? deviceForm.status.changes : poolsForm.status.changes}
              onReset={settingsSubTab === 'miner' ? deviceForm.actions.revert : poolsForm.actions.revert}
              title="Pending changes"
            />

            <div className="card">
              {settingsSubTab === 'miner' && <h3 className="card-title">Restart & Shutdown</h3>}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {settingsSubTab === 'miner' && minerTabShowError && (
                    <span className="text-danger text-sm" role="alert">
                      Fix the errors above to save.
                    </span>
                  )}
                  {settingsSubTab === 'pools' && poolsTabShowError && (
                    <span className="text-danger text-sm" role="alert">
                      Fix the errors above to save.
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={
                      settingsSubTab === 'miner' ? minerTabSaveDisabled : poolsTabSaveDisabled
                    }
                    className="btn-primary"
                  >
                    {settingsSubTab === 'miner' ? (deviceForm.status.saving ? 'Saving…' : 'Save settings') : (poolsForm.status.saving ? 'Saving…' : 'Save settings')}
                  </button>
                  {(settingsSubTab === 'miner' ? deviceForm.status.message : poolsForm.status.message)?.type === 'success' && (
                    <span role="status" className="message-success">
                      <span>Saved successfully</span>
                    </span>
                  )}
                  {(settingsSubTab === 'miner' ? deviceForm.status.message : poolsForm.status.message)?.type === 'error' && (
                    <span role="alert" className="message-warning">
                      {(settingsSubTab === 'miner' ? deviceForm.status.message : poolsForm.status.message).text}
                    </span>
                  )}
                </div>
                {settingsSubTab === 'miner' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRestartConfirm(true)}
                      disabled={deviceForm.status.restarting || deviceForm.status.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {deviceForm.status.restarting ? 'Restarting…' : 'Restart miner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShutdownConfirm(true)}
                      disabled={deviceForm.status.restarting || deviceForm.status.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {deviceForm.status.shuttingDown ? 'Shutting down…' : 'Shutdown miner'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </MinerSettingsProvider>
          <>
            <ConfirmModal
                open={showRestartConfirm}
                onClose={() => setShowRestartConfirm(false)}
                title="Restart miner?"
                description="Really restart the miner? It will disconnect briefly."
                confirmLabel="Restart"
                onConfirm={async () => {
                  await deviceForm.actions.handleRestart();
                  setShowRestartConfirm(false);
                }}
                confirmDisabled={deviceForm.status.restarting}
              />
              <ConfirmModal
                open={showShutdownConfirm}
                onClose={() => setShowShutdownConfirm(false)}
                title="Shutdown miner?"
                description="Shutdown the miner? It will stop hashing and disconnect. You will need to power it back on manually."
                confirmLabel="Shutdown"
                onConfirm={async () => {
                  await deviceForm.actions.handleShutdown();
                  setShowShutdownConfirm(false);
                }}
                confirmDisabled={deviceForm.status.shuttingDown}
              />
          </>
        </form>
        );
      })()}

      <ConfirmModal
        open={pendingSectionSwitch != null}
        onClose={() => setPendingSectionSwitch(null)}
        title="Unsaved changes"
        description="This section has unsaved changes. Switch anyway? Your changes will not be saved."
        confirmLabel="Switch"
        onConfirm={() => {
          if (pendingSectionSwitch != null) {
            revertSection(settingsSubTab);
            setSettingsSubTab(pendingSectionSwitch);
            setSettingsSectionInUrl(pendingSectionSwitch);
            setPendingSectionSwitch(null);
          }
        }}
      />
    </div>
  );
}
