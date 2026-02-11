import { useState, useCallback, useEffect } from 'react';
import { useMiner } from './context/MinerContext';
import { useNetworkData } from './hooks/useNetworkData';
import { formatHashrate, formatTemp, formatPower } from './lib/formatters';
import { getMetricColor, DEFAULT_EXPECTED_HASHRATE_GH } from './lib/metricRanges';
import { getTabFromUrl, setTabInUrl } from './lib/tabUrl';
import { computeEfficiency } from './lib/minerMetrics';
import MinerStatus from './components/MinerStatus';
import StatCard from './components/StatCard';
import HashrateChart from './components/HashrateChart';
import TemperatureChart from './components/TemperatureChart';
import PowerChart from './components/PowerChart';
import SharesCard from './components/SharesCard';
import MinerSettings from './components/MinerSettings';
import NetworkStatus from './components/NetworkStatus';
import Header from './components/Header';
import SettingsPage from './components/SettingsPage';
import DocumentationPage from './components/DocumentationPage';
import Notifications from './components/Notifications';
import Footer from './components/Footer';

export default function App() {
 
  const { data: miner, error: minerError } = useMiner();
  const { data: network, error: networkError } = useNetworkData(60_000);

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

  const efficiency = computeEfficiency(miner);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-body">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Notifications
          activeTab={activeTab}
          minerError={minerError}
          networkError={networkError}
        />

        {activeTab === 'settings' ? (
          <SettingsPage />
        ) : activeTab === 'docs' ? (
          <DocumentationPage />
        ) : (
          <>
            {/* Row 1: Miner Identity */}
            <MinerStatus />

            {/* Row 2: Key Metrics - 8 stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Hashrate"
                value={formatHashrate(miner?.hashRate)}
                sub={miner?.hashRate_10m != null ? `10m avg: ${formatHashrate(miner.hashRate_10m)}` : undefined}
                color={getMetricColor(miner, 'hashrate')}
              />
              <StatCard
                label="Efficiency"
                value={efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--'}
                sub={miner != null ? `Expected: ${formatHashrate(miner.expectedHashrate ?? DEFAULT_EXPECTED_HASHRATE_GH)}` : undefined}
                color={getMetricColor(miner, 'efficiency', efficiency)}
              />
              <StatCard
                label="ASIC Temperature"
                value={formatTemp(miner?.temp)}
                sub={miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined}
                color={getMetricColor(miner, 'temp')}
              />
              <StatCard
                label="Fan Speed"
                value={miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--'}
                sub={miner?.fanspeed != null
                  ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
                  : undefined}
                color={getMetricColor(miner, 'fanRpm')}
              />
              <StatCard
                label="Input Current"
                value={miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--'}
                sub={miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined}
                color={getMetricColor(miner, 'current')}
              />
              <StatCard
                label="ASIC Frequency"
                value={miner?.frequency != null ? `${miner.frequency} MHz` : '--'}
                sub={miner?.frequency != null && miner?.defaultFrequency != null
                  ? `Default: ${miner.defaultFrequency} MHz (${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}%)`
                  : undefined}
                color={getMetricColor(miner, 'frequency')}
              />
              <StatCard
                label="ASIC Voltage"
                value={miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--'}
                sub={miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined}
                color={getMetricColor(miner, 'voltage')}
              />
              <StatCard
                label="Power"
                value={formatPower(miner?.power)}
                sub={miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined}
                color={getMetricColor(miner, 'power')}
              />
            </div>

            {/* Row 3: Charts (full width, stacked: Hashrate, Temperature, Power) */}
            <div className="grid grid-cols-1 gap-4">
              <HashrateChart />
              <TemperatureChart />
              <PowerChart />
            </div>

            {/* Row 4: Mining Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SharesCard />
              <MinerSettings />
            </div>

            {/* Row 5: Bitcoin Network */}
            <div>
              <h2 className="text-lg font-semibold text-muted-standalone mb-3">Bitcoin Network</h2>
              <NetworkStatus data={network} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
