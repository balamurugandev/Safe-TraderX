'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, History, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#22222e]/90 backdrop-blur-xl border border-white/10 shadow-lg"
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white hidden sm:block">Safe TradeX</span>
                </Link>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10 mx-2" />

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
                    ? 'text-white bg-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }
      `}
        >
            {active && (
                <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-full"
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
