'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, History, Zap, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-visible)] shadow-lg"
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[var(--text-primary)] hidden sm:block">Safe TradeX</span>
                </Link>

                {/* Divider */}
                <div className="h-6 w-px bg-[var(--border-visible)] mx-2" />

                {/* Nav Links */}
                <NavLink
                    href="/"
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    label="Dashboard"
                    active={pathname === '/'}
                />
                <NavLink
                    href="/history"
                    icon={<History className="w-4 h-4" />}
                    label="History"
                    active={pathname === '/history'}
                />
                <NavLink
                    href="/settings"
                    icon={<Settings className="w-4 h-4" />}
                    label="Settings"
                    active={pathname === '/settings'}
                />

                {/* Divider */}
                <div className="h-6 w-px bg-[var(--border-visible)] mx-2" />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? (
                        <Moon className="w-5 h-5" />
                    ) : (
                        <Sun className="w-5 h-5" />
                    )}
                </button>
            </motion.nav>
        </div>
    );
}

function NavLink({
    href,
    icon,
    label,
    active
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
        ${active
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 dark:text-indigo-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }
      `}
        >
            {active && (
                <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-100 dark:from-indigo-500/20 to-transparent rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">
                {icon}
                <span className="hidden sm:inline">{label}</span>
            </span>
        </Link>
    );
}
