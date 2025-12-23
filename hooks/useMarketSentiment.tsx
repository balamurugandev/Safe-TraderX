'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Types
export type CPRType = 'narrow' | 'wide';
export type VIXRange = 'ultra_low' | 'stable' | 'elevated' | 'panic';
export type OIBuildUp = 'long_buildup' | 'short_buildup' | 'long_unwinding' | 'short_covering';
export type GlobalCues = 'positive' | 'neutral' | 'negative';
export type Verdict = 'bullish' | 'bearish' | 'sideways' | 'uncertain';

export interface SentimentState {
    cprType: CPRType;
    vixRange: VIXRange;
    oiBuildUp: OIBuildUp;
    pcrValue: number;
    globalCues: GlobalCues;
    supportLevel: string;
    resistanceLevel: string;
}

export interface SentimentResult {
    verdict: Verdict;
    convictionScore: number;
    warnings: string[];
    verdictLabel: string;
    convictionLabel: 'High Conviction' | 'Medium Conviction' | 'Low/Avoid';
}

export const VIX_LABELS: Record<VIXRange, string> = {
    ultra_low: '9.0 - 10.5 (Ultra-Low)',
    stable: '10.5 - 13.0 (Stable)',
    elevated: '13.0 - 18.0 (Elevated)',
    panic: '18.0+ (Panic)',
};

export const OI_LABELS: Record<OIBuildUp, string> = {
    long_buildup: 'Long Build-up',
    short_buildup: 'Short Build-up',
    long_unwinding: 'Long Unwinding',
    short_covering: 'Short Covering',
};

interface SentimentContextValue {
    state: SentimentState;
    updateField: <K extends keyof SentimentState>(field: K, value: SentimentState[K]) => void;
    result: SentimentResult;
    logSentiment: () => Promise<string | null>;
    isLogging: boolean;
    lastLogId: string | null;
}

const SentimentContext = createContext<SentimentContextValue | null>(null);

export function useSentimentContext() {
    const context = useContext(SentimentContext);
    if (!context) {
        throw new Error('useSentimentContext must be used within SentimentProvider');
    }
    return context;
}

export function SentimentProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SentimentState>({
        cprType: 'narrow',
        vixRange: 'stable',
        oiBuildUp: 'long_buildup',
        pcrValue: 1.0,
        globalCues: 'neutral',
        supportLevel: '',
        resistanceLevel: '',
    });

    const [isLogging, setIsLogging] = useState(false);
    const [lastLogId, setLastLogId] = useState<string | null>(null);

    const updateField = useCallback(<K extends keyof SentimentState>(
        field: K,
        value: SentimentState[K]
    ) => {
        setState(prev => ({ ...prev, [field]: value }));
    }, []);

    const result = useMemo((): SentimentResult => {
        const { cprType, vixRange, oiBuildUp, pcrValue, globalCues } = state;
        const warnings: string[] = [];
        let score = 50;

        let verdict: Verdict = 'uncertain';
        let verdictLabel = 'Uncertain';

        if (cprType === 'narrow' && oiBuildUp === 'long_buildup' && globalCues === 'positive') {
            verdict = 'bullish';
            verdictLabel = '🟢 BULLISH - Strong upside momentum expected';
            score += 30;
        } else if (cprType === 'narrow' && oiBuildUp === 'short_buildup' && globalCues === 'negative') {
            verdict = 'bearish';
            verdictLabel = '🔴 BEARISH - Strong downside momentum expected';
            score -= 30;
        } else if (cprType === 'wide' || vixRange === 'ultra_low' || globalCues === 'neutral') {
            verdict = 'sideways';
            verdictLabel = '🟡 SIDEWAYS - Range-bound action expected';
            score = 50;
        }

        if (cprType === 'narrow') score += 10;

        switch (vixRange) {
            case 'ultra_low': score -= 15; break;
            case 'stable': score += 5; break;
            case 'elevated': score += 10; break;
            case 'panic': score -= 10; break;
        }

        if (verdict === 'bullish' && (oiBuildUp === 'long_buildup' || oiBuildUp === 'short_covering')) {
            score += 15;
        } else if (verdict === 'bearish' && (oiBuildUp === 'short_buildup' || oiBuildUp === 'long_unwinding')) {
            score += 15;
        }

        if (pcrValue >= 0.8 && pcrValue <= 1.2) score += 5;
        if (globalCues === 'positive') score += 10;
        if (globalCues === 'negative') score -= 10;

        if (pcrValue > 1.3) {
            warnings.push('⚠️ OVERBOUGHT: High risk of reversal/profit booking.');
            score -= 15;
        }
        if (pcrValue < 0.7) {
            warnings.push('⚠️ OVERSOLD: High risk of short covering rally.');
            score -= 10;
        }
        if (vixRange === 'ultra_low') {
            warnings.push('⚠️ LOW VOLATILITY: Expect slow moves and heavy theta decay.');
        }
        if (vixRange === 'panic') {
            warnings.push('⚠️ HIGH VIX: Extreme volatility, consider reducing position size.');
        }
        if (oiBuildUp === 'long_buildup' && globalCues === 'negative') {
            warnings.push('⚠️ DIVERGENCE: Domestic strength vs Global weakness. Exercise caution.');
            score -= 10;
        }
        if (oiBuildUp === 'short_buildup' && globalCues === 'positive') {
            warnings.push('⚠️ DIVERGENCE: Domestic weakness vs Global strength. Watch for reversal.');
            score -= 10;
        }

        score = Math.max(0, Math.min(100, score));

        let convictionLabel: SentimentResult['convictionLabel'];
        if (score >= 70) convictionLabel = 'High Conviction';
        else if (score >= 45) convictionLabel = 'Medium Conviction';
        else convictionLabel = 'Low/Avoid';

        return { verdict, convictionScore: score, warnings, verdictLabel, convictionLabel };
    }, [state]);

    const logSentiment = useCallback(async (): Promise<string | null> => {
        setIsLogging(true);
        try {
            const { data, error } = await supabase
                .from('sentiment_logs')
                .insert({
                    cpr_type: state.cprType,
                    vix_range: state.vixRange,
                    oi_build_up: state.oiBuildUp,
                    pcr_value: state.pcrValue,
                    global_cues: state.globalCues,
                    support_level: state.supportLevel || null,
                    resistance_level: state.resistanceLevel || null,
                    final_verdict: result.verdict,
                    conviction_score: result.convictionScore,
                    warnings: result.warnings,
                })
                .select('id')
                .single();

            if (error) throw error;
            const logId = data?.id || null;
            setLastLogId(logId);
            return logId;
        } catch (error) {
            console.error('Error logging sentiment:', error);
            return null;
        } finally {
            setIsLogging(false);
        }
    }, [state, result]);

    const contextValue: SentimentContextValue = {
        state,
        updateField,
        result,
        logSentiment,
        isLogging,
        lastLogId,
    };

    return (
        <SentimentContext.Provider value= { contextValue } >
        { children }
        </SentimentContext.Provider>
    );
}
