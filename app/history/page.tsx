'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { History, TrendingUp, TrendingDown, Calendar, ArrowUpDown, Filter, Edit2, Trash2, X, Save, AlertTriangle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EquityCurve from '@/components/EquityCurve';
import MonthlyPerformance from '@/components/MonthlyPerformance';

interface Trade {
    id: string;
    trade_name: string;
    pnl_amount: number;
    comments?: string;
    setup_type?: string;
    market_state?: string;
    trade_date: string;
    created_at: string;
    cumulative?: number;
}

interface Settings {
    starting_capital: number;
    brokerage_per_order: number;
    max_lot_size: number;
    lot_value: number;
}

export default function HistoryPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [allTrades, setAllTrades] = useState<Trade[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<'trade_date' | 'pnl_amount'>('trade_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateFilter, setDateFilter] = useState(() => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    });
    const [allTimePnL, setAllTimePnL] = useState(0);

    // Edit modal state
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [editForm, setEditForm] = useState({
        trade_name: '',
        pnl_amount: '',
        comments: '',
        trade_date: ''
    });
    const [saving, setSaving] = useState(false);
    const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);

    const fetchTrades = useCallback(async () => {
        try {
            // Fetch settings
            const { data: settingsData } = await supabase
                .from('settings')
                .select('*')
                .single();

            if (settingsData) {
                setSettings({
                    starting_capital: settingsData.starting_capital || 100000,
                    brokerage_per_order: settingsData.brokerage_per_order || 20,
                    max_lot_size: settingsData.max_lot_size || 50,
                    lot_value: settingsData.lot_value || 50,
                });
            }

            // Fetch trades
            let query = supabase
                .from('daily_trades')
                .select('*')
                .order(sortField, { ascending: sortOrder === 'asc' });

            if (dateFilter) {
                query = query.eq('trade_date', dateFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) setTrades(data);

            // Fetch All-Time Trades for Balance Calculation & Equity Curve
            const { data: allTradesData, error: allTimeError } = await supabase
                .from('daily_trades')
                .select('*')
                .order('created_at', { ascending: true });

            if (allTradesData && !allTimeError) {
                setAllTrades(allTradesData);
                const total = allTradesData.reduce((sum, t) => sum + (t.pnl_amount || 0), 0);
                setAllTimePnL(total);
            }

        } catch (error) {
            console.error('Error fetching trades:', error);
        } finally {
            setLoading(false);
        }
    }, [sortField, sortOrder, dateFilter]);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    const toggleSort = (field: 'trade_date' | 'pnl_amount') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleEdit = (trade: Trade) => {
        setEditingTrade(trade);
        setEditForm({
            trade_name: trade.trade_name,
            pnl_amount: trade.pnl_amount.toString(),
            comments: trade.comments || '',
            trade_date: trade.trade_date
        });
    };

    const handleSave = async () => {
        if (!editingTrade) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('daily_trades')
                .update({
                    trade_name: editForm.trade_name,
                    pnl_amount: parseFloat(editForm.pnl_amount) || 0,
                    comments: editForm.comments || null,
                    trade_date: editForm.trade_date
                })
                .eq('id', editingTrade.id);

            if (error) throw error;

            setEditingTrade(null);
            fetchTrades();
        } catch (error) {
            console.error('Error updating trade:', error);
            alert('Failed to update trade');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (tradeId: string) => {
        setDeletingTradeId(tradeId);
    };

    const confirmDelete = async () => {
        if (!deletingTradeId) return;

        try {
            const { error } = await supabase
                .from('daily_trades')
                .delete()
                .eq('id', deletingTradeId);

            if (error) throw error;
            fetchTrades();
        } catch (error) {
            console.error('Error deleting trade:', error);
            alert('Failed to delete trade');
        } finally {
            setDeletingTradeId(null);
        }
    };

    // Exclude Capital Adjustments from Stats
    const statsTrades = trades.filter(t => t.comments !== 'CAPITAL_ADJUSTMENT');
    const totalPnL = statsTrades.reduce((sum, t) => sum + t.pnl_amount, 0);
    const winningTrades = statsTrades.filter(t => t.pnl_amount > 0);
    const losingTrades = statsTrades.filter(t => t.pnl_amount < 0);

    // Calculate cumulative P&L for each trade
    let cumulative = 0;
    const tradesWithCumulative = trades.map(trade => {
        cumulative += trade.pnl_amount;
        return { ...trade, cumulative };
    });

    // Exclude Capital Adjustments from Charts (Performance View)
    const statsAllTrades = allTrades.filter(t =>
        t.comments !== 'CAPITAL_ADJUSTMENT' &&
        t.trade_name !== 'DEPOSIT' &&
        t.trade_name !== 'WITHDRAWAL'
    );

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">Loading trade history...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pt-20 pb-8"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <History className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Trade History</h1>
                        <p className="text-sm text-[var(--text-muted)]">All your recorded trades</p>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-3 p-1.5 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-visible)' }}>
                    <span className="text-sm font-medium pl-2" style={{ color: 'var(--text-muted)' }}>Date Filter:</span>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 pl-10 pr-2 py-1 w-40"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                    {dateFilter && (
                        <button
                            onClick={() => setDateFilter('')}
                            className="p-1 rounded-lg transition-colors"
                            title="Clear filter"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="card p-4 relative group">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-zinc-400" />
                        <p className="label">Capital</p>
                        <div className="group relative">
                            <div className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] text-zinc-400 cursor-help">?</div>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-zinc-800 rounded-lg border border-zinc-700 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                Current Equity = Initial Capital + All-Time Net P&L
                            </div>
                        </div>
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
                        ₹{settings ? (settings.starting_capital + allTimePnL).toLocaleString('en-IN') : '---'}
                    </p>
                    {settings && (
                        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                            Initial: ₹{settings.starting_capital.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Total Trades</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{trades.length}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Winning</p>
                    <p className="text-2xl font-bold text-emerald-400">{winningTrades.length}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Losing</p>
                    <p className="text-2xl font-bold text-red-400">{losingTrades.length}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Net P&L</p>
                    <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Monthly Performance Calendar */}
            {allTrades.length > 0 && (
                <MonthlyPerformance trades={statsAllTrades} />
            )}

            {/* Equity Curve Chart - Shows FULL history regardless of table filter */}
            {settings && (
                <EquityCurve
                    trades={statsAllTrades}
                    brokeragePerTrade={settings.brokerage_per_order}
                    startingCapital={settings.starting_capital}
                    maxDrawdownPercent={10}
                />
            )}

            {/* Trades Table */}
            {trades.length === 0 ? (
                <div className="card p-12 text-center">
                    <Filter className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>No trades found</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {dateFilter ? 'Try selecting a different date' : 'Start logging trades to see them here'}
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th
                                        className="table-header cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => toggleSort('trade_date')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Date
                                            <ArrowUpDown className={`w-3 h-3 ${sortField === 'trade_date' ? 'text-emerald-400' : ''}`} />
                                        </div>
                                    </th>
                                    <th className="table-header">Trade Name</th>
                                    <th className="table-header">Comments</th>
                                    <th
                                        className="table-header cursor-pointer hover:bg-white/5 transition-colors text-right"
                                        onClick={() => toggleSort('pnl_amount')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            P&L
                                            <ArrowUpDown className={`w-3 h-3 ${sortField === 'pnl_amount' ? 'text-emerald-400' : ''}`} />
                                        </div>
                                    </th>
                                    <th className="table-header text-right">Cumulative</th>
                                    <th className="table-header text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tradesWithCumulative.map((trade, index) => (
                                    <motion.tr
                                        key={trade.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="table-row"
                                    >
                                        <td className="table-cell">
                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {new Date(trade.trade_date).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className="text-[var(--text-primary)] font-medium">{trade.trade_name}</span>
                                        </td>
                                        <td className="table-cell">
                                            <span className="text-sm text-zinc-300">{trade.comments || '-'}</span>
                                        </td>
                                        <td className="table-cell text-right">
                                            <span className={`font-mono font-bold ${trade.pnl_amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl_amount >= 0 ? '+' : ''}₹{trade.pnl_amount.toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="table-cell text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {trade.cumulative! >= 0 ? (
                                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={`font-mono ${trade.cumulative! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    ₹{trade.cumulative!.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(trade)}
                                                    className="p-3 rounded-xl hover:bg-blue-500/10 transition-colors text-blue-400 hover:text-blue-300"
                                                    title="Edit trade"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trade.id)}
                                                    className="p-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
                                                    title="Delete trade"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingTrade && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                    >
                        <div className="absolute inset-0" onClick={() => setEditingTrade(null)} />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg"
                        >
                            <div className="card p-6 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Trade</h2>
                                    <button
                                        onClick={() => setEditingTrade(null)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        <X className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="label">Trade Date</label>
                                        <input
                                            type="date"
                                            value={editForm.trade_date}
                                            onChange={(e) => setEditForm({ ...editForm, trade_date: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="label">Trade Name</label>
                                        <input
                                            type="text"
                                            value={editForm.trade_name}
                                            onChange={(e) => setEditForm({ ...editForm, trade_name: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="label">P&L Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={editForm.pnl_amount}
                                            onChange={(e) => setEditForm({ ...editForm, pnl_amount: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="label">Comments</label>
                                        <input
                                            type="text"
                                            value={editForm.comments}
                                            onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                                            className="input"
                                            placeholder="Add notes about this trade..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditingTrade(null)}
                                        className="btn-secondary flex-1 justify-center"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn-primary flex-1 justify-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingTradeId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card p-6 w-full max-w-sm space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20">
                                    <Trash2 className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Trade?</h3>
                                    <p className="text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingTradeId(null)}
                                    className="btn-secondary flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
