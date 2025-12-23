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
            default: return 'zinc';
        }
    };

    const verdictColor = getVerdictColor();
    const gaugeRotation = -90 + (result.convictionScore / 100) * 180;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-4 ${verdictColor === 'emerald'
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : verdictColor === 'red'
                        ? 'border-red-500/30 shadow-lg shadow-red-500/10'
                        : verdictColor === 'yellow'
                            ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                            : ''
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Market Verdict</p>
                    <p className={`text-lg font-bold ${verdictColor === 'emerald' ? 'text-emerald-400'
                            : verdictColor === 'red' ? 'text-red-400'
                                : verdictColor === 'yellow' ? 'text-yellow-400'
                                    : 'text-zinc-400'
                        }`}>
                        {result.verdictLabel}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.convictionLabel === 'High Conviction'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : result.convictionLabel === 'Medium Conviction'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                            {result.convictionLabel === 'High Conviction' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                            {result.convictionLabel === 'Low/Avoid' && <XCircle className="w-3 h-3 inline mr-1" />}
                            {result.convictionLabel}
                        </span>
                        {state.supportLevel && state.resistanceLevel && (
                            <span className="text-xs text-zinc-500">
                                Range: {state.supportLevel} - {state.resistanceLevel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sentiment Gauge */}
                <div className="relative w-20 h-12">
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
                        <path d="M 10 55 A 40 40 0 0 1 30 20" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                        <path d="M 30 20 A 40 40 0 0 1 70 20" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                        <path d="M 70 20 A 40 40 0 0 1 90 55" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                        <g transform={`rotate(${gaugeRotation}, 50, 55)`}>
                            <line x1="50" y1="55" x2="50" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="55" r="4" fill="white" />
                        </g>
                    </svg>
                    <p className="text-center text-xs font-mono text-white">{result.convictionScore}%</p>
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
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-amber-300">{warning}</p>
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
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Market Sentiment Engine</h3>
                    <p className="text-xs text-zinc-400">Configure your market read</p>
                </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* CPR Type */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">CPR Type</label>
                    <div className="relative">
                        <select
                            value={state.cprType}
                            onChange={(e) => updateField('cprType', e.target.value as CPRType)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="narrow">Narrow CPR</option>
                            <option value="wide">Wide CPR</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* VIX Range */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">India VIX</label>
                    <div className="relative">
                        <select
                            value={state.vixRange}
                            onChange={(e) => updateField('vixRange', e.target.value as VIXRange)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/50"
                        >
                            {Object.entries(VIX_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* OI Build-up */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">OI Build-up</label>
                    <div className="relative">
                        <select
                            value={state.oiBuildUp}
                            onChange={(e) => updateField('oiBuildUp', e.target.value as OIBuildUp)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/50"
                        >
                            {Object.entries(OI_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* PCR Value */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">PCR (Put-Call Ratio)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.6"
                        value={state.pcrValue}
                        onChange={(e) => updateField('pcrValue', parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                {/* Support Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Nifty Support</label>
                    <input
                        type="text"
                        placeholder="e.g., 23800"
                        value={state.supportLevel}
                        onChange={(e) => updateField('supportLevel', e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                {/* Resistance Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Nifty Resistance</label>
                    <input
                        type="text"
                        placeholder="e.g., 24200"
                        value={state.resistanceLevel}
                        onChange={(e) => updateField('resistanceLevel', e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
            </div>

            {/* Global Cues Toggle */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400">Global Cues</label>
                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/10">
                    {(['positive', 'neutral', 'negative'] as GlobalCues[]).map((cue) => (
                        <button
                            key={cue}
                            onClick={() => updateField('globalCues', cue)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${state.globalCues === cue
                                    ? cue === 'positive'
                                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                                        : cue === 'negative'
                                            ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-xl transition-all"
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
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg"
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
