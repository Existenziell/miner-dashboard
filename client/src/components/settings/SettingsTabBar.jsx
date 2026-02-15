const SETTINGS_TABS = [
  { id: 'init', label: 'Initialization' },
  { id: 'miner', label: 'Miner' },
  { id: 'pools', label: 'Pools' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'colors', label: 'Colors' },
];

export function SettingsTabBar({ currentTab, onTabChange }) {
  return (
    <nav className="flex gap-1 border-b border-default pb-3 mb-4" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          aria-current={currentTab === tab.id ? 'page' : undefined}
          className={`btn-tab ${currentTab === tab.id ? 'btn-tab-active' : 'btn-tab-inactive'}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
