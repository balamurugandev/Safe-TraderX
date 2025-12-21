'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Circle, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface EmotionalChecklistProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: (flags: { wasFomo: boolean; wasRevenge: boolean; wasHighProbability: boolean }) => void;
}

const CHECKLIST_ITEMS = [
    {
        id: 'high-probability',
        text: 'Was this a high-probability setup from my trading plan?',
        type: 'positive' as const
    },
    {
        id: 'fomo',
        text: 'Did I chase this trade or feel FOMO?',
        type: 'warning' as const
    },
    {
        id: 'revenge',
        text: 'Was this a revenge trade to recover losses?',
        type: 'warning' as const
    }
];

export default function EmotionalChecklist({ isOpen, onClose, onContinue }: EmotionalChecklistProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setChecked({});
        }
    }, [isOpen]);

    const handleCheck = (id: string) => {
        setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleContinue = () => {
        onContinue({
            wasFomo: checked['fomo'] || false,
            wasRevenge: checked['revenge'] || false,
            wasHighProbability: checked['high-probability'] || false
        });
    };

    const hasWarnings = checked['fomo'] || checked['revenge'];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.9)' }}
                >
                    <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg"
                    >
                        <div className="card p-8 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/20">
                                        <Brain className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Trade Reflection</h2>
                                        <p className="text-sm text-zinc-500">Honest self-assessment</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            {/* Instructions */}
                            <p className="text-sm text-zinc-400 text-center">
                                Be honest with yourself. Check any that apply to this trade.
                            </p>

                            {/* Checklist */}
                            <div className="space-y-3">
                                {CHECKLIST_ITEMS.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleCheck(item.id)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3 ${checked[item.id]
                                            ? item.type === 'warning'
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {checked[item.id] ? (
                                                <CheckCircle className={`w-5 h-5 ${item.type === 'warning' ? 'text-red-400' : 'text-emerald-400'}`} />
                                            ) : (
                                                <Circle className="w-5 h-5 text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.text}</p>
                                            {item.type === 'warning' && checked[item.id] && (
                                                <p className="text-red-400/80 text-xs mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    This will trigger a warning reminder
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Warning Preview */}
                            {hasWarnings && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-red-400 font-medium">A warning will be shown</p>
                                            <p className="text-red-400/70 text-xs mt-1">
                                                You'll see a reminder before your next trade to avoid repeating this pattern.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="button"
                                    onClick={handleContinue}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                >
                                    Log Trade
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
