import { useState, useCallback, useEffect, useRef } from 'react';
import { useMinerData } from './hooks/useMinerData';
import { useNetworkData } from './hooks/useNetworkData';
import { useTheme } from './hooks/useTheme';
import { useAlerts } from './hooks/useAlerts';
import { formatHashrate, formatTemp, formatPower } from './lib/formatters';
import { getMetricColor, DEFAULT_EXPECTED_HASHRATE_GH } from './lib/metricRanges';
import MinerStatus from './components/MinerStatus';
import StatCard from './components/StatCard';
import HashrateChart from './components/HashrateChart';
import TemperatureChart from './components/TemperatureChart';
import SharesCard from './components/SharesCard';
import MinerSettings from './components/MinerSettings';
import NetworkStatus from './components/NetworkStatus';
import ThemeToggle from './components/ThemeToggle';
import SettingsPage from './components/SettingsPage';
import DocumentationPage from './components/DocumentationPage';
import AlertBanner from './components/AlertBanner';
import BlockFoundBanner from './components/BlockFoundBanner';

function computeEfficiency(miner) {
  if (!miner?.power || !miner?.hashRate || miner.hashRate === 0) return null;
  const thps = miner.hashRate / 1000;
  if (thps === 0) return null;
  return miner.power / thps; // J/TH (since W / TH/s = J/TH)
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Settings' },
  { id: 'docs', label: 'Docs' },
];

function getTabFromUrl() {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  if (t === 'settings') return 'settings';
  if (t === 'docs') return 'docs';
  return 'dashboard';
}

function setTabInUrl(tab) {
  const url = new URL(window.location.href);
  if (tab === 'dashboard') url.searchParams.delete('tab');
  else url.searchParams.set('tab', tab);
  const newUrl = url.search ? `${url.pathname}?${url.searchParams}` : url.pathname;
  window.history.replaceState({ tab }, '', newUrl);
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

  const { data: miner, error: minerError, loading: minerLoading, history, refetch } = useMinerData(
    10_000,
    activeTab === 'settings'
  );
  const { data: network, error: networkError } = useNetworkData(60_000);
  const { mode: themeMode, cycle: cycleTheme } = useTheme();
  const { activeAlerts, dismissAlerts } = useAlerts(miner);

  const [blockFoundVisible, setBlockFoundVisible] = useState(false);
  const prevBlockCountRef = useRef(null);

  useEffect(() => {
    if (!miner) return;
    const raw = miner.totalFoundBlocks ?? miner.foundBlocks;
    const count = typeof raw === 'number' ? raw : (miner.blockFound ? 1 : 0);
    const prev = prevBlockCountRef.current;
    if (typeof count === 'number' && count > 0 && (prev == null || count > prev)) {
      queueMicrotask(() => setBlockFoundVisible(true));
    }
    prevBlockCountRef.current = count;
  }, [miner]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const efficiency = computeEfficiency(miner);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-fg dark:text-fg-dark">
      {/* Header */}
      <header className="border-b border-border dark:border-border-dark bg-surface-card/80 dark:bg-surface-card-dark/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-fg dark:text-fg-dark">NerdQaxe++ Solo Mining Dashboard</h1>
            <nav className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`btn-tab ${activeTab === tab.id ? 'btn-tab-active' : 'btn-tab-inactive'}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle mode={themeMode} onCycle={cycleTheme} />
            {minerError ? (
              <span className="flex items-center gap-1.5 text-danger dark:text-danger-dark">
                <span className="inline-block w-2 h-2 rounded-full bg-danger dark:bg-danger-dark" />
                Miner offline
              </span>
            ) : minerLoading ? (
              <span className="text-muted dark:text-muted-dark">Connecting...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-success dark:text-success-dark">
                <span className="inline-block w-2 h-2 rounded-full bg-success dark:bg-success-dark animate-pulse" />
                Connected
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Block found success notification (stays until dismissed) */}
        {activeTab === 'dashboard' && blockFoundVisible && (
          <BlockFoundBanner onDismiss={() => setBlockFoundVisible(false)} />
        )}

        {/* Metric alerts (temp, reject rate, etc.) */}
        {activeTab === 'dashboard' && (
          <AlertBanner
            alerts={activeAlerts}
            onDismiss={dismissAlerts}
            onRequestPermission={
              typeof Notification !== 'undefined' && Notification.permission === 'default'
                ? requestNotificationPermission
                : undefined
            }
          />
        )}

        {/* Error banner */}
        {minerError && (
          <div className="alert-box-danger">
            Cannot reach miner: {minerError}
          </div>
        )}
        {networkError && activeTab === 'dashboard' && (
          <div className="alert-box-warning">
            Network data unavailable: {networkError}
          </div>
        )}

        {activeTab === 'settings' ? (
          <SettingsPage miner={miner} onSaved={refetch} />
        ) : activeTab === 'docs' ? (
          <DocumentationPage />
        ) : (
          <>
            {/* Row 1: Miner Identity */}
            <MinerStatus data={miner} />

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

            {/* Row 3: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HashrateChart history={history} />
              <TemperatureChart history={history} />
            </div>

            {/* Row 4: Mining Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SharesCard data={miner} />
              <MinerSettings data={miner} />
            </div>

            {/* Row 5: Bitcoin Network */}
            <div>
              <h2 className="text-lg font-semibold text-muted dark:text-muted-dark mb-3">Bitcoin Network</h2>
              <NetworkStatus data={network} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-border-dark mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted dark:text-muted-dark text-xs">
          NerdQaxe++ Solo Mining Dashboard
        </div>
      </footer>
    </div>
  );
}
