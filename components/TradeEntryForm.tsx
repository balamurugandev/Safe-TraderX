'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, TrendingUp, TrendingDown, Lock, Calendar, MessageSquare, X, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import EmotionalChecklist from './EmotionalChecklist';

interface TradeEntryFormProps {
    startingCapital: number;
    maxTradesPerDay: number;
    todayTradeCount: number;
    lastLossTime: Date | null;
    onTradeAdded: () => void;
    disabled: boolean;
    disableReason?: string;
}

const COOL_OFF_MINUTES = 15;

const getDefaultFormData = () => ({
    trade_name: '',
    pnl_amount: '',
    comments: '',
    trade_date: new Date().toISOString().split('T')[0],
});

export default function TradeEntryForm({
    startingCapital,
    maxTradesPerDay,
    todayTradeCount,
    lastLossTime,
    onTradeAdded,
    disabled,
    disableReason
}: TradeEntryFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(getDefaultFormData());
    const [showChecklist, setShowChecklist] = useState(false);
    const [coolOffRemaining, setCoolOffRemaining] = useState(0);

    const pnlValue = parseFloat(formData.pnl_amount) || 0;
    const pnlPercent = startingCapital > 0 ? (pnlValue / startingCapital) * 100 : 0;

    // Check cool-off timer
    useEffect(() => {
        if (!lastLossTime) {
            setCoolOffRemaining(0);
            return;
        }

        const checkCoolOff = () => {
            const now = new Date();
            const coolOffEnd = new Date(lastLossTime.getTime() + COOL_OFF_MINUTES * 60 * 1000);
            const remaining = Math.max(0, coolOffEnd.getTime() - now.getTime());
            setCoolOffRemaining(Math.ceil(remaining / 1000));
        };

        checkCoolOff();
        const interval = setInterval(checkCoolOff, 1000);
        return () => clearInterval(interval);
    }, [lastLossTime]);

    const handleClear = () => {
        setFormData(getDefaultFormData());
    };

    // Show checklist before allowing trade entry
    const handleFormClick = (e: React.MouseEvent) => {
        // If clicking on the form but checklist hasn't been shown yet
        if (!showChecklist && !formData.trade_name && !formData.pnl_amount) {
            e.preventDefault();
            setShowChecklist(true);
        }
    };

    const handleChecklistContinue = () => {
        setShowChecklist(false);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (disabled || coolOffRemaining > 0) return;

        setLoading(true);
        try {
            const isLoss = pnlValue < 0;

            // Don't include is_loss - let DB compute it or ignore
            const { error } = await supabase
                .from('daily_trades')
                .insert({
                    trade_name: formData.trade_name,
                    pnl_amount: pnlValue,
                    comments: formData.comments || null,
                    trade_date: formData.trade_date,
                });

            if (error) throw error;

            // Store last loss time in localStorage if this was a loss
            if (isLoss) {
                localStorage.setItem('lastLossTime', new Date().toISOString());
            }

            setFormData(getDefaultFormData());
            onTradeAdded();
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Failed to add trade');
        } finally {
            setLoading(false);
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const tradesRemaining = maxTradesPerDay - todayTradeCount;
    const isMaxTradesReached = tradesRemaining <= 0;
    const isCoolingOff = coolOffRemaining > 0;

    // Combined disabled state
    const isFormDisabled = disabled || isMaxTradesReached || isCoolingOff;

    // Cooling off UI
    if (isCoolingOff) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-8 border-yellow-500/30"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                        <Timer className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-yellow-400">Cooling Down...</h3>
                        <p className="text-yellow-300/60 mt-2 max-w-md mx-auto">
                            After a loss, take 15 minutes to reset your emotions before the next trade.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-400 font-mono text-3xl font-bold">
                            {formatTime(coolOffRemaining)}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Max trades reached UI
    if (isMaxTradesReached && !disabled) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card card-danger p-8"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-red-400">Max Trades Reached</h3>
                        <p className="text-red-300/60 mt-2 max-w-md mx-auto">
                            You&apos;ve reached your daily limit of {maxTradesPerDay} trades.
                            Come back tomorrow with fresh perspective.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Trading locked (P&L limits)
    if (disabled) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card card-danger p-8"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-red-400">Trading Locked</h3>
                        <p className="text-red-300/60 mt-2 max-w-md mx-auto">
                            {disableReason || 'Your daily limits have been triggered. No further trades can be logged until the next session.'}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <>
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                            <Plus className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Log Trade</h3>
                            <p className="text-xs text-zinc-500">
                                {tradesRemaining}/{maxTradesPerDay} trades remaining
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                        {/* Clear Button */}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="btn-secondary py-2 px-3 text-sm flex items-center gap-1.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    </div>
                </div>

                {/* Form Grid - Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    {/* Date Picker */}
                    <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <label className="label">Trade Date</label>
                        </div>
                        <input
                            type="date"
                            value={formData.trade_date}
                            onChange={(e) => setFormData({ ...formData, trade_date: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    {/* Script Name */}
                    <div className="sm:col-span-2 space-y-2">
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

                    {/* P&L */}
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

                {/* Comments Field */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-zinc-500" />
                        <label className="label">Comments (Optional)</label>
                    </div>
                    <input
                        type="text"
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        className="input"
                        placeholder="e.g., Followed my setup, exited too early..."
                    />
                </div>

                {/* Submit */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading || isFormDisabled}
                    className="btn-primary w-full flex items-center justify-center gap-2"
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

            {/* Emotional Checklist Modal */}
            <EmotionalChecklist
                isOpen={showChecklist}
                onClose={() => setShowChecklist(false)}
                onContinue={handleChecklistContinue}
            />
        </>
    );
}
