'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, CheckCircle2, AlertCircle, Wallet, TrendingDown, TrendingUp, Hash, IndianRupee, Flame, Package, Edit2, Plus, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        starting_capital: 0,
        max_daily_loss_percent: 2,
        daily_profit_target_percent: 5,
        max_trades_per_day: 10,
        brokerage_per_order: 20,
        max_lot_size: 50,
        lot_value: 50,
    });

    const [streak, setStreak] = useState(0);
    const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
    const [initialData, setInitialData] = useState<any>(null);

    // Capital Management State
    const [showCapitalModal, setShowCapitalModal] = useState(false);
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
    const [transactionAmount, setTransactionAmount] = useState('');

    // Deep compare check for dirty state
    const isDirty = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);

    const toggleEdit = (field: string) => {
        setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const openTransactionModal = (type: 'deposit' | 'withdraw') => {
        setTransactionType(type);
        setTransactionAmount('');
        setShowCapitalModal(true);
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transactionAmount);
        if (!amount || amount <= 0) return;

        // Transaction Logic: Insert into daily_trades
        try {
            const { error } = await supabase
                .from('daily_trades')
                .insert({
                    trade_date: new Date().toISOString().split('T')[0], // Today
                    trade_name: transactionType === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
                    pnl_amount: transactionType === 'deposit' ? amount : -amount,
                    comments: 'CAPITAL_ADJUSTMENT',
                    // Optional fields depending on schema, keeping minimal for robustness
                });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: `${transactionType === 'deposit' ? 'Deposited' : 'Withdrew'} ₹${amount.toLocaleString('en-IN')}. Recorded in History.`
            });
            setShowCapitalModal(false);
            // We do NOT update updated_at here as it's a separate table

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const [netAdjustments, setNetAdjustments] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            // 1. Fetch Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('settings')
                .select('*')
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

            if (settingsData) {
                const fetchedData = {
                    starting_capital: settingsData.starting_capital || 0,
                    max_daily_loss_percent: settingsData.max_daily_loss_percent || 2,
                    daily_profit_target_percent: settingsData.daily_profit_target_percent || 5,
                    max_trades_per_day: settingsData.max_trades_per_day || 10,
                    brokerage_per_order: settingsData.brokerage_per_order || 20,
                    max_lot_size: settingsData.max_lot_size || 50,
                    lot_value: settingsData.lot_value || 50,
                };
                setFormData(fetchedData);
                setInitialData(fetchedData);
                setStreak(settingsData.current_streak || 0);
            }

            // 2. Fetch Capital Adjustments
            const { data: adjustments } = await supabase
                .from('daily_trades')
                .select('pnl_amount')
                .or('comments.eq.CAPITAL_ADJUSTMENT,trade_name.eq.DEPOSIT,trade_name.eq.WITHDRAWAL');

            if (adjustments) {
                const total = adjustments.reduce((sum, t) => sum + t.pnl_amount, 0);
                setNetAdjustments(total);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { data: existing } = await supabase
                .from('settings')
                .select('id')
                .single();

            let error;
            if (existing) {
                ({ error } = await supabase
                    .from('settings')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id));
            } else {
                ({ error } = await supabase
                    .from('settings')
                    .insert({
                        ...formData,
                        current_streak: 0,
                        updated_at: new Date().toISOString(),
                    }));
            }

            if (error) throw error;
            setMessage({ type: 'success', text: 'Configuration saved successfully' });

            // Reset dirty state
            setInitialData({ ...formData });
            setEditingFields({});

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-xl mx-auto pt-20">
                <div className="card p-12 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto pt-20"
            >
                <div className="card-glow p-8 relative">
                    <div className="relative z-10 space-y-8">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
                                    <Save className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Trading Parameters</h2>
                                    <p className="text-sm text-zinc-500 mt-1">Configure your risk management protocol</p>
                                </div>
                            </div>

                            {/* Streak Badge */}
                            {streak > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                    <span className="text-orange-400 font-bold">{streak}</span>
                                    <span className="text-orange-400/70 text-xs">day streak</span>
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`rounded-xl p-4 flex items-center gap-3 ${message.type === 'success'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                                        : 'bg-red-500/10 border border-red-500/20'
                                        }`}
                                >
                                    {message.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    )}
                                    <span className={message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}>
                                        {message.text}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            {/* Capital Breakdown */}
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Capital Structure</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Initial Base</span>
                                        <span className="text-zinc-300">₹{formData.starting_capital.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Deposits / Withdrawals</span>
                                        <span className={`${netAdjustments >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {netAdjustments >= 0 ? '+' : ''}₹{netAdjustments.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                                        <span className="text-zinc-300">Effective Capital</span>
                                        <span className="text-white text-lg">
                                            ₹{(formData.starting_capital + netAdjustments).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Capital Input (Base) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-zinc-500" />
                                    <label className="label">Base Capital Config (₹)</label>
                                    <button type="button" onClick={() => toggleEdit('starting_capital')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        disabled={!editingFields['starting_capital']}
                                        value={formData.starting_capital || ''}
                                        onChange={(e) => setFormData({ ...formData, starting_capital: parseFloat(e.target.value) || 0 })}
                                        className={`input flex-1 ${!editingFields['starting_capital'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="100000"
                                        required
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openTransactionModal('deposit')}
                                            className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                            title="Deposit Funds"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openTransactionModal('withdraw')}
                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                            title="Withdraw Funds"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Parameters - Row 1 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Max Loss */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                        <label className="label">Max Loss %</label>
                                        <button type="button" onClick={() => toggleEdit('max_daily_loss_percent')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        disabled={!editingFields['max_daily_loss_percent']}
                                        value={formData.max_daily_loss_percent || ''}
                                        onChange={(e) => setFormData({ ...formData, max_daily_loss_percent: parseFloat(e.target.value) || 0 })}
                                        className={`input input-danger ${!editingFields['max_daily_loss_percent'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="2.0"
                                        required
                                    />
                                    {formData.max_daily_loss_percent > 5 && (
                                        <p className="text-xs text-yellow-400">
                                            ⚠️ Higher than recommended (2-3%)
                                        </p>
                                    )}
                                </div>

                                {/* Profit Target */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        <label className="label">Profit Target %</label>
                                        <button type="button" onClick={() => toggleEdit('daily_profit_target_percent')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        disabled={!editingFields['daily_profit_target_percent']}
                                        value={formData.daily_profit_target_percent || ''}
                                        onChange={(e) => setFormData({ ...formData, daily_profit_target_percent: parseFloat(e.target.value) || 0 })}
                                        className={`input ${!editingFields['daily_profit_target_percent'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="5.0"
                                        required
                                    />
                                    {formData.daily_profit_target_percent > 10 && (
                                        <p className="text-xs text-yellow-400">
                                            ⚠️ Unrealistic target can trigger greed. Pros aim for 2-5%
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Discipline Parameters - Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Max Trades */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-blue-400" />
                                        <label className="label">Max Trades/Day</label>
                                        <button type="button" onClick={() => toggleEdit('max_trades_per_day')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        disabled={!editingFields['max_trades_per_day']}
                                        value={formData.max_trades_per_day || ''}
                                        onChange={(e) => setFormData({ ...formData, max_trades_per_day: parseInt(e.target.value) || 10 })}
                                        className={`input ${!editingFields['max_trades_per_day'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="10"
                                        required
                                    />
                                </div>

                                {/* Brokerage */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-yellow-400" />
                                        <label className="label">Brokerage/Order (₹)</label>
                                        <button type="button" onClick={() => toggleEdit('brokerage_per_order')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        disabled={!editingFields['brokerage_per_order']}
                                        value={formData.brokerage_per_order || ''}
                                        onChange={(e) => setFormData({ ...formData, brokerage_per_order: parseFloat(e.target.value) || 20 })}
                                        className={`input ${!editingFields['brokerage_per_order'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Lot Sizing - Row 3 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Max Lot Size */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-orange-400" />
                                        <label className="label">Max Lots/Trade</label>
                                        <button type="button" onClick={() => toggleEdit('max_lot_size')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        disabled={!editingFields['max_lot_size']}
                                        value={formData.max_lot_size || ''}
                                        onChange={(e) => setFormData({ ...formData, max_lot_size: parseInt(e.target.value) || 50 })}
                                        className={`input ${!editingFields['max_lot_size'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="50"
                                        required
                                    />
                                    <p className="text-[10px] text-zinc-600">Max position size per trade</p>
                                </div>

                                {/* Lot Value */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-orange-400" />
                                        <label className="label">Point Value (₹)</label>
                                        <button type="button" onClick={() => toggleEdit('lot_value')} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        disabled={!editingFields['lot_value']}
                                        value={formData.lot_value || ''}
                                        onChange={(e) => setFormData({ ...formData, lot_value: parseFloat(e.target.value) || 50 })}
                                        className={`input ${!editingFields['lot_value'] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="50"
                                        required
                                    />
                                    <p className="text-[10px] text-zinc-600">1 lot × 1 point (Nifty = ₹50)</p>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={saving || !isDirty}
                            className="btn-primary w-full text-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                'Save Configuration'
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.form>

            {/* Capital Transaction Modal */}
            <AnimatePresence>
                {showCapitalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">
                                    {transactionType === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}
                                </h3>
                                <button
                                    onClick={() => setShowCapitalModal(false)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleTransaction} className="space-y-4">
                                <div>
                                    <label className="label mb-2 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={transactionAmount}
                                        onChange={(e) => setTransactionAmount(e.target.value)}
                                        className="input text-lg"
                                        placeholder="e.g. 20000"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${transactionType === 'deposit'
                                            ? 'bg-emerald-600 hover:bg-emerald-500'
                                            : 'bg-red-600 hover:bg-red-500'
                                            }`}
                                    >
                                        {transactionType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
