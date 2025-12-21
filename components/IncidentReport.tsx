'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, FileText, Send, X } from 'lucide-react';

interface IncidentReportProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (report: string) => void;
    triggerReason: string;
}

const MIN_WORDS = 100;

export default function IncidentReport({ isOpen, onClose, onSubmit, triggerReason }: IncidentReportProps) {
    const [report, setReport] = useState('');
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setReport('');
            setWordCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const words = report.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    }, [report]);

    const canSubmit = wordCount >= MIN_WORDS;

    const handleSubmit = () => {
        if (canSubmit) {
            onSubmit(report);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.95)' }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl"
                    >
                        <div className="card p-8 space-y-6 border-red-500/30">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                        <AlertTriangle className="w-7 h-7 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-red-400">Rule Breaker Detected</h2>
                                        <p className="text-sm text-red-300/60">Penalty Mode Activated</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            {/* Trigger Reason */}
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-300 text-sm">
                                    <strong>Violation:</strong> {triggerReason}
                                </p>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-zinc-500" />
                                    <p className="text-sm text-zinc-400">
                                        Write an <strong>Incident Report</strong> explaining why you lacked discipline.
                                        This forces you to confront the irrationality of your decision.
                                    </p>
                                </div>
                            </div>

                            {/* Report Textarea */}
                            <div className="space-y-2">
                                <textarea
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                    className="input w-full h-48 resize-none"
                                    placeholder="I broke my trading rules because...

Think about:
- What emotion was driving this decision?
- Was this a rational choice or impulse?
- What will I do differently next time?"
                                />
                                <div className="flex items-center justify-between text-sm">
                                    <span className={`font-mono ${wordCount >= MIN_WORDS ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                        {wordCount} / {MIN_WORDS} words minimum
                                    </span>
                                    {wordCount < MIN_WORDS && (
                                        <span className="text-zinc-600">
                                            {MIN_WORDS - wordCount} more words needed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                                <motion.div
                                    className={`h-full ${wordCount >= MIN_WORDS ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((wordCount / MIN_WORDS) * 100, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                whileHover={canSubmit ? { scale: 1.02 } : {}}
                                whileTap={canSubmit ? { scale: 0.98 } : {}}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${canSubmit
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                Submit Incident Report
                            </motion.button>

                            <p className="text-center text-xs text-zinc-600">
                                Your streak will be reset. This report will be saved for future reflection.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
