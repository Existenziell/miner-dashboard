import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { MinerProvider, useMiner } from '@/context/MinerContext';
import { useNetworkData } from '@/hooks/useNetworkData';
import { getTabFromUrl, setTabInUrl } from '@/lib/tabUrl';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import MinerSettings from '@/components/dashboard/MinerSettings';
import MinerShares from '@/components/dashboard/MinerShares';
import MinerStatus from '@/components/dashboard/MinerStatus';
import NetworkStatus from '@/components/dashboard/NetworkStatus';
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
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setTabInUrl(tab);
  }, []);

  useEffect(() => {
    const onPopState = () => setActiveTabState(getTabFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <MinerProvider pausePolling={activeTab === 'settings'}>
      <AppContent activeTab={activeTab} onTabChange={setActiveTab} />
    </MinerProvider>
  );
}

function AppContent({ activeTab, onTabChange }) {
  const { config } = useConfig();
  const { data: minerData, error: minerError, historyHashrate, historyTemperature, historyPower } = useMiner();
  const { data: network, error: networkError } = useNetworkData(config.pollNetworkIntervalMs);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-normal">
      <Header activeTab={activeTab} onTabChange={onTabChange} />

      <main className="max-w-7xl mx-auto px-6 pb-6 pt-4 space-y-4">
        <Notifications minerError={minerError} networkError={networkError} />

        {activeTab === 'settings' ? (
          <Suspense fallback={<PageFallback message="Loading settings…" />}>
            <SettingsPage />
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
                  <DashboardCharts
                    historyHashrate={historyHashrate}
                    historyTemperature={historyTemperature}
                    historyPower={historyPower}
                  />
                </Suspense>
              </>
            )}

            {/* Settings and shares */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MinerShares />
              <MinerSettings />
            </div>

            {/* Network status */}
            <div className="card">
              <div className="card-header-wrapper">
                <div className="card-header">
                  <h3 className="card-header-title">Bitcoin Network</h3>
                </div>
              </div>
              <NetworkStatus data={network} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
