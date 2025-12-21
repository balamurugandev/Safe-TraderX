'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

export default function EquityCurve({
    trades,
    brokeragePerTrade,
    maxDrawdownPercent = 10,
    startingCapital
}: EquityCurveProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('30D');

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
        let points = Object.entries(dailyData).map(([date, value]) => ({
            date,
            value,
            displayDate: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            tooltipDate: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Add start point (0 value) one day before first trade
        if (points.length > 0) {
            const firstDate = new Date(points[0].date);
            const startDate = new Date(firstDate);
            startDate.setDate(startDate.getDate() - 1);

            points.unshift({
                date: startDate.toISOString().split('T')[0],
                value: 0,
                displayDate: startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                tooltipDate: startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
            });
        }

        // Filter based on time range
        if (timeRange !== 'ALL') {
            const now = new Date();
            const cutoff = new Date();

            switch (timeRange) {
                case '7D':
                    cutoff.setDate(now.getDate() - 7);
                    break;
                case '30D':
                    cutoff.setDate(now.getDate() - 30);
                    break;
                case '90D':
                    cutoff.setMonth(now.getMonth() - 3); // 90 days is roughly 3 months
                    break;
            }

            points = points.filter(p => new Date(p.date) >= cutoff);
        }

        return points;
    }, [trades, brokeragePerTrade, timeRange]);

    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const values = chartData.map(p => p.value);
        const peak = Math.max(...values, 0);
        const current = values[values.length - 1];

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
            maxDrawdown,
            drawdownPct,
            isInDrawdown
        };
    }, [chartData, startingCapital, maxDrawdownPercent]);

    if (chartData.length < 1) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl ring-1 ring-white/10">
                    <p className="text-zinc-200 text-xs mb-1 font-medium">{data.tooltipDate}</p>
                    <p className={`font-mono font-bold text-base ${data.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.value >= 0 ? '+' : ''}₹{data.value.toLocaleString('en-IN')}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Equity Curve</h3>
                        <p className="text-xs text-zinc-400">Net cumulative P&L over time</p>
                    </div>
                </div>

                {/* Range Selector */}
                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/10">
                    {(['7D', '30D', '90D', 'ALL'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === range
                                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorValueLoss" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#ffffff"
                            tick={{ fontSize: 11, fill: '#fff', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            dy={10}
                        />
                        <YAxis
                            stroke="#ffffff"
                            tick={{ fontSize: 11, fill: '#fff', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={stats?.current && stats.current >= 0 ? "#10b981" : "#ef4444"}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={stats?.current && stats.current >= 0 ? "url(#colorValue)" : "url(#colorValueLoss)"}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Stats Footer */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-1">Current Net P&L</p>
                        <p className={`font-mono font-bold ${stats.current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.current >= 0 ? '+' : ''}₹{stats.current.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center border-l border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Peak Equity</p>
                        <p className="font-mono font-bold text-blue-400">
                            ₹{stats.peak.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center border-l border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Drawdown</p>
                        <p className={`font-mono font-bold ${stats.drawdownPct > 5 ? 'text-red-400' : 'text-zinc-400'}`}>
                            {stats.drawdownPct.toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
