import { useState, useEffect } from 'react';
import { useMiner } from '@/context/MinerContext';
import { useConfig } from '@/context/ConfigContext';
import { MinerSettingsProvider } from '@/context/MinerSettingsContext';
import { DashboardSettingsProvider } from '@/context/DashboardSettingsContext';
import { getSettingsSectionFromUrl, setSettingsSectionInUrl } from '@/lib/tabUrl';
import { SETTINGS_WIFI_COLLAPSED } from '@/lib/constants';
import { useChartCollapsed } from '@/lib/chartUtils';
import { useMinerSettingsForm } from '@/hooks/useMinerSettingsForm';
import { useDashboardSettingsForm } from '@/hooks/useDashboardSettingsForm';
import { SettingsTabBar } from '@/components/settings/SettingsTabBar';
import { MinerTabContent } from '@/components/settings/MinerTabContent';
import { PoolsTabContent } from '@/components/settings/PoolsTabContent';
import { PendingChangesBox } from '@/components/settings/PendingChangesBox';
import { DashboardConfigCard } from '@/components/settings/DashboardConfigCard';
import { DashboardColorsCard } from '@/components/settings/DashboardColorsCard';
import { DashboardSettingsFormFooter } from '@/components/settings/DashboardSettingsFormFooter';

export default function SettingsPage({ onError }) {
  const { data: miner, refetch } = useMiner();
  const { config, refetch: refetchConfig } = useConfig();
  const [settingsSubTab, setSettingsSubTab] = useState(getSettingsSectionFromUrl);

  useEffect(() => {
    const onPopState = () => setSettingsSubTab(getSettingsSectionFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const minerForm = useMinerSettingsForm(miner, refetch, onError);
  const dashboardForm = useDashboardSettingsForm(config, refetchConfig, onError);
  const { collapsed: wifiCollapsed, toggleCollapsed: toggleWifiCollapsed } = useChartCollapsed(SETTINGS_WIFI_COLLAPSED);

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
                    <span role="status" className="toast-success inline-flex items-center gap-1.5 px-3 py-2">
                      <span>Saved successfully</span>
                    </span>
                  )}
                  {minerForm.message?.type === 'error' && (
                    <span role="alert" className="toast-danger inline-flex items-center gap-2 px-3 py-2">
                      <span>{minerForm.message.text}</span>
                      <button
                        type="button"
                        onClick={() => minerForm.setMessage(null)}
                        className="link-text font-medium opacity-90 hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    </span>
                  )}
                </div>
                {settingsSubTab === 'miner' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={minerForm.handleRestart}
                      disabled={minerForm.restarting || minerForm.shuttingDown}
                      className="btn-ghost-accent"
                    >
                      {minerForm.restarting ? 'Restarting…' : 'Restart miner'}
                    </button>
                    <button
                      type="button"
                      onClick={minerForm.handleShutdown}
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
        </form>
      )}
    </div>
  );
}
