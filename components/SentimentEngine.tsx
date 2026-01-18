'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Save,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { useSentimentContext, VIX_LABELS, OI_LABELS, CPRType, VIXRange, OIBuildUp, GlobalCues } from '@/hooks/useMarketSentiment';

// Compact Verdict Card - For top of dashboard
export function SentimentVerdictCard() {
    const { result, state } = useSentimentContext();

    const getVerdictColor = () => {
        switch (result.verdict) {
            case 'bullish': return 'emerald';
            case 'bearish': return 'red';
            case 'sideways': return 'yellow';
            default: return 'slate';
        }
    };

    const verdictColor = getVerdictColor();
    const gaugeRotation = -90 + (result.convictionScore / 100) * 180;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-4 ${verdictColor === 'emerald'
                ? 'border-emerald-500/30 dark:border-emerald-400/30'
                : verdictColor === 'red'
                    ? 'border-red-500/30 dark:border-red-400/30'
                    : verdictColor === 'yellow'
                        ? 'border-yellow-500/30 dark:border-yellow-400/30'
                        : ''
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Market Verdict</p>
                    <p className={`text-lg font-bold ${verdictColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
                        : verdictColor === 'red' ? 'text-red-600 dark:text-red-400'
                            : verdictColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400'
                                : ''
                        }`} style={{ color: verdictColor === 'emerald' ? undefined : verdictColor === 'red' ? undefined : verdictColor === 'yellow' ? undefined : 'var(--text-secondary)' }}>
                        {result.verdictLabel}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.convictionLabel === 'High Conviction'
                            ? 'bg-emerald-100 text-emerald-700'
                            : result.convictionLabel === 'Medium Conviction'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {result.convictionLabel === 'High Conviction' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                            {result.convictionLabel === 'Low/Avoid' && <XCircle className="w-3 h-3 inline mr-1" />}
                            {result.convictionLabel}
                        </span>
                        {state.supportLevel && state.resistanceLevel && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Range: {state.supportLevel} - {state.resistanceLevel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sentiment Gauge */}
                <div className="relative w-20 h-12">
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                        <path d="M 10 55 A 40 40 0 0 1 30 20" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
                        <path d="M 30 20 A 40 40 0 0 1 70 20" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
                        <path d="M 70 20 A 40 40 0 0 1 90 55" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
                        <g transform={`rotate(${gaugeRotation}, 50, 55)`}>
                            <line x1="50" y1="55" x2="50" y2="22" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="55" r="4" fill="#1E293B" />
                        </g>
                    </svg>
                    <p className="text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{result.convictionScore}%</p>
                </div>
            </div>

            {/* Warnings */}
            <AnimatePresence>
                {result.warnings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                    >
                        {result.warnings.map((warning, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Full Input Form - For bottom of dashboard
export function SentimentInputForm() {
    const { state, updateField, logSentiment, isLogging } = useSentimentContext();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleLogSentiment = async () => {
        const logId = await logSentiment();
        if (logId) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Market Sentiment Engine</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Configure your market read</p>
                </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* CPR Type */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>CPR Type</label>
                    <div className="relative">
                        <select
                            value={state.cprType}
                            onChange={(e) => updateField('cprType', e.target.value as CPRType)}
                            className="input appearance-none cursor-pointer"
                        >
                            <option value="narrow">Narrow CPR</option>
                            <option value="wide">Wide CPR</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>

                {/* VIX Range */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>India VIX</label>
                    <div className="relative">
                        <select
                            value={state.vixRange}
                            onChange={(e) => updateField('vixRange', e.target.value as VIXRange)}
                            className="input appearance-none cursor-pointer"
                        >
                            {Object.entries(VIX_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>

                {/* OI Build-up */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>OI Build-up</label>
                    <div className="relative">
                        <select
                            value={state.oiBuildUp}
                            onChange={(e) => updateField('oiBuildUp', e.target.value as OIBuildUp)}
                            className="input appearance-none cursor-pointer"
                        >
                            {Object.entries(OI_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>

                {/* PCR Value */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>PCR (Put-Call Ratio)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.6"
                        value={state.pcrValue}
                        onChange={(e) => updateField('pcrValue', parseFloat(e.target.value) || 1.0)}
                        className="input font-mono"
                    />
                </div>

                {/* Support Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nifty Support</label>
                    <input
                        type="text"
                        placeholder="e.g., 23800"
                        value={state.supportLevel}
                        onChange={(e) => updateField('supportLevel', e.target.value)}
                        className="input font-mono"
                    />
                </div>

                {/* Resistance Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nifty Resistance</label>
                    <input
                        type="text"
                        placeholder="e.g., 24200"
                        value={state.resistanceLevel}
                        onChange={(e) => updateField('resistanceLevel', e.target.value)}
                        className="input font-mono"
                    />
                </div>
            </div>

            {/* Global Cues Toggle */}
            <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Global Cues</label>
                <div className="flex p-1 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    {(['positive', 'neutral', 'negative'] as GlobalCues[]).map((cue) => (
                        <button
                            key={cue}
                            onClick={() => updateField('globalCues', cue)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${state.globalCues === cue
                                ? cue === 'positive'
                                    ? 'bg-emerald-500/20 text-emerald-500 shadow-sm'
                                    : cue === 'negative'
                                        ? 'bg-red-500/20 text-red-500 shadow-sm'
                                        : 'bg-yellow-500/20 text-yellow-500 shadow-sm'
                                : ''
                                }`}
                            style={state.globalCues !== cue ? { color: 'var(--text-muted)' } : undefined}
                        >
                            {cue === 'positive' && <TrendingUp className="w-4 h-4" />}
                            {cue === 'neutral' && <Minus className="w-4 h-4" />}
                            {cue === 'negative' && <TrendingDown className="w-4 h-4" />}
                            {cue.charAt(0).toUpperCase() + cue.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleLogSentiment}
                    disabled={isLogging}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/30"
                >
                    {isLogging ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Logging...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Log This Sentiment
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-500 rounded-lg"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Logged!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// Legacy default export for backwards compatibility (full component)
export default function SentimentEngine() {
    return (
        <div className="space-y-6">
            <SentimentVerdictCard />
            <SentimentInputForm />
        </div>
    );
}
