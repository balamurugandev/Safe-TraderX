'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Trade {
    id: string;
    pnl_amount: number;
    trade_date: string;
    created_at: string;
}

interface EquityCurveProps {
    trades: Trade[];
    brokeragePerTrade: number;
    maxDrawdownPercent?: number;
    startingCapital: number;
}

export default function EquityCurve({
    trades,
    brokeragePerTrade,
    maxDrawdownPercent = 10,
    startingCapital
}: EquityCurveProps) {
    const chartData = useMemo(() => {
        // Sort trades by date
        const sorted = [...trades].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Calculate cumulative net P&L by day
        const dailyData: { [date: string]: number } = {};
        let cumulative = 0;

        sorted.forEach(trade => {
            const date = trade.trade_date;
            const netPnl = trade.pnl_amount - (brokeragePerTrade * 2 * 1.18); // Include GST
            cumulative += netPnl;
            dailyData[date] = cumulative;
        });

        // Convert to array for chart
        const points = Object.entries(dailyData).map(([date, value]) => ({
            date,
            value,
            displayDate: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        }));

        return points;
    }, [trades, brokeragePerTrade]);

    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const values = chartData.map(p => p.value);
        const peak = Math.max(...values, 0);
        const current = values[values.length - 1];
        const lowest = Math.min(...values, 0);

        // Calculate max drawdown from peak
        let maxDrawdown = 0;
        let runningPeak = 0;
        values.forEach(v => {
            if (v > runningPeak) runningPeak = v;
            const drawdown = runningPeak - v;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        const drawdownPct = startingCapital > 0 ? (maxDrawdown / startingCapital) * 100 : 0;
        const isInDrawdown = drawdownPct > maxDrawdownPercent;

        return {
            peak,
            current,
            lowest,
            maxDrawdown,
            drawdownPct,
            isInDrawdown
        };
    }, [chartData, startingCapital, maxDrawdownPercent]);

    if (chartData.length < 2) {
        return null;
    }

    // Calculate chart dimensions
    const width = 100;
    const height = 100;
    const padding = 10;

    const values = chartData.map(p => p.value);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 0);
    const range = maxVal - minVal || 1;

    // Generate SVG path
    const points = chartData.map((p, i) => {
        const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((p.value - minVal) / range) * (height - 2 * padding);
        return `${x},${y}`;
    });
    const linePath = `M ${points.join(' L ')}`;

    // Zero line Y position
    const zeroY = height - padding - ((0 - minVal) / range) * (height - 2 * padding);

    // Drawdown threshold line
    const drawdownThreshold = -(startingCapital * maxDrawdownPercent / 100);
    const drawdownY = height - padding - ((drawdownThreshold - minVal) / range) * (height - 2 * padding);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Equity Curve (30 days)</h3>
                </div>
                {stats && (
                    <div className="flex items-center gap-4 text-sm">
                        <div>
                            <span className="text-zinc-500">Peak: </span>
                            <span className="text-emerald-400 font-mono">₹{stats.peak.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500">Drawdown: </span>
                            <span className={`font-mono ${stats.drawdownPct > 5 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {stats.drawdownPct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Drawdown Warning */}
            {stats?.isInDrawdown && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-red-400 font-semibold">Max Drawdown Exceeded!</p>
                        <p className="text-red-300/70 text-sm">
                            Consider a 2-day trading holiday to reset your mindset.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Chart */}
            <div className="h-40 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                    {/* Zero line */}
                    <line
                        x1={padding}
                        y1={zeroY}
                        x2={width - padding}
                        y2={zeroY}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                    />

                    {/* Drawdown threshold line */}
                    {drawdownY >= 0 && drawdownY <= height && (
                        <line
                            x1={padding}
                            y1={drawdownY}
                            x2={width - padding}
                            y2={drawdownY}
                            stroke="rgba(239,68,68,0.3)"
                            strokeWidth="0.5"
                            strokeDasharray="4,2"
                        />
                    )}

                    {/* Gradient fill under curve */}
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={stats?.current && stats.current >= 0 ? 'rgb(16,185,129)' : 'rgb(239,68,68)'} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={stats?.current && stats.current >= 0 ? 'rgb(16,185,129)' : 'rgb(239,68,68)'} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d={`${linePath} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`}
                        fill="url(#curveGradient)"
                    />

                    {/* Main line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={stats?.current && stats.current >= 0 ? 'rgb(16,185,129)' : 'rgb(239,68,68)'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {chartData.map((p, i) => {
                        const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
                        const y = height - padding - ((p.value - minVal) / range) * (height - 2 * padding);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="1.5"
                                fill={p.value >= 0 ? 'rgb(16,185,129)' : 'rgb(239,68,68)'}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{chartData[0]?.displayDate}</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-zinc-600" style={{ borderStyle: 'dashed' }} />
                        <span>Zero Line</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-red-500/50" style={{ borderStyle: 'dashed' }} />
                        <span>-{maxDrawdownPercent}% Drawdown</span>
                    </div>
                </div>
                <span>{chartData[chartData.length - 1]?.displayDate}</span>
            </div>

            {/* Current Value */}
            {stats && (
                <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-xs text-zinc-500 mb-1">Current Net Equity</p>
                    <p className={`text-2xl font-bold font-mono ${stats.current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.current >= 0 ? '+' : ''}₹{stats.current.toFixed(0).toLocaleString()}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
