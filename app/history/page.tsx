'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { History, TrendingUp, TrendingDown, Calendar, ArrowUpDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface Trade {
    id: string;
    trade_name: string;
    pnl_amount: number;
    trade_date: string;
    created_at: string;
}

export default function HistoryPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<'trade_date' | 'pnl_amount'>('trade_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateFilter, setDateFilter] = useState('');

    const fetchTrades = useCallback(async () => {
        try {
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

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl_amount, 0);
    const winningTrades = trades.filter(t => t.pnl_amount > 0);
    const losingTrades = trades.filter(t => t.pnl_amount < 0);

    // Calculate cumulative P&L for each trade
    let cumulative = 0;
    const tradesWithCumulative = trades.map(trade => {
        cumulative += trade.pnl_amount;
        return { ...trade, cumulative };
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading trade history...</p>
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
                        <h1 className="text-2xl font-bold text-white">Trade History</h1>
                        <p className="text-sm text-zinc-500">All your recorded trades</p>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input pl-10 pr-4 py-2 w-44"
                            placeholder="Filter by date"
                        />
                    </div>
                    {dateFilter && (
                        <button
                            onClick={() => setDateFilter('')}
                            className="btn-secondary py-2 px-4 text-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="label mb-1">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{trades.length}</p>
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

            {/* Trades Table */}
            {trades.length === 0 ? (
                <div className="card p-12 text-center">
                    <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 text-lg">No trades found</p>
                    <p className="text-zinc-600 text-sm mt-1">
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
                                            <span className="text-zinc-300 font-medium">
                                                {new Date(trade.trade_date).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className="text-white font-medium">{trade.trade_name}</span>
                                        </td>
                                        <td className="table-cell text-right">
                                            <span className={`font-mono font-bold ${trade.pnl_amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl_amount >= 0 ? '+' : ''}₹{trade.pnl_amount.toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="table-cell text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {trade.cumulative >= 0 ? (
                                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={`font-mono ${trade.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    ₹{trade.cumulative.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
