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
                ? 'border-emerald-200 shadow-lg shadow-emerald-100'
                : verdictColor === 'red'
                    ? 'border-red-200 shadow-lg shadow-red-100'
                    : verdictColor === 'yellow'
                        ? 'border-yellow-200 shadow-lg shadow-yellow-100'
                        : ''
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Market Verdict</p>
                    <p className={`text-lg font-bold ${verdictColor === 'emerald' ? 'text-emerald-600'
                        : verdictColor === 'red' ? 'text-red-600'
                            : verdictColor === 'yellow' ? 'text-yellow-600'
                                : 'text-slate-600'
                        }`}>
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
                            <span className="text-xs text-slate-500">
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
                    <p className="text-center text-xs font-mono text-slate-700">{result.convictionScore}%</p>
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
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <p className="text-xs text-amber-700">{warning}</p>
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
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">Market Sentiment Engine</h3>
                    <p className="text-xs text-slate-500">Configure your market read</p>
                </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* CPR Type */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">CPR Type</label>
                    <div className="relative">
                        <select
                            value={state.cprType}
                            onChange={(e) => updateField('cprType', e.target.value as CPRType)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                        >
                            <option value="narrow">Narrow CPR</option>
                            <option value="wide">Wide CPR</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* VIX Range */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">India VIX</label>
                    <div className="relative">
                        <select
                            value={state.vixRange}
                            onChange={(e) => updateField('vixRange', e.target.value as VIXRange)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                        >
                            {Object.entries(VIX_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* OI Build-up */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">OI Build-up</label>
                    <div className="relative">
                        <select
                            value={state.oiBuildUp}
                            onChange={(e) => updateField('oiBuildUp', e.target.value as OIBuildUp)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                        >
                            {Object.entries(OI_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* PCR Value */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">PCR (Put-Call Ratio)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.6"
                        value={state.pcrValue}
                        onChange={(e) => updateField('pcrValue', parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                </div>

                {/* Support Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Nifty Support</label>
                    <input
                        type="text"
                        placeholder="e.g., 23800"
                        value={state.supportLevel}
                        onChange={(e) => updateField('supportLevel', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                </div>

                {/* Resistance Level */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Nifty Resistance</label>
                    <input
                        type="text"
                        placeholder="e.g., 24200"
                        value={state.resistanceLevel}
                        onChange={(e) => updateField('resistanceLevel', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Global Cues Toggle */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Global Cues</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['positive', 'neutral', 'negative'] as GlobalCues[]).map((cue) => (
                        <button
                            key={cue}
                            onClick={() => updateField('globalCues', cue)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${state.globalCues === cue
                                ? cue === 'positive'
                                    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                    : cue === 'negative'
                                        ? 'bg-red-100 text-red-700 shadow-sm'
                                        : 'bg-yellow-100 text-yellow-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-200"
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
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg"
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
