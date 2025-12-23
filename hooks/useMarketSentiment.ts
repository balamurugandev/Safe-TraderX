'use client';

import { useState, useMemo, useCallback } from 'react';
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
    convictionScore: number; // 0-100
    warnings: string[];
    verdictLabel: string;
    convictionLabel: 'High Conviction' | 'Medium Conviction' | 'Low/Avoid';
}

const VIX_LABELS: Record<VIXRange, string> = {
    ultra_low: '9.0 - 10.5 (Ultra-Low)',
    stable: '10.5 - 13.0 (Stable)',
    elevated: '13.0 - 18.0 (Elevated)',
    panic: '18.0+ (Panic)',
};

const OI_LABELS: Record<OIBuildUp, string> = {
    long_buildup: 'Long Build-up',
    short_buildup: 'Short Build-up',
    long_unwinding: 'Long Unwinding',
    short_covering: 'Short Covering',
};

export function useMarketSentiment() {
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

    // Update individual fields
    const updateField = useCallback(<K extends keyof SentimentState>(
        field: K,
        value: SentimentState[K]
    ) => {
        setState(prev => ({ ...prev, [field]: value }));
    }, []);

    // Calculate sentiment result reactively
    const result = useMemo((): SentimentResult => {
        const { cprType, vixRange, oiBuildUp, pcrValue, globalCues } = state;
        const warnings: string[] = [];
        let score = 50; // Start neutral

        // === VERDICT CALCULATION ===
        let verdict: Verdict = 'uncertain';
        let verdictLabel = 'Uncertain';

        // Bullish Case
        if (cprType === 'narrow' && oiBuildUp === 'long_buildup' && globalCues === 'positive') {
            verdict = 'bullish';
            verdictLabel = '🟢 BULLISH - Strong upside momentum expected';
            score += 30;
        }
        // Bearish Case
        else if (cprType === 'narrow' && oiBuildUp === 'short_buildup' && globalCues === 'negative') {
            verdict = 'bearish';
            verdictLabel = '🔴 BEARISH - Strong downside momentum expected';
            score -= 30;
        }
        // Sideways Case
        else if (cprType === 'wide' || vixRange === 'ultra_low' || globalCues === 'neutral') {
            verdict = 'sideways';
            verdictLabel = '🟡 SIDEWAYS - Range-bound action expected';
            score = 50; // Reset to neutral
        }

        // === CONVICTION SCORE MODIFIERS ===

        // CPR impact
        if (cprType === 'narrow') score += 10;

        // VIX impact
        switch (vixRange) {
            case 'ultra_low': score -= 15; break;
            case 'stable': score += 5; break;
            case 'elevated': score += 10; break;
            case 'panic': score -= 10; break;
        }

        // OI Build-up impact
        if (verdict === 'bullish' && (oiBuildUp === 'long_buildup' || oiBuildUp === 'short_covering')) {
            score += 15;
        } else if (verdict === 'bearish' && (oiBuildUp === 'short_buildup' || oiBuildUp === 'long_unwinding')) {
            score += 15;
        }

        // PCR impact
        if (pcrValue >= 0.8 && pcrValue <= 1.2) {
            score += 5; // Balanced PCR
        }

        // Global cues impact
        if (globalCues === 'positive') score += 10;
        if (globalCues === 'negative') score -= 10;

        // === WARNING MESSAGES ===

        // Extreme PCR
        if (pcrValue > 1.3) {
            warnings.push('⚠️ OVERBOUGHT: High risk of reversal/profit booking.');
            score -= 15;
        }
        if (pcrValue < 0.7) {
            warnings.push('⚠️ OVERSOLD: High risk of short covering rally.');
            score -= 10;
        }

        // Low VIX
        if (vixRange === 'ultra_low') {
            warnings.push('⚠️ LOW VOLATILITY: Expect slow moves and heavy theta decay.');
        }

        // Panic VIX
        if (vixRange === 'panic') {
            warnings.push('⚠️ HIGH VIX: Extreme volatility, consider reducing position size.');
        }

        // Divergence Check
        if (oiBuildUp === 'long_buildup' && globalCues === 'negative') {
            warnings.push('⚠️ DIVERGENCE: Domestic strength vs Global weakness. Exercise caution.');
            score -= 10;
        }
        if (oiBuildUp === 'short_buildup' && globalCues === 'positive') {
            warnings.push('⚠️ DIVERGENCE: Domestic weakness vs Global strength. Watch for reversal.');
            score -= 10;
        }

        // Clamp score to 0-100
        score = Math.max(0, Math.min(100, score));

        // Determine conviction label
        let convictionLabel: SentimentResult['convictionLabel'];
        if (score >= 70) {
            convictionLabel = 'High Conviction';
        } else if (score >= 45) {
            convictionLabel = 'Medium Conviction';
        } else {
            convictionLabel = 'Low/Avoid';
        }

        return {
            verdict,
            convictionScore: score,
            warnings,
            verdictLabel,
            convictionLabel,
        };
    }, [state]);

    // Log sentiment to Supabase
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

    return {
        state,
        updateField,
        result,
        logSentiment,
        isLogging,
        lastLogId,
        VIX_LABELS,
        OI_LABELS,
    };
}
