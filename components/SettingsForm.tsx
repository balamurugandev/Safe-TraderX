'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, CheckCircle2, AlertCircle, Wallet, TrendingDown, TrendingUp, Hash, IndianRupee, Flame } from 'lucide-react';
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
    });

    const [streak, setStreak] = useState(0);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setFormData({
                    starting_capital: data.starting_capital || 0,
                    max_daily_loss_percent: data.max_daily_loss_percent || 2,
                    daily_profit_target_percent: data.daily_profit_target_percent || 5,
                    max_trades_per_day: data.max_trades_per_day || 10,
                    brokerage_per_order: data.brokerage_per_order || 20,
                });
                setStreak(data.current_streak || 0);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
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
                        {/* Capital */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-zinc-500" />
                                <label className="label">Starting Capital (₹)</label>
                            </div>
                            <input
                                type="number"
                                value={formData.starting_capital || ''}
                                onChange={(e) => setFormData({ ...formData, starting_capital: parseFloat(e.target.value) || 0 })}
                                className="input"
                                placeholder="100000"
                                required
                            />
                        </div>

                        {/* Risk Parameters - Row 1 */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Max Loss */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                    <label className="label">Max Loss %</label>
                                </div>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.max_daily_loss_percent || ''}
                                    onChange={(e) => setFormData({ ...formData, max_daily_loss_percent: parseFloat(e.target.value) || 0 })}
                                    className="input input-danger"
                                    placeholder="2.0"
                                    required
                                />
                            </div>

                            {/* Profit Target */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <label className="label">Profit Target %</label>
                                </div>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.daily_profit_target_percent || ''}
                                    onChange={(e) => setFormData({ ...formData, daily_profit_target_percent: parseFloat(e.target.value) || 0 })}
                                    className="input"
                                    placeholder="5.0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Discipline Parameters - Row 2 */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Max Trades */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-blue-400" />
                                    <label className="label">Max Trades/Day</label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.max_trades_per_day || ''}
                                    onChange={(e) => setFormData({ ...formData, max_trades_per_day: parseInt(e.target.value) || 10 })}
                                    className="input"
                                    placeholder="10"
                                    required
                                />
                            </div>

                            {/* Brokerage */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-yellow-400" />
                                    <label className="label">Brokerage/Order (₹)</label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.brokerage_per_order || ''}
                                    onChange={(e) => setFormData({ ...formData, brokerage_per_order: parseFloat(e.target.value) || 20 })}
                                    className="input"
                                    placeholder="20"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={saving}
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
    );
}
