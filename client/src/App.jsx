import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useMiner, MinerProvider } from './context/MinerContext';
import { useNetworkData } from './hooks/useNetworkData';
import { formatHashrate, formatTemp, formatPower } from './lib/formatters';
import { getMetricColor, getMetricGaugePercent } from './lib/metricRanges';
import { getTabFromUrl, setTabInUrl } from './lib/tabUrl';
import { useConfig } from './context/ConfigContext';
import { computeEfficiency } from './lib/minerMetrics';
import MinerStatus from './components/MinerStatus';
import MetricGauge from './components/MetricGauge';
import HashrateChart from './components/HashrateChart';
import TemperatureChart from './components/TemperatureChart';
import PowerChart from './components/PowerChart';
import SharesCard from './components/SharesCard';
import MinerSettings from './components/MinerSettings';
import NetworkStatus from './components/NetworkStatus';
import Header from './components/Header';
import Notifications from './components/Notifications';
import Footer from './components/Footer';

const SettingsPage = lazy(() => import('./components/SettingsPage'));
const DocumentationPage = lazy(() => import('./components/DocumentationPage'));
const ApiPage = lazy(() => import('./components/ApiPage'));

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
  const { data: miner, error: minerError, historyHashrate, historyTemperature, historyPower } = useMiner();
  const { data: network, error: networkError } = useNetworkData(config.pollNetworkIntervalMs);
  const efficiency = computeEfficiency(miner);

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
            <DocumentationPage />
          </Suspense>
        ) : activeTab === 'api' ? (
          <Suspense fallback={<PageFallback message="Loading API…" />}>
            <ApiPage />
          </Suspense>
        ) : (
          <>
            <MinerStatus />

            {/* Key Metrics - round gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <MetricGauge
                label="Hashrate"
                value={formatHashrate(miner?.hashRate)}
                sub={miner?.hashRate_10m != null ? `10m avg: ${formatHashrate(miner.hashRate_10m)}` : undefined}
                color={getMetricColor(miner, 'hashrate')}
                percent={getMetricGaugePercent(miner, 'hashrate')}
              />
              <MetricGauge
                label="Efficiency"
                value={efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--'}
                sub={miner != null ? `Expected: ${formatHashrate(miner.expectedHashrate ?? config.defaultExpectedHashrateGh)}` : undefined}
                color={getMetricColor(miner, 'efficiency', efficiency)}
                percent={getMetricGaugePercent(miner, 'efficiency', efficiency)}
              />
              <MetricGauge
                label="ASIC Temp"
                value={formatTemp(miner?.temp)}
                sub={miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined}
                color={getMetricColor(miner, 'temp')}
                percent={getMetricGaugePercent(miner, 'temp')}
              />
              <MetricGauge
                label="Fan Speed"
                value={miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--'}
                sub={miner?.fanspeed != null
                  ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
                  : undefined}
                color={getMetricColor(miner, 'fanRpm')}
                percent={getMetricGaugePercent(miner, 'fanRpm')}
              />
              <MetricGauge
                label="Input Current"
                value={miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--'}
                sub={miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined}
                color={getMetricColor(miner, 'current')}
                percent={getMetricGaugePercent(miner, 'current')}
              />
              <MetricGauge
                label="ASIC Frequency"
                value={miner?.frequency != null ? `${miner.frequency} MHz` : '--'}
                sub={miner?.frequency != null && miner?.defaultFrequency != null
                  ? `${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}% of default`
                  : undefined}
                color={getMetricColor(miner, 'frequency')}
                percent={getMetricGaugePercent(miner, 'frequency')}
              />
              <MetricGauge
                label="ASIC Voltage"
                value={miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--'}
                sub={miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined}
                color={getMetricColor(miner, 'voltage')}
                percent={getMetricGaugePercent(miner, 'voltage')}
              />
              <MetricGauge
                label="Power"
                value={formatPower(miner?.power)}
                sub={miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined}
                color={getMetricColor(miner, 'power')}
                percent={getMetricGaugePercent(miner, 'power')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <HashrateChart history={historyHashrate} />
              <TemperatureChart history={historyTemperature} />
              <PowerChart history={historyPower} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SharesCard />
              <MinerSettings />
            </div>

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
