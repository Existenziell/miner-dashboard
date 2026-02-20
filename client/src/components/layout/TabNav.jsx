export default function TabNav({ tabs, activeTab, onTabChange, ariaLabel, className = '' }) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`btn-tab ${activeTab === tab.id ? 'btn-tab-active' : 'btn-tab-inactive'}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
