import TabNav from '@/components/layout/TabNav';

const SETTINGS_TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'miner', label: 'Miner' },
  { id: 'pools', label: 'Pools' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'appearance', label: 'Appearance' },
];

export function SettingsTabNav({ currentTab, onTabChange }) {
  return (
    <TabNav
      tabs={SETTINGS_TABS}
      activeTab={currentTab}
      onTabChange={onTabChange}
      ariaLabel="Settings sections"
      className="flex gap-1 border-b border-default pb-3 mb-4"
    />
  );
}
