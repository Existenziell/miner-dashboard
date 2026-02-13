import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Settings' },
  { id: 'api', label: 'API' },
  { id: 'docs', label: 'Docs' },
];

export default function Header({ activeTab, onTabChange }) {
  const { mode, cycle } = useTheme();

    return (
        <header className="header-bar">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/favicon/favicon.svg" alt="NerdQaxe++" className="w-10 h-10 dark:invert" />
                    <h1 className="text-xl font-bold text-body">NerdQaxe++ Solo Mining Dashboard</h1>
                    <nav className="flex gap-1 ml-4">
                        {TABS.map((tab) => (
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
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <ThemeToggle mode={mode} onCycle={cycle} />
                </div>
            </div>
        </header>
    );
}