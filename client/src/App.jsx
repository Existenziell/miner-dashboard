import { useState, useCallback, useEffect } from 'react';
import { useMinerData } from './hooks/useMinerData';
import { useNetworkData } from './hooks/useNetworkData';
import { useTheme } from './hooks/useTheme';
import { useAlerts } from './hooks/useAlerts';
import { formatHashrate, formatTemp, formatPower } from './lib/formatters';
import MinerStatus from './components/MinerStatus';
import StatCard from './components/StatCard';
import HashrateChart from './components/HashrateChart';
import TemperatureChart from './components/TemperatureChart';
import SharesCard from './components/SharesCard';
import MinerSettings from './components/MinerSettings';
import NetworkStatus from './components/NetworkStatus';
import ThemeToggle from './components/ThemeToggle';
import SettingsPage from './components/SettingsPage';
import AlertBanner from './components/AlertBanner';

function computeEfficiency(miner) {
  if (!miner?.power || !miner?.hashRate || miner.hashRate === 0) return null;
  const thps = miner.hashRate / 1000;
  if (thps === 0) return null;
  return miner.power / thps; // J/TH (since W / TH/s = J/TH)
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Settings' },
];

function getTabFromUrl() {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  return t === 'settings' ? 'settings' : 'dashboard';
}

function setTabInUrl(tab) {
  const url = new URL(window.location.href);
  if (tab === 'dashboard') {
    url.searchParams.delete('tab');
  } else {
    url.searchParams.set('tab', tab);
  }
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

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const efficiency = computeEfficiency(miner);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      {/* Header */}
      <header className="border-b border-[var(--c-border)] bg-surface-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-btc-orange">NerdQaxe++ Solo Mining Dashboard</h1>
            <nav className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-btc-orange/20 text-btc-orange'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle mode={themeMode} onCycle={cycleTheme} />
            {minerError ? (
              <span className="flex items-center gap-1.5 text-danger">
                <span className="inline-block w-2 h-2 rounded-full bg-danger" />
                Miner offline
              </span>
            ) : minerLoading ? (
              <span className="text-text-secondary">Connecting...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-success">
                <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
                Connected
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-danger text-sm">
            Cannot reach miner: {minerError}
          </div>
        )}
        {networkError && activeTab === 'dashboard' && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-warning text-sm">
            Network data unavailable: {networkError}
          </div>
        )}

        {activeTab === 'settings' ? (
          <SettingsPage miner={miner} onSaved={refetch} />
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
          />
          <StatCard
            label="ASIC Temperature"
            value={formatTemp(miner?.temp)}
            sub={miner?.vrTemp != null ? `VR: ${formatTemp(miner.vrTemp)}` : undefined}
            color={miner?.temp > 70 ? 'text-danger' : miner?.temp > 60 ? 'text-warning' : 'text-success'}
          />
          <StatCard
            label="Power"
            value={formatPower(miner?.power)}
            sub={miner?.voltage != null ? `${(miner.voltage / 1000).toFixed(2)} V input` : undefined}
            color="text-btc-orange"
          />
          <StatCard
            label="Efficiency"
            value={efficiency != null ? `${efficiency.toFixed(1)} J/TH` : '--'}
            sub={miner?.expectedHashrate != null ? `Expected: ${formatHashrate(miner.expectedHashrate)}` : undefined}
            color="text-btc-orange-light"
          />
          <StatCard
            label="Input Current"
            value={miner?.current != null ? `${(miner.current / 1000).toFixed(2)} A` : '--'}
            sub={miner?.current != null ? `${miner.current.toFixed(0)} mA` : undefined}
          />
          <StatCard
            label="ASIC Frequency"
            value={miner?.frequency != null ? `${miner.frequency} MHz` : '--'}
            sub={miner?.frequency != null && miner?.defaultFrequency != null
              ? `Default: ${miner.defaultFrequency} MHz (${miner.frequency > miner.defaultFrequency ? '+' : ''}${((miner.frequency - miner.defaultFrequency) / miner.defaultFrequency * 100).toFixed(0)}%)`
              : undefined}
          />
          <StatCard
            label="ASIC Voltage"
            value={miner?.coreVoltageActual != null ? `${miner.coreVoltageActual} mV` : '--'}
            sub={miner?.coreVoltage != null ? `Set: ${miner.coreVoltage} mV` : undefined}
          />
          <StatCard
            label="Fan Speed"
            value={miner?.fanrpm != null ? `${miner.fanrpm} RPM` : '--'}
            sub={miner?.fanspeed != null
              ? `${miner.fanspeed.toFixed(0)}% ${miner?.autofanspeed ? '(auto)' : '(manual)'}`
              : undefined}
            color="text-blue-400"
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
          <h2 className="text-lg font-semibold text-text-secondary mb-3">Bitcoin Network</h2>
          <NetworkStatus data={network} />
        </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--c-border)] mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-text-secondary text-xs">
          NerdQaxe++ Solo Mining Dashboard
        </div>
      </footer>
    </div>
  );
}
