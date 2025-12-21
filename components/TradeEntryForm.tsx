'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradeEntryFormProps {
    startingCapital: number;
    onTradeAdded: () => void;
    disabled: boolean;
}

export default function TradeEntryForm({ startingCapital, onTradeAdded, disabled }: TradeEntryFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        trade_name: '',
        pnl_amount: '',
    });

    const pnlValue = parseFloat(formData.pnl_amount) || 0;
    const pnlPercent = startingCapital > 0 ? (pnlValue / startingCapital) * 100 : 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (disabled) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('daily_trades')
                .insert({
                    trade_name: formData.trade_name,
                    pnl_amount: pnlValue,
                    trade_date: new Date().toISOString().split('T')[0],
                });

            if (error) throw error;

            setFormData({ trade_name: '', pnl_amount: '' });
            onTradeAdded();
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Failed to add trade');
        } finally {
            setLoading(false);
        }
    }

    if (disabled) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5 p-8"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.15),transparent_50%)]" />
                <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-red-400">Trading Locked</h3>
                        <p className="text-red-300/60 mt-2 max-w-md mx-auto">
                            Your daily limits have been triggered. No further trades can be logged until the next session.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                        <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Log Trade</h3>
                        <p className="text-xs text-zinc-500">Record your position</p>
                    </div>
                </div>

                {/* Live Impact Badge */}
                {formData.pnl_amount && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`badge ${pnlPercent >= 0 ? 'badge-profit' : 'badge-loss'}`}
                    >
                        {pnlPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </motion.div>
                )}
            </div>

            {/* Form Row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {/* Script Name - Takes 3 columns */}
                <div className="sm:col-span-3 space-y-2">
                    <label className="label">Script / Instrument</label>
                    <input
                        type="text"
                        value={formData.trade_name}
                        onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                        className="input"
                        placeholder="e.g., NIFTY 22000 CE"
                        required
                    />
                </div>

                {/* P&L - Takes 2 columns */}
                <div className="sm:col-span-2 space-y-2">
                    <label className="label">P&L Amount (₹)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.pnl_amount}
                            onChange={(e) => setFormData({ ...formData, pnl_amount: e.target.value })}
                            className={`input pr-10 ${pnlValue < 0 ? 'text-red-400' : pnlValue > 0 ? 'text-emerald-400' : ''}`}
                            placeholder="-500 or +1000"
                            required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            {pnlValue < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-500/50" />
                            ) : pnlValue > 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500/50" />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        Log Trade
                    </>
                )}
            </motion.button>
        </motion.form>
    );
}
