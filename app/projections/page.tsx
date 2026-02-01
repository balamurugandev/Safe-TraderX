'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, Save, Calculator, AlertCircle, Edit2, Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday, isSaturday, isSunday, addDays, subDays } from 'date-fns';

// ------------------- Types -------------------

interface DailyTrade {
    trade_date: string;
    pnl_amount: number;
}

interface DailyTarget {
    id?: string;
    date: string;
    target_percentage: number;
    notes?: string;
}

interface Settings {
    id?: string;
    starting_capital: number;
    monthly_target_percent: number;
    yearly_target_percent: number;
    yearly_target_amount: number;
}

interface DayData {
    date: Date;
    dateStr: string;
    isToday: boolean;
    isFuture: boolean;

    startBalance: number;

    // Projection
    targetPercent: number;
    projectedGain: number;
    projectedEndBalance: number;

    // Reality
    actualPnL: number | null;
    actualPercent: number | null;
    actualEndBalance: number | null;

    // Diff
    variance: number | null; // Actual - Projected
}

const HOLIDAYS_2026 = [
    '2026-01-26', // Republic Day
    '2026-03-03', // Holi
    '2026-03-26', // Shri Ram Navami
    '2026-03-31', // Shri Mahavir Jayanti
    '2026-04-03', // Good Friday
    '2026-04-14', // Dr. Ambedkar Jayanti
    '2026-05-01', // Maharashtra Day
    '2026-05-28', // Bakri Id
    '2026-06-26', // Muharram
    '2026-09-14', // Ganesh Chaturthi
    '2026-10-02', // Gandhi Jayanti
    '2026-10-20', // Dussehra
    '2026-11-10', // Diwali Balipratipada
    '2026-11-24', // Gurunanak Jayanti
    '2026-12-25', // Christmas
];

const SPECIAL_TRADING_DAYS = [
    '2026-02-01', // Union Budget (Sunday)
    '2026-11-08', // Muhurat Trading (Sunday)
];

// ------------------- Components -------------------

export default function ProjectionsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [settings, setSettings] = useState<Settings | null>(null);
    const [trades, setTrades] = useState<DailyTrade[]>([]);
    const [targets, setTargets] = useState<DailyTarget[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing state
    const [editingDate, setEditingDate] = useState<string | null>(null);
    const [editPercent, setEditPercent] = useState<string>('');
    const [savingId, setSavingId] = useState<string | null>(null);

    // Bulk Edit State
    const [bulkPercent, setBulkPercent] = useState<string>('1.0');
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Settings
            const { data: settingsData } = await supabase.from('settings').select('*').single();

            // 2. Fetch Trades for current month (plus specific range if needed, but fetch all for now for simplicity of compounding)
            // Actually we need ALL trades to calculate current capital if we want to be accurate, 
            // OR we rely on settings.starting_capital + all_time_pnl logic.
            // Let's fetch ALL trades to compute running balance correctly from day 1 if possible, 
            // but for this view, we might just assume "Start of Month Balance" = Current Equity at start?
            // BETTER LOGIC: 
            // We need to calculate the "Start Balance" for the 1st of the selected month.
            // That requires knowing the P&L of all time prior to that month.

            const startOfView = startOfMonth(currentDate);
            const endOfView = endOfMonth(currentDate);

            const { data: allTrades } = await supabase
                .from('daily_trades')
                .select('trade_date, pnl_amount')
                .order('trade_date', { ascending: true });

            // Determine the start date for fetching targets.
            // If the view is in the future, we need targets starting from TODAY to simulate the gap.
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const viewStartStr = format(startOfView, 'yyyy-MM-dd');
            const fetchStartStr = viewStartStr > todayStr ? todayStr : viewStartStr;

            const { data: viewTargets } = await supabase
                .from('daily_targets')
                .select('*')
                .gte('date', fetchStartStr)
                .lte('date', format(endOfView, 'yyyy-MM-dd'));

            if (settingsData) {
                setSettings({
                    id: settingsData.id,
                    starting_capital: settingsData.starting_capital || 100000,
                    monthly_target_percent: settingsData.monthly_target_percent || 20,
                    yearly_target_percent: settingsData.yearly_target_percent || 200,
                    yearly_target_amount: settingsData.yearly_target_amount || 1000000,
                });
                // Initialize bulk percent from the first day's target of this month, or default to 1.0 from settings
                // Initialize bulk percent from the first day's target of this month (view start onwards)
                if (viewTargets && viewTargets.length > 0) {
                    // Find the first target that is actually within the view month
                    const firstInView = viewTargets.find(t => t.date >= viewStartStr);
                    if (firstInView) {
                        setBulkPercent(firstInView.target_percentage.toString());
                    } else if (viewTargets.length > 0 && fetchStartStr === viewStartStr) {
                        // Fallback if no specific match but we fetched correctly
                        setBulkPercent(viewTargets[0].target_percentage.toString());
                    } else {
                        // Fallback to default if no targets in view range (only gap targets exist)
                        setBulkPercent((settingsData.monthly_target_percent ? settingsData.monthly_target_percent / 20 : 1.0).toString());
                    }
                } else {
                    setBulkPercent((settingsData.monthly_target_percent ? settingsData.monthly_target_percent / 20 : 1.0).toString());
                }

            }

            if (allTrades) setTrades(allTrades);
            if (viewTargets) setTargets(viewTargets);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ------------------- Calculations -------------------

    const tableData = useMemo(() => {
        if (!settings) return [];

        // 1. Calculate Opening Balance for the 1st of the month
        const viewStart = startOfMonth(currentDate);
        const viewStartStr = format(viewStart, 'yyyy-MM-dd');
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        let openingBalance = 0;

        if (viewStartStr > todayStr) {
            // Future Month: Carrier Forward Logic
            // Start with Real Capital Today
            const tradesUntilToday = trades.filter(t => t.trade_date <= todayStr);
            const realPnLToday = tradesUntilToday.reduce((sum, t) => sum + t.pnl_amount, 0);
            let simulatedBalance = settings.starting_capital + realPnLToday;

            // Simulate Gap (Tomorrow -> Start of View - 1 day)
            // Only run simulation if there is a gap (at least 1 day)
            const gapStart = addDays(today, 1);
            const gapEnd = subDays(viewStart, 1);

            if (gapStart <= gapEnd) {
                const gapDays = eachDayOfInterval({ start: gapStart, end: gapEnd });

                gapDays.forEach(day => {
                    const dStr = format(day, 'yyyy-MM-dd');
                    // Skip holidays/weekends for simulation
                    const isSpecial = SPECIAL_TRADING_DAYS.includes(dStr);
                    const isHoliday = HOLIDAYS_2026.includes(dStr);
                    const isWeekend = isSaturday(day) || isSunday(day);

                    if (!isSpecial && (isHoliday || isWeekend)) return;

                    // Get Target
                    const targetObj = targets.find(t => t.date === dStr);
                    // Fallback to settings or default 1.0 (Wait, bulkPercent isn't available here easily, assume 1.0 or stored settings)
                    // But `targets` should have been fetched by fetchData query!
                    const pct = targetObj ? targetObj.target_percentage : (settings.monthly_target_percent ? settings.monthly_target_percent / 20 : 1.0);
                    // Note: monthly_target_percent/20 is a heuristic. Standard default seems to be 1.0 in this app.
                    // Actually, if no target exists for a future date, effectively what should it be?
                    // If user hasn't set targets, we assume default growth? Or 0?
                    // Usually assumes default daily target. 
                    // Let's use 1.0 as safe fallback or derived from monthly settings.
                    const targetPct = targetObj ? targetObj.target_percentage : 1.0;

                    simulatedBalance += simulatedBalance * (targetPct / 100);
                });
            }
            openingBalance = simulatedBalance;

        } else {
            // Past/Current Month: Standard Logic
            const pastTrades = trades.filter(t => t.trade_date < viewStartStr);
            const pastPnL = pastTrades.reduce((sum, t) => sum + t.pnl_amount, 0);
            openingBalance = settings.starting_capital + pastPnL;
        }

        // 2. Generate days
        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(currentDate),
            end: endOfMonth(currentDate)
        });

        // Initialize Compounding Balance Tracker
        let compoundingBalance = openingBalance;

        // Calculate "Latest Actual Balance" (Today's End Balance) for the static display in future
        const tradesUntilToday = trades.filter(t => t.trade_date <= todayStr);
        const realPnLToDate = tradesUntilToday.reduce((sum, t) => sum + t.pnl_amount, 0);
        const latestActualBalance = settings.starting_capital + realPnLToDate;

        const rows: DayData[] = [];

        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');

            // Holiday / Weekend Check
            const isSpecial = SPECIAL_TRADING_DAYS.includes(dateStr);
            const isHoliday = HOLIDAYS_2026.includes(dateStr);
            const isWeekend = isSaturday(day) || isSunday(day);

            if (!isSpecial && (isHoliday || isWeekend)) {
                return;
            }

            // Find trade for this day
            const dayTrades = trades.filter(t => t.trade_date === dateStr);
            const dayPnL = dayTrades.length > 0 ? dayTrades.reduce((sum, t) => sum + t.pnl_amount, 0) : null;

            // Find target for this day
            const targetObj = targets.find(t => t.date === dateStr);
            const targetPct = targetObj ? targetObj.target_percentage : 1.0;

            // Logic Split:
            // 1. Calculation Base (What number are we growing?)
            //    - If Actual exists, we grow from there.
            //    - If Future, we grow from previous Compounded Balance.

            // 2. Display Base (What number do we show in "Start Bal"?)
            //    - If Future, show LINEAR/STATIC (Latest Actual).
            //    - If Past, show Calculated Start.

            let calcStartBal = compoundingBalance;

            // Override calcStart for TODAY to be strict Morning Balance if needed? 
            // Actually, compoundingBalance generally tracks accurately from yesterday.
            // But let's apply the same "Today Strictness" fix from before if desirable.
            if (isToday(day)) {
                const pastPnLStrict = trades
                    .filter(t => t.trade_date < dateStr)
                    .reduce((sum, t) => sum + t.pnl_amount, 0);
                calcStartBal = settings.starting_capital + pastPnLStrict;
                compoundingBalance = calcStartBal; // Sync up transparency
            }

            // Calculate Projections
            const projGain = calcStartBal * (targetPct / 100);
            const projEnd = calcStartBal + projGain;

            // Calculate Reality
            const actEnd = dayPnL !== null ? calcStartBal + dayPnL : null;
            const actPct = dayPnL !== null ? (dayPnL / calcStartBal) * 100 : null;
            const variance = dayPnL !== null ? dayPnL - projGain : null;

            // Update Compounding Tracker for NEXT day
            if (dayPnL !== null) {
                // Actual trade happens -> Reset compounding path to Reality
                compoundingBalance = actEnd!;
            } else if (isFuture(day)) {
                // Future -> Compounding continues from projected end
                compoundingBalance = projEnd;
            } else {
                // Past, No Trade -> Compounding pauses (Flat)? 
                // Or typically we say "If I missed yesterday, my balance is same".
                compoundingBalance = calcStartBal;
            }

            // Determine Display Values
            let displayStartBal = calcStartBal;

            if (isFuture(day)) {
                // HYBRID LOGIC:
                // Display "Start Bal" as the Static Current Reality.
                // But "Proj End" is showing the Compounded Result (projEnd).
                displayStartBal = latestActualBalance;
            }

            rows.push({
                date: day,
                dateStr,
                isToday: isToday(day),
                isFuture: isFuture(day),
                startBalance: displayStartBal, // Shows Static in Future
                targetPercent: targetPct,
                projectedGain: projGain,
                projectedEndBalance: projEnd, // Shows Compounded in Future
                actualPnL: dayPnL,
                actualPercent: actPct,
                actualEndBalance: actEnd,
                variance,
            });
        });

        return rows;
    }, [settings, trades, targets, currentDate]);

    // ------------------- Handlers -------------------

    const handleMonthChange = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    const handleUpdateProjection = async (row: DayData) => {
        const newPercent = parseFloat(editPercent);
        if (isNaN(newPercent)) return;

        setSavingId(row.dateStr);

        try {
            // Check if exists
            const existing = targets.find(t => t.date === row.dateStr);

            if (existing) {
                await supabase.from('daily_targets')
                    .update({ target_percentage: newPercent })
                    .eq('id', existing.id);
            } else {
                await supabase.from('daily_targets')
                    .insert({
                        date: row.dateStr,
                        target_percentage: newPercent
                    });
            }

            await fetchData();
            setEditingDate(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingId(null);
        }
    };

    // Yearly Target Edit State
    const [isYearlyEditing, setIsYearlyEditing] = useState(false);
    const [yearlyInput, setYearlyInput] = useState('');

    const handleUpdateYearlyTarget = async () => {
        const amount = parseFloat(yearlyInput);
        if (isNaN(amount) || !settings?.id) return;

        try {
            const { error } = await supabase
                .from('settings')
                .update({ yearly_target_amount: amount })
                .eq('id', settings.id);

            if (error) throw error;

            await fetchData();
            setIsYearlyEditing(false);
        } catch (e: any) {
            console.error('Failed to update yearly target', e);
            alert(`Failed to update: ${e.message}`);
        }
    };



    // Let's look at existing code.
    // fetch: const { data: settingsData } = await supabase.from('settings').select('*').single();
    // settingsData has ID.
    // I should add id to the Settings interface.

    // Let's proceed with enhancing bulk update error first.

    const handleBulkUpdate = async () => {
        const pct = parseFloat(bulkPercent);
        if (isNaN(pct)) return;

        // if (!confirm(`Apply ${pct}% target to ALL days in ${format(currentDate, 'MMMM')}? This will overwrite existing custom targets for this month.`)) {
        //     return;
        // }

        setIsBulkUpdating(true);
        try {
            // Since 'date' is unique, we can construct an array of objects for all days in month.
            const daysInMonth = eachDayOfInterval({
                start: startOfMonth(currentDate),
                end: endOfMonth(currentDate)
            });

            const updates = daysInMonth.map(day => ({
                date: format(day, 'yyyy-MM-dd'),
                target_percentage: pct
            }));

            const { error } = await supabase.from('daily_targets').upsert(updates, { onConflict: 'date' });

            if (error) throw error;

            await fetchData();
        } catch (e: any) {
            console.error('Bulk update failed', e);
            alert(`Failed to update targets: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsBulkUpdating(false);
            setIsBulkEditing(false);
        }
    };

    // ... logic for yearly update will be added in SummaryCard section?
    // User wants to edit "Yearly Target Goal".
    // I will replace the SummaryCard call with a custom div or pass editing props.



    // ------------------- Summary Stats -------------------

    const monthStartBal = tableData.length > 0 ? tableData[0].startBalance : 0;
    const monthEndProj = tableData.length > 0 ? tableData[tableData.length - 1].projectedEndBalance : 0;
    // Reality End: Use the running balance carried forward from the last day
    // Reality End: Should always be Real Capital + PnL up to end of this month.
    // If future, it will just be "Current Capital" (since no future trades).
    const isFutureView = isFuture(startOfMonth(currentDate));

    const relevantTrades = trades.filter(t => t.trade_date <= format(endOfMonth(currentDate), 'yyyy-MM-dd'));
    const totalAccumulatedPnL = relevantTrades.reduce((sum, t) => sum + t.pnl_amount, 0);

    const monthEndReality = (settings?.starting_capital || 0) + totalAccumulatedPnL;

    const monthProjectedGain = monthEndProj - monthStartBal;
    // Actual Gain for this month: PnL sum for THIS month only?
    // "Current Reality" box usually shows "Total Balance".
    // Subtext shows Gain.
    // Let's keep "Current Reality" as Total Balance.

    // For the subtext "+₹ Gain (Limit%)", we probably want the gain relative to the START of this month.
    // But if Start was Simulated, Variance is huge.
    // If user wants "Original Current Balance" in the box, then we show `monthEndReality`.

    // Gain relative to what?
    // If I started with 49k (Projected) and I have 27k (Real), my gain is negative?
    // Or is it just "Gain made in March"? (Which is 0).
    // Let's calculate "Month Specific Actual Gain".
    const tradesInMonth = trades.filter(t =>
        t.trade_date >= format(startOfMonth(currentDate), 'yyyy-MM-dd') &&
        t.trade_date <= format(endOfMonth(currentDate), 'yyyy-MM-dd')
    );
    const monthActualGain = tradesInMonth.reduce((sum, t) => sum + t.pnl_amount, 0);

    if (loading) {
        return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading projections...</div>;
    }

    return (
        <div className="pt-20 pb-12 px-4 md:px-8 space-y-8">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Target className="w-8 h-8 text-purple-400" />
                        Projected vs Reality
                    </h1>
                    <p className="text-zinc-400 mt-1">Track your compounding growth against daily targets</p>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800">
                    <button onClick={() => handleMonthChange('prev')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-lg font-bold min-w-[140px] text-center font-mono">
                        {format(currentDate, 'MMMM yyyy')}
                    </div>
                    <button onClick={() => handleMonthChange('next')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Yearly Target Amount (Replaces Starting Balance) */}
                {/* Yearly Target Amount (Editable) */}
                <div className="card p-5 shadow-[0_0_30px_rgba(234,179,8,0.15)] border-yellow-500/30 relative">
                    <div className="flex justify-between items-start mb-2">
                        <p className="label">Yearly Target Goal</p>
                        <button
                            onClick={() => {
                                if (isYearlyEditing) {
                                    handleUpdateYearlyTarget();
                                } else {
                                    setYearlyInput(settings?.yearly_target_amount?.toString() || '0');
                                    setIsYearlyEditing(true);
                                }
                            }}
                            className="text-amber-400 hover:text-white transition-colors"
                        >
                            {isYearlyEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                    </div>

                    {isYearlyEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-zinc-500">₹</span>
                            <input
                                autoFocus
                                type="number"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xl font-bold text-white outline-none focus:border-amber-500"
                                value={yearlyInput}
                                onChange={(e) => setYearlyInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateYearlyTarget();
                                    if (e.key === 'Escape') setIsYearlyEditing(false);
                                }}
                            />
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-white font-mono">
                            ₹{(settings?.yearly_target_amount || 0).toLocaleString('en-IN')}
                        </p>
                    )}

                    <p className="text-xs text-zinc-400 mt-1">Amount</p>
                </div>

                <SummaryCard
                    label="Projected End (Month)"
                    value={monthEndProj}
                    subtext={`+₹${monthProjectedGain.toLocaleString('en-IN')} (${((monthProjectedGain / monthStartBal) * 100).toFixed(1)}%)`}
                    icon={<TrendingUp className="text-purple-400" />}
                    glow="purple"
                    progress={(monthEndReality / monthEndProj) * 100}
                />
                <SummaryCard
                    label="Current Reality"
                    value={monthEndReality}
                    subtext={`${monthActualGain >= 0 ? '+' : ''}₹${monthActualGain.toLocaleString('en-IN')} (${((monthActualGain / monthStartBal) * 100).toFixed(1)}%)`}
                    icon={<Wallet className={monthActualGain >= monthProjectedGain ? "text-emerald-400" : "text-blue-400"} />}
                    glow={monthActualGain >= monthProjectedGain ? "emerald" : "blue"}
                />

                {/* Bulk Update Card (Replaces Monthly Target Display) */}
                <div className={`card p-5 relative overflow-hidden transition-colors border-zinc-800 ${isBulkEditing ? 'bg-zinc-900/80 border-purple-500/50' : 'bg-zinc-900/40'}`}>
                    <div className="flex justify-between items-start">
                        <p className="label">Set Daily Target %</p>
                        <button
                            onClick={() => setIsBulkEditing(!isBulkEditing)}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            {isBulkEditing ? (
                                <span className="text-xs uppercase font-bold tracking-wider text-red-400 hover:text-red-300">Cancel</span>
                            ) : (
                                <Edit2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {isBulkEditing ? (
                        <div className="mt-2 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    type="number"
                                    step="0.1"
                                    className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-lg focus:border-purple-500 outline-none transition-colors"
                                    value={bulkPercent}
                                    onChange={(e) => setBulkPercent(e.target.value)}
                                    // Allow Enter to submit
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleBulkUpdate();
                                        if (e.key === 'Escape') setIsBulkEditing(false);
                                    }}
                                />
                                <span className="text-zinc-500">% per day</span>
                            </div>

                            <button
                                onClick={handleBulkUpdate}
                                disabled={isBulkUpdating || !bulkPercent}
                                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                            >
                                {isBulkUpdating ? 'Updating...' : 'Apply to All Days'}
                            </button>
                        </div>
                    ) : (
                        <div
                            className="mt-2 cursor-pointer group"
                            onClick={() => setIsBulkEditing(true)}
                        >
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white font-mono group-hover:text-purple-400 transition-colors">
                                    {bulkPercent}
                                </span>
                                <span className="text-zinc-500">% per day</span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1 group-hover:text-zinc-500">Click to bulk edit</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#252836] border-b border-white/5">
                            <tr className="text-left text-zinc-400">
                                <th className="p-4 font-medium sticky left-0 bg-[#252836]">Date</th>
                                <th className="p-4 font-medium text-right">Start Bal</th>
                                <th className="p-4 font-medium text-center">Proj %</th>
                                <th className="p-4 font-medium text-right text-purple-300">Target</th>
                                <th className="p-4 font-medium text-right text-purple-300">Proj End</th>
                                <th className="p-4 font-medium text-right border-l border-white/5 text-emerald-300">Reality (P&L)</th>
                                <th className="p-4 font-medium text-center text-emerald-300">Actual %</th>
                                <th className="p-4 font-medium text-right text-emerald-300">Actual End</th>
                                <th className="p-4 font-medium text-right">Variance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tableData.map((row) => {
                                const isEditing = editingDate === row.dateStr;
                                const isTodayRow = row.isToday;

                                return (
                                    <tr
                                        key={row.dateStr}
                                        className={`group transition-colors relative ${isTodayRow ? 'bg-blue-500/10 border border-blue-500/30 task-active-glow' : 'hover:bg-white/5 border-b border-white/5'}`}
                                    >
                                        {/* Date */}
                                        <td className={`p-4 whitespace-nowrap sticky left-0 transition-colors ${isTodayRow ? 'bg-[#1e1e2d]' : 'bg-[#1e1e2d] group-hover:bg-[#252836]'}`}>
                                            <div className="flex items-center gap-2">
                                                {isTodayRow && (
                                                    <div className="relative">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-500 blur-sm animate-pulse" />
                                                    </div>
                                                )}
                                                <span className={isTodayRow ? 'text-blue-100 font-bold tracking-wide' : 'text-zinc-300'}>
                                                    {format(row.date, 'dd MMM, eee')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Start Balance */}
                                        <td className="p-4 text-right font-mono text-zinc-400">
                                            ₹{row.startBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </td>

                                        {/* Proj Percentage (Editable) */}
                                        <td className="p-4 text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        step="0.1"
                                                        className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-center text-white text-xs"
                                                        value={editPercent}
                                                        onChange={(e) => setEditPercent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUpdateProjection(row);
                                                            if (e.key === 'Escape') setEditingDate(null);
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateProjection(row)}
                                                        className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded"
                                                    >
                                                        <Save className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingDate(row.dateStr);
                                                        setEditPercent(row.targetPercent.toString());
                                                    }}
                                                    className="px-2 py-0.5 rounded hover:bg-white/10 text-purple-400 hover:text-white transition-colors"
                                                >
                                                    {row.targetPercent}%
                                                </button>
                                            )}
                                        </td>

                                        {/* Projected Gain */}
                                        <td className="p-4 text-right font-mono text-purple-400/70">
                                            +₹{row.projectedGain.toFixed(0)}
                                        </td>

                                        {/* Projected End */}
                                        <td className="p-4 text-right font-mono font-medium text-purple-400">
                                            ₹{row.projectedEndBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </td>

                                        {/* Reality P&L */}
                                        <td className="p-4 text-right font-mono border-l border-white/5">
                                            {row.actualPnL !== null ? (
                                                <span className={row.actualPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {row.actualPnL > 0 ? '+' : ''}₹{row.actualPnL.toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">-</span>
                                            )}
                                        </td>

                                        {/* Actual % */}
                                        <td className="p-4 text-center font-mono">
                                            {row.actualPercent !== null ? (
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${row.actualPercent >= row.targetPercent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {row.actualPercent.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Actual End */}
                                        <td className="p-4 text-right font-mono font-medium">
                                            {row.actualEndBalance !== null ? (
                                                <span className="text-white">
                                                    ₹{row.actualEndBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">-</span>
                                            )}
                                        </td>

                                        {/* Variance */}
                                        <td className="p-4 text-right font-mono">
                                            {row.variance !== null ? (
                                                <span className={`text-xs ${row.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {row.variance > 0 ? '+' : ''}₹{row.variance.toFixed(0)}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, subtext, icon, glow, progress }: { label: string, value: number, subtext?: string, icon: any, glow?: string, progress?: number }) {
    const glowClass = glow === 'purple' ? 'shadow-[0_0_30px_rgba(168,85,247,0.15)] border-purple-500/30' :
        glow === 'emerald' ? 'shadow-[0_0_30px_rgba(16,185,129,0.15)] border-emerald-500/30' :
            glow === 'yellow' ? 'shadow-[0_0_30px_rgba(234,179,8,0.15)] border-yellow-500/30' : '';

    return (
        <div className={`card p-5 ${glowClass} relative overflow-hidden`}>
            {/* Progress Background */}
            {progress !== undefined && (
                <div className="absolute bottom-0 left-0 h-1.5 bg-zinc-800 w-full">
                    <div
                        className={`h-full ${glow === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'} transition-all duration-500`}
                        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                    />
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <p className="label">{label}</p>
                {icon}
            </div>
            <p className="text-2xl font-bold text-white font-mono">
                ₹{value.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-zinc-400">{subtext}</p>
                {progress !== undefined && (
                    <p className={`text-xs font-bold ${glow === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {progress.toFixed(0)}%
                    </p>
                )}
            </div>
        </div>
    );
}
