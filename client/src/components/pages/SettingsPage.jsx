import { useEffect, useMemo, useState } from 'react';
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
import { TOAST_AUTO_DISMISS_MS } from '@/lib/constants';
import { getSettingsSectionFromUrl, setSettingsSectionInUrl } from '@/lib/tabUrl';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PendingChanges } from '@/components/settings/PendingChanges';
import { SettingsFormFooter } from '@/components/settings/SettingsFormFooter';
import { SettingsTabBar } from '@/components/settings/SettingsTabBar';
import { TabAppearance } from '@/components/settings/TabAppearance';
import { TabFirmware } from '@/components/settings/TabFirmware';
import { TabMiner } from '@/components/settings/TabMiner';
import { TabPools } from '@/components/settings/TabPools';
import { TabSetup } from '@/components/settings/TabSetup';

export default function SettingsPage({ onError }) {
  const { data: miner, refetch } = useMiner();
  const { config, refetch: refetchConfig } = useConfig();
  const [settingsSubTab, setSettingsSubTab] = useState(getSettingsSectionFromUrl);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);

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
    const id = setTimeout(() => clearActiveMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [settingsSubTab, activeErrorMessage?.type, activeErrorMessage?.text, clearActiveMessage]);

  const handleTabChange = (id) => {
    setSettingsSubTab(id);
    setSettingsSectionInUrl(id);
  };

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
          <form onSubmit={appearanceForm.save} className="space-y-4">
            <AppearanceProvider value={appearanceForm}>
              <TabAppearance />
              <PendingChanges
                changes={appearanceForm.changes}
                onReset={appearanceForm.revert}
                title="Pending changes"
              />
              <SettingsFormFooter
                form={appearanceForm}
                resetDialogDescription="Reset appearance (metric ranges and colors) to default values."
              />
            </AppearanceProvider>
          </form>
        )}
        {settingsSubTab === 'miner' && (
          <div className="card p-8 text-center text-muted dark:text-muted-dark">
            Connect to the miner to change device settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="link-text text-body cursor-pointer underline">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'pools' && (
          <div className="card p-8 text-center text-muted dark:text-muted-dark">
            Connect to the miner to change pool settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="link-text text-body cursor-pointer underline">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'firmware' && (
          <div className="card p-8 text-center text-muted dark:text-muted-dark">
            Connect to the miner to update firmware. Set Miner IP in the{' '}
            <button type="button" onClick={goToSetupTab} className="link-text text-body cursor-pointer underline">
              Setup
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
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
        <form onSubmit={appearanceForm.save} className="space-y-4">
          <AppearanceProvider value={appearanceForm}>
            <TabAppearance />
            <PendingChanges
              changes={appearanceForm.changes}
              onReset={appearanceForm.revert}
              title="Pending changes"
            />
            <SettingsFormFooter
              form={appearanceForm}
              resetDialogDescription="Reset appearance (metric ranges and colors) to default values."
            />
          </AppearanceProvider>
        </form>
      )}

      {settingsSubTab === 'firmware' && (
        <TabFirmware />
      )}

      {(settingsSubTab === 'miner' || settingsSubTab === 'pools') && (() => {
        const minerTabShowError = deviceForm.hasChanges && !deviceForm.isFormValid;
        const poolsTabShowError = poolsForm.hasChanges && !poolsForm.isFormValid;
        const minerTabSaveDisabled =
          deviceForm.saving || !deviceForm.hasChanges || !deviceForm.isFormValid;
        const poolsTabSaveDisabled =
          poolsForm.saving || !poolsForm.hasChanges || !poolsForm.isFormValid;
        const activeForm = settingsSubTab === 'miner' ? deviceForm : poolsForm;
        return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            settingsSubTab === 'miner' ? deviceForm.save() : poolsForm.save();
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
              changes={settingsSubTab === 'miner' ? deviceForm.changes : poolsForm.changes}
              onReset={settingsSubTab === 'miner' ? deviceForm.revert : poolsForm.revert}
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
                    {activeForm.saving ? 'Saving…' : 'Save settings'}
                  </button>
                  {activeForm.message?.type === 'success' && (
                    <span role="status" className="toast-success">
                      <span>Saved successfully</span>
                    </span>
                  )}
                  {activeForm.message?.type === 'error' && (
                    <span role="alert" className="toast-warning">
                      {activeForm.message.text}
                    </span>
                  )}
                </div>
                {settingsSubTab === 'miner' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRestartConfirm(true)}
                      disabled={deviceForm.restarting || deviceForm.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {deviceForm.restarting ? 'Restarting…' : 'Restart miner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShutdownConfirm(true)}
                      disabled={deviceForm.restarting || deviceForm.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {deviceForm.shuttingDown ? 'Shutting down…' : 'Shutdown miner'}
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
                  await deviceForm.handleRestart();
                  setShowRestartConfirm(false);
                }}
                confirmDisabled={deviceForm.restarting}
              />
              <ConfirmModal
                open={showShutdownConfirm}
                onClose={() => setShowShutdownConfirm(false)}
                title="Shutdown miner?"
                description="Shutdown the miner? It will stop hashing and disconnect. You will need to power it back on manually."
                confirmLabel="Shutdown"
                onConfirm={async () => {
                  await deviceForm.handleShutdown();
                  setShowShutdownConfirm(false);
                }}
                confirmDisabled={deviceForm.shuttingDown}
              />
          </>
        </form>
        );
      })()}
    </div>
  );
}
