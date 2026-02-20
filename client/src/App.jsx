import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { DASHBOARD_DEFAULTS } from 'shared/dashboardDefaults';
import { useConfig } from '@/context/ConfigContext';
import { MinerProvider, useMiner } from '@/context/MinerContext';
import { useLeaveSettingsGuard } from '@/hooks/useLeaveSettingsGuard';
import { useNetworkData } from '@/hooks/useNetworkData';
import { NETWORK_COLLAPSED_KEY } from '@/lib/constants';
import { getTabFromUrl, setTabInUrl } from '@/lib/tabUrl';
import { ConfirmModal } from '@/components/ConfirmModal';
import Charts from '@/components/dashboard/Charts';
import MinerSettings from '@/components/dashboard/MinerSettings';
import MinerShares from '@/components/dashboard/MinerShares';
import MinerStatus from '@/components/dashboard/MinerStatus';
import NetworkStatus from '@/components/dashboard/NetworkStatus';
import SoloMiningOdds from '@/components/dashboard/SoloMiningOdds';
import SystemStatus from '@/components/dashboard/SystemStatus';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import Notifications from '@/components/notifications/Notifications';

const SettingsPage = lazy(() => import('@/components/pages/SettingsPage'));
const DocsPage = lazy(() => import('@/components/pages/DocsPage'));
const ApiPage = lazy(() => import('@/components/pages/ApiPage'));
const MinerMetrics = lazy(() => import('@/components/dashboard/MinerMetrics'));

function PageFallback({ message }) {
  return <div className="text-muted py-8 text-center">{message}</div>;
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(getTabFromUrl);
  const [settingsHasPending, setSettingsHasPending] = useState(false);
  const setActiveTab = useCallback((tab, options) => {
    setActiveTabState(tab);
    setTabInUrl(tab, options);
  }, []);

  useEffect(() => {
    const onPopState = () => setActiveTabState(getTabFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <MinerProvider pausePolling={activeTab === 'settings'}>
      <AppContent
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settingsHasPending={settingsHasPending}
        onSettingsPendingChange={setSettingsHasPending}
      />
    </MinerProvider>
  );
}

function AppContent({ activeTab, onTabChange, settingsHasPending, onSettingsPendingChange }) {
  const { config } = useConfig();
  const { data: minerData, error: minerError, historyHashrate, historyTemperature, historyPower } = useMiner();
  const { data: network, error: networkError } = useNetworkData(config.pollNetworkIntervalMs);
  const [networkCollapsed, setNetworkCollapsed] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem(NETWORK_COLLAPSED_KEY) === 'true'
  );
  const toggleNetworkCollapsed = useCallback(() => {
    setNetworkCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NETWORK_COLLAPSED_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);
  const { onTabChange: guardedTabChange, showLeaveConfirm, confirmLeave, cancelLeave } = useLeaveSettingsGuard(
    activeTab,
    onTabChange,
    settingsHasPending
  );

  const sectionVisible = config.sectionVisible ?? DASHBOARD_DEFAULTS.sectionVisible ?? {};

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-normal">
      <Header activeTab={activeTab} onTabChange={guardedTabChange} />

      <main className="max-w-7xl mx-auto px-6 pb-6 pt-4 space-y-4">
        <Notifications minerError={minerError} networkError={networkError} />

        {activeTab === 'settings' ? (
          <Suspense fallback={<PageFallback message="Loading settings…" />}>
            <SettingsPage onPendingChange={onSettingsPendingChange} />
          </Suspense>
        ) : activeTab === 'docs' ? (
          <Suspense fallback={<PageFallback message="Loading docs…" />}>
            <DocsPage />
          </Suspense>
        ) : activeTab === 'api' ? (
          <Suspense fallback={<PageFallback message="Loading API…" />}>
            <ApiPage />
          </Suspense>
        ) : (
          <>
            <MinerStatus />

            {minerData && (
              <>
                {/* Key metrics - round gauges */}
                <Suspense fallback={<PageFallback message="Loading metrics…" />}>
                  <MinerMetrics />
                </Suspense>

                {/* Time series charts */}
                <Suspense fallback={<PageFallback message="Loading charts…" />}>
                  <Charts
                    historyHashrate={historyHashrate}
                    historyTemperature={historyTemperature}
                    historyPower={historyPower}
                  />
                </Suspense>
              </>
            )}

            {/* Settings and shares */}
            {(sectionVisible.shares || sectionVisible.poolSettings) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sectionVisible.shares && <MinerShares />}
                {sectionVisible.poolSettings && <MinerSettings />}
              </div>
            )}

            {/* Network status */}
            {sectionVisible.bitcoinNetwork && (
              <div className={`card${networkCollapsed ? ' card--collapsed' : ''}`}>
                <div className="card-header-wrapper">
                  <button
                    type="button"
                    onClick={toggleNetworkCollapsed}
                    className={`card-header cursor-pointer border-0 focus:outline-none w-full flex items-center justify-between gap-2${networkCollapsed ? ' rounded-b-md' : ''}`}
                    aria-expanded={!networkCollapsed}
                    aria-label={`Bitcoin Network, ${networkCollapsed ? 'Expand' : 'Collapse'}`}
                  >
                    <h3 className="card-header-title">Bitcoin Network</h3>
                    <span className="text-muted text-sm shrink-0">{networkCollapsed ? 'Expand' : 'Collapse'}</span>
                  </button>
                </div>
                {!networkCollapsed && <NetworkStatus data={network} />}
              </div>
            )}

            {/* System (host) status */}
            {sectionVisible.system && <SystemStatus />}

            {/* Solo mining odds */}
            {sectionVisible.miningOdds && <SoloMiningOdds network={network} />}
          </>
        )}
      </main>

      <Footer />

      <ConfirmModal
        open={showLeaveConfirm}
        onClose={cancelLeave}
        title="Leave settings?"
        description="You have unsaved changes. Leave anyway? Your changes will not be saved."
        confirmLabel="Leave"
        onConfirm={confirmLeave}
      />
    </div>
  );
}
