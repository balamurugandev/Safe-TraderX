'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Trade {
    id: string;
    pnl_amount: number;
    trade_date: string;
    trade_name?: string;
    comments?: string;
}

interface MonthlyPerformanceProps {
    trades: Trade[];
}

function formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    return value === 0 ? '₹0' : `₹${absValue.toLocaleString('en-IN')}`;
}

export default function MonthlyPerformance({ trades }: MonthlyPerformanceProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const dailyPnL = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dailyTotals: { [day: number]: number } = {};

        trades.forEach(trade => {
            // Filter out Capital Adjustments from Performance View
            if (trade.comments === 'CAPITAL_ADJUSTMENT' || trade.trade_name === 'DEPOSIT' || trade.trade_name === 'WITHDRAWAL') {
                return;
            }

            const tradeDate = new Date(trade.trade_date);
            if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
                const day = tradeDate.getDate();
                dailyTotals[day] = (dailyTotals[day] || 0) + trade.pnl_amount;
            }
        });
        return dailyTotals;
    }, [trades, currentDate]);

    const monthlyTotal = useMemo(() => Object.values(dailyPnL).reduce((sum, val) => sum + val, 0), [dailyPnL]);
    const tradingDays = Object.keys(dailyPnL).length;
    const winningDays = Object.values(dailyPnL).filter(v => v > 0).length;
    const losingDays = Object.values(dailyPnL).filter(v => v < 0).length;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Create calendar grid
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-visible)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Monthly Performance</h3>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold mr-2" style={{ color: 'var(--text-primary)' }}>{monthName}</span>
                    <button onClick={goToPreviousMonth} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={goToNextMonth} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Compact Calendar Grid */}
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
                {/* Week Headers */}
                <div className="grid grid-cols-7" style={{ background: 'var(--bg-secondary)' }}>
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            className="text-center text-[10px] font-semibold py-1.5"
                            style={{
                                color: 'var(--text-primary)',
                                borderBottom: '1px solid var(--border-visible)'
                            }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days - Compact Fixed Height */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7">
                        {week.map((day, dayIndex) => {
                            const isLastRow = weekIndex === weeks.length - 1;
                            const isLastCol = dayIndex === 6;

                            if (day === null) {
                                return (
                                    <div
                                        key={dayIndex}
                                        className="h-[80px]"
                                        style={{
                                            background: 'var(--bg-primary)',
                                            borderRight: isLastCol ? 'none' : '1px solid var(--border-visible)',
                                            borderBottom: isLastRow ? 'none' : '1px solid var(--border-visible)'
                                        }}
                                    />
                                );
                            }

                            const pnl = dailyPnL[day] || 0;
                            const hasTrade = pnl !== 0;

                            let bgColor = 'var(--bg-primary)';
                            let valueColor = 'var(--text-muted)';
                            let dayColor = 'var(--text-secondary)';

                            if (pnl > 0) {
                                bgColor = 'rgba(16, 185, 129, 0.15)';
                                valueColor = '#10b981';
                                dayColor = '#10b981';
                            } else if (pnl < 0) {
                                bgColor = 'rgba(239, 68, 68, 0.15)';
                                valueColor = '#ef4444';
                                dayColor = '#ef4444';
                            }

                            const displayValue = pnl > 0 ? `+${formatCurrency(pnl)}` : pnl < 0 ? `−${formatCurrency(pnl)}` : formatCurrency(pnl);

                            return (
                                <div
                                    key={dayIndex}
                                    className="h-[80px] flex flex-col items-center justify-center transition-all hover:brightness-110"
                                    style={{
                                        background: bgColor,
                                        borderRight: isLastCol ? 'none' : '1px solid var(--border-visible)',
                                        borderBottom: isLastRow ? 'none' : '1px solid var(--border-visible)'
                                    }}
                                >
                                    <span className="text-sm font-semibold mb-1" style={{ color: hasTrade ? dayColor : 'var(--text-primary)' }}>
                                        {day}
                                    </span>
                                    <span className="text-sm font-bold" style={{ color: valueColor }}>
                                        {displayValue}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Compact Summary Footer */}
            <div className="mt-3 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span style={{ color: 'var(--text-secondary)' }}>{winningDays} won</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span style={{ color: 'var(--text-secondary)' }}>{losingDays} lost</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{tradingDays} trading days</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                    <span className={`font-bold font-mono text-xs ${monthlyTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {monthlyTotal >= 0 ? '+' : '−'}₹{Math.abs(monthlyTotal).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
