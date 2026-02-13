import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useMiner, MinerProvider } from '@/context/MinerContext';
import { useNetworkData } from '@/hooks/useNetworkData';
import { getTabFromUrl, setTabInUrl } from '@/lib/tabUrl';
import { useConfig } from '@/context/ConfigContext';
import MinerStatus from '@/components/dashboard/MinerStatus';
import HashrateChart from '@/components/charts/HashrateChart';
import TemperatureChart from '@/components/charts/TemperatureChart';
import PowerChart from '@/components/charts/PowerChart';
import SharesCard from '@/components/dashboard/SharesCard';
import MinerSettings from '@/components/dashboard/MinerSettings';
import NetworkStatus from '@/components/dashboard/NetworkStatus';
import Header from '@/components/layout/Header';
import Notifications from '@/components/notifications/Notifications';
import Footer from '@/components/layout/Footer';

const SettingsPage = lazy(() => import('@/components/pages/SettingsPage'));
const DocsPage = lazy(() => import('@/components/pages/DocsPage'));
const ApiPage = lazy(() => import('@/components/pages/ApiPage'));
const Metrics = lazy(() => import('@/components/dashboard/Metrics'));

function PageFallback({ message }) {
  return <div className="text-muted-standalone py-8 text-center">{message}</div>;
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
  const { error: minerError, historyHashrate, historyTemperature, historyPower } = useMiner();
  const { data: network, error: networkError } = useNetworkData(config.pollNetworkIntervalMs);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-body">
      <Header activeTab={activeTab} onTabChange={onTabChange} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Notifications
          activeTab={activeTab}
          minerError={minerError}
          networkError={networkError}
        />

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

            {/* Key metrics - round gauges */}
            <Suspense fallback={<PageFallback message="Loading metrics…" />}>
              <Metrics />
            </Suspense>

            {/* Time series charts */}
            <div className="grid grid-cols-1 gap-4">
              <HashrateChart history={historyHashrate} />
              <TemperatureChart history={historyTemperature} />
              <PowerChart history={historyPower} />
            </div>

            {/* Settings and shares */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SharesCard />
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
