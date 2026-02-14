import { useEffect, useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { DashboardSettingsProvider } from '@/context/DashboardSettingsContext';
import { useMiner } from '@/context/MinerContext';
import { MinerSettingsProvider } from '@/context/MinerSettingsContext';
import { useDashboardSettingsForm } from '@/hooks/useDashboardSettingsForm';
import { useMinerSettingsForm } from '@/hooks/useMinerSettingsForm';
import { useChartCollapsed } from '@/lib/chartUtils';
import { TOAST_AUTO_DISMISS_MS, SETTINGS_WIFI_COLLAPSED } from '@/lib/constants';
import { getSettingsSectionFromUrl, setSettingsSectionInUrl } from '@/lib/tabUrl';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DashboardColorsCard } from '@/components/settings/DashboardColorsCard';
import { DashboardConfigCard } from '@/components/settings/DashboardConfigCard';
import { DashboardSettingsFormFooter } from '@/components/settings/DashboardSettingsFormFooter';
import { MinerTabContent } from '@/components/settings/MinerTabContent';
import { PendingChangesBox } from '@/components/settings/PendingChangesBox';
import { PoolsTabContent } from '@/components/settings/PoolsTabContent';
import { SettingsTabBar } from '@/components/settings/SettingsTabBar';

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

  const minerForm = useMinerSettingsForm(miner, refetch, onError);
  const { message: minerFormMessage, setMessage: setMinerFormMessage } = minerForm;
  const dashboardForm = useDashboardSettingsForm(config, refetchConfig, onError);
  const { collapsed: wifiCollapsed, toggleCollapsed: toggleWifiCollapsed } = useChartCollapsed(SETTINGS_WIFI_COLLAPSED);

  useEffect(() => {
    if (minerFormMessage?.type !== 'error' || !minerFormMessage?.text) return;
    const id = setTimeout(() => setMinerFormMessage(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [minerFormMessage?.type, minerFormMessage?.text, setMinerFormMessage]);

  const handleTabChange = (id) => {
    setSettingsSubTab(id);
    setSettingsSectionInUrl(id);
  };

  const goToDashboardTab = () => {
    setSettingsSubTab('dashboard');
    setSettingsSectionInUrl('dashboard');
  };

  if (!miner) {
    return (
      <div className="space-y-4">
        <SettingsTabBar currentTab={settingsSubTab} onTabChange={handleTabChange} />
        {settingsSubTab === 'dashboard' && (
          <form onSubmit={dashboardForm.handleSaveConfig} className="space-y-4">
            <DashboardSettingsProvider value={dashboardForm}>
              <DashboardConfigCard />
              <PendingChangesBox changes={dashboardForm.configChanges} onReset={dashboardForm.handleRevertConfig} />
              <DashboardSettingsFormFooter
                mode="config"
                resetDialogDescription="Reset all dashboard config to default values and save immediately. Miner IP is kept."
              />
            </DashboardSettingsProvider>
          </form>
        )}
        {settingsSubTab === 'colors' && (
          <form onSubmit={dashboardForm.handleSaveColors} className="space-y-4">
            <DashboardSettingsProvider value={dashboardForm}>
              <DashboardColorsCard />
              <PendingChangesBox changes={dashboardForm.colorsChanges} onReset={dashboardForm.handleRevertColors} />
              <DashboardSettingsFormFooter
                mode="colors"
                resetDialogDescription="Reset accent and chart colors to defaults and save immediately."
              />
            </DashboardSettingsProvider>
          </form>
        )}
        {settingsSubTab === 'miner' && (
          <div className="card p-8 text-center text-muted-standalone">
            Connect to the miner to change device settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToDashboardTab} className="link-text text-body cursor-pointer underline">
              Dashboard
            </button>{' '}
            tab if the dashboard cannot reach the miner.
          </div>
        )}
        {settingsSubTab === 'pools' && (
          <div className="card p-8 text-center text-muted-standalone">
            Connect to the miner to change pool settings. Set Miner IP in the{' '}
            <button type="button" onClick={goToDashboardTab} className="link-text text-body cursor-pointer underline">
              Dashboard
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

      {settingsSubTab === 'dashboard' && (
        <form onSubmit={dashboardForm.handleSaveConfig} className="space-y-4">
          <DashboardSettingsProvider value={dashboardForm}>
            <DashboardConfigCard />
            <PendingChangesBox changes={dashboardForm.configChanges} onReset={dashboardForm.handleRevertConfig} />
            <DashboardSettingsFormFooter
              mode="config"
              resetDialogDescription="Reset all dashboard config to default values and save immediately. Miner IP is kept."
            />
          </DashboardSettingsProvider>
        </form>
      )}

      {settingsSubTab === 'colors' && (
        <form onSubmit={dashboardForm.handleSaveColors} className="space-y-4">
          <DashboardSettingsProvider value={dashboardForm}>
            <DashboardColorsCard />
            <PendingChangesBox changes={dashboardForm.colorsChanges} onReset={dashboardForm.handleRevertColors} />
            <DashboardSettingsFormFooter
              mode="colors"
              resetDialogDescription="Reset accent and chart colors to defaults and save immediately."
            />
          </DashboardSettingsProvider>
        </form>
      )}

      {(settingsSubTab === 'miner' || settingsSubTab === 'pools') && (
        <form onSubmit={minerForm.handleSave} className="space-y-4">
          <MinerSettingsProvider value={minerForm}>
            {settingsSubTab === 'miner' && (
              <MinerTabContent
                wifiCollapsed={wifiCollapsed}
                toggleWifiCollapsed={toggleWifiCollapsed}
              />
            )}
            {settingsSubTab === 'pools' && (
              <PoolsTabContent miner={miner} />
            )}

            <PendingChangesBox changes={minerForm.changes} onReset={minerForm.handleReset} />

            <div className="card">
              {settingsSubTab === 'miner' && <h3 className="card-title">Restart & Shutdown</h3>}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {minerForm.hasChanges && !minerForm.isFormValid && (
                    <span className="text-danger text-sm" role="alert">
                      Fix the errors above to save.
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={minerForm.saving || !minerForm.hasChanges || !minerForm.isFormValid}
                    className="btn-primary"
                  >
                    {minerForm.saving ? 'Saving…' : 'Save settings'}
                  </button>
                  {minerForm.message?.type === 'success' && (
                    <span role="status" className="toast-success">
                      <span>Saved successfully</span>
                    </span>
                  )}
                  {minerForm.message?.type === 'error' && (
                    <span role="alert" className="toast-warning">
                      {minerForm.message.text}
                    </span>
                  )}
                </div>
                {settingsSubTab === 'miner' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRestartConfirm(true)}
                      disabled={minerForm.restarting || minerForm.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {minerForm.restarting ? 'Restarting…' : 'Restart miner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShutdownConfirm(true)}
                      disabled={minerForm.restarting || minerForm.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {minerForm.shuttingDown ? 'Shutting down…' : 'Shutdown miner'}
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
                  await minerForm.handleRestart();
                  setShowRestartConfirm(false);
                }}
                confirmDisabled={minerForm.restarting}
              />
              <ConfirmModal
                open={showShutdownConfirm}
                onClose={() => setShowShutdownConfirm(false)}
                title="Shutdown miner?"
                description="Shutdown the miner? It will stop hashing and disconnect. You will need to power it back on manually."
                confirmLabel="Shutdown"
                onConfirm={async () => {
                  await minerForm.handleShutdown();
                  setShowShutdownConfirm(false);
                }}
                confirmDisabled={minerForm.shuttingDown}
              />
          </>
        </form>
      )}
    </div>
  );
}
