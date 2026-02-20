import { useTheme } from '@/context/ThemeContext';
import { AppLink } from '@/components/AppLink';
import { MAIN_TABS } from '@/components/layout/mainTabs';
import TabNav from '@/components/layout/TabNav';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function Header({ activeTab, onTabChange }) {
    const { mode, cycle } = useTheme();

    return (
        <header className="header-bar">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AppLink href="/" aria-label="Go to dashboard" className="hidden md:block">
                        <img src="/favicon/favicon.svg" alt="Solo Mining Dashboard Logo" className="w-10 h-10 dark:invert flex-shrink-0" />
                    </AppLink>
                    <h1 className="text-xl font-bold text-normal hidden md:block">Solo Mining Dashboard</h1>
                    <TabNav
                        tabs={MAIN_TABS}
                        activeTab={activeTab}
                        onTabChange={onTabChange}
                        ariaLabel="Main navigation"
                        className="flex gap-1 ml-2 md:ml-4"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <ThemeToggle mode={mode} onCycle={cycle} />
                </div>
            </div>
        </header>
    );
}
