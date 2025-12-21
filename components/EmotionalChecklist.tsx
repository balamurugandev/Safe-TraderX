'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Circle, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface EmotionalChecklistProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

const CHECKLIST_ITEMS = [
    {
        id: 'high-probability',
        text: 'Is this a high-probability setup from my trading plan?',
        warning: false
    },
    {
        id: 'fomo',
        text: 'Am I chasing a candle or feeling FOMO?',
        warning: true // This should be UNCHECKED for good trading
    },
    {
        id: 'revenge',
        text: 'Am I trading to recover a previous loss (Revenge)?',
        warning: true // This should be UNCHECKED for good trading
    }
];

const MIN_WAIT_SECONDS = 3;

export default function EmotionalChecklist({ isOpen, onClose, onContinue }: EmotionalChecklistProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [waitTime, setWaitTime] = useState(MIN_WAIT_SECONDS);
    const [canProceed, setCanProceed] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setChecked({});
            setWaitTime(MIN_WAIT_SECONDS);
            setCanProceed(false);
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || waitTime <= 0) return;

        const timer = setInterval(() => {
            setWaitTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, waitTime]);

    // Check if can proceed
    useEffect(() => {
        const allRequiredChecked =
            checked['high-probability'] === true && // Must be checked
            checked['fomo'] === false && // Must be unchecked (not FOMO)
            checked['revenge'] === false; // Must be unchecked (not revenge)

        // Alternative: just require first one checked and user acknowledged the others
        const acknowledgedAll = Object.keys(checked).length === 3;

        setCanProceed(waitTime === 0 && acknowledgedAll && checked['high-probability'] === true);
    }, [checked, waitTime]);

    const handleCheck = (id: string) => {
        setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleContinue = () => {
        // Warn if FOMO or Revenge is checked
        if (checked['fomo'] || checked['revenge']) {
            const proceed = confirm(
                '⚠️ You indicated FOMO or Revenge trading!\n\n' +
                'Are you SURE you want to proceed? This is a high-risk emotional state.'
            );
            if (!proceed) return;
        }
        onContinue();
    };

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
                                        <h2 className="text-xl font-bold text-white">Pre-Flight Checklist</h2>
                                        <p className="text-sm text-zinc-500">Emotional state verification</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            {/* Countdown */}
                            {waitTime > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                        <span className="text-yellow-400 font-mono text-sm">
                                            Take a breath... {waitTime}s
                                        </span>
                                    </div>
                                </motion.div>
                            )}

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
                                                ? item.warning
                                                    ? 'bg-red-500/10 border-red-500/30'
                                                    : 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {checked[item.id] ? (
                                                <CheckCircle className={`w-5 h-5 ${item.warning ? 'text-red-400' : 'text-emerald-400'}`} />
                                            ) : (
                                                <Circle className="w-5 h-5 text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.text}</p>
                                            {item.warning && checked[item.id] && (
                                                <p className="text-red-400/80 text-xs mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Warning: Trading in emotional state
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary flex-1 justify-center"
                                >
                                    Step Away
                                </button>
                                <motion.button
                                    type="button"
                                    onClick={handleContinue}
                                    disabled={!canProceed}
                                    whileHover={canProceed ? { scale: 1.02 } : {}}
                                    whileTap={canProceed ? { scale: 0.98 } : {}}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${canProceed
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                                        }`}
                                >
                                    Continue to Entry
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Helper Text */}
                            <p className="text-center text-xs text-zinc-600">
                                {!canProceed && waitTime === 0 && 'Confirm the first item and acknowledge the others to proceed'}
                                {waitTime > 0 && 'Please wait and reflect before proceeding'}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
