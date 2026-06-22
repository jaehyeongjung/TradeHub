"use client";

import { useState, useCallback, useRef } from "react";
import type { KlineRow, Interval } from "@/shared/types/binance.types";
import type { Locale } from "@/shared/types/locale.types";
import type { AnalysisResult, Candle } from "@/shared/lib/technical-analysis/types";
import { detectPivots } from "@/shared/lib/technical-analysis/pivot";
import { detectTrendLines } from "@/shared/lib/technical-analysis/trendline";
import { detectSRLevels } from "@/shared/lib/technical-analysis/support-resistance";
import { calculateFibonacci } from "@/shared/lib/technical-analysis/fibonacci";
import { generateSignal } from "@/shared/lib/technical-analysis/signal";
import { generateTrendLineSetups } from "@/shared/lib/technical-analysis/trendline-setup";
import { analyzeMarketStructure } from "@/shared/lib/technical-analysis/market-structure";
import { detectCandlestickPatterns } from "@/shared/lib/technical-analysis/candlestick-patterns";
import { getBinanceRestBase } from "@/shared/lib/binance";

const FETCH_TOTAL: Partial<Record<Interval, number>> = {
    "15m": 2000,
    "1h":  2000,
    "4h":  1000,
    "1d":  500,
    "1w":  200,
};
const MAX_PER_PAGE = 1000;

function parseKlines(rows: KlineRow[]): Candle[] {
    return rows.map(r => ({
        time:   r[0],
        open:   parseFloat(r[1] as string),
        high:   parseFloat(r[2] as string),
        low:    parseFloat(r[3] as string),
        close:  parseFloat(r[4] as string),
        volume: parseFloat(r[5] as string),
    }));
}

async function fetchKlines(symbol: string, interval: Interval): Promise<Candle[]> {
    const total = FETCH_TOTAL[interval] ?? 500;

    if (total <= MAX_PER_PAGE) {
        const res = await fetch(
            `${getBinanceRestBase(symbol)}/klines?symbol=${symbol}&interval=${interval}&limit=${total}`
        );
        if (!res.ok) throw new Error("klines fetch failed");
        return parseKlines(await res.json() as KlineRow[]);
    }

    const pages   = Math.ceil(total / MAX_PER_PAGE);
    const batches: Candle[][] = [];
    let endTime: number | undefined;

    for (let p = 0; p < pages; p++) {
        const url = endTime
            ? `${getBinanceRestBase(symbol)}/klines?symbol=${symbol}&interval=${interval}&limit=${MAX_PER_PAGE}&endTime=${endTime}`
            : `${getBinanceRestBase(symbol)}/klines?symbol=${symbol}&interval=${interval}&limit=${MAX_PER_PAGE}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("klines fetch failed");
        const batch = parseKlines(await res.json() as KlineRow[]);
        if (batch.length === 0) break;

        batches.unshift(batch);
        endTime = batch[0].time - 1;
    }

    const seen = new Set<number>();
    return batches
        .flat()
        .filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; })
        .sort((a, b) => a.time - b.time);
}

export type AnalysisProgress = {
    label: string;
    pct: number;
    stepIndex: number;
};

export const ANALYSIS_STEPS = [
    { key: "pivot",   ko: "피벗 포인트 감지",   en: "Detecting pivots",      pct: 12 },
    { key: "trend",   ko: "추세선 분석",         en: "Analyzing trend lines", pct: 26 },
    { key: "sr",      ko: "지지/저항 계산",      en: "Calculating S/R",       pct: 40 },
    { key: "fib",     ko: "피보나치 레벨",       en: "Fibonacci levels",      pct: 54 },
    { key: "struct",  ko: "시장 구조 분석",      en: "Market structure",      pct: 66 },
    { key: "candle",  ko: "캔들 패턴 인식",      en: "Candle patterns",       pct: 78 },
    { key: "signal",  ko: "시그널 생성",         en: "Generating signal",     pct: 88 },
    { key: "setup",   ko: "진입 타점 계산",      en: "Entry points",          pct: 96 },
] as const;

const tick = () => new Promise<void>(r => setTimeout(r, 90));

export type AnalysisState = {
    candles: Candle[] | null
    result: AnalysisResult | null
    candlesLoading: boolean
    loading: boolean
    progress: AnalysisProgress | null
    error: string | null
    loadCandles: (symbol: string, interval: Interval) => Promise<void>
    run: (symbol: string, interval: Interval, locale?: Locale) => Promise<void>
}

export function useAnalysis(): AnalysisState {
    const [candles, setCandles]               = useState<Candle[] | null>(null);
    const [result, setResult]                 = useState<AnalysisResult | null>(null);
    const [candlesLoading, setCandlesLoading] = useState(false);
    const [loading, setLoading]               = useState(false);
    const [progress, setProgress]             = useState<AnalysisProgress | null>(null);
    const [error, setError]                   = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const loadCandles = useCallback(async (symbol: string, interval: Interval) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setCandlesLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await fetchKlines(symbol, interval);
            setCandles(data);
        } catch (e) {
            if (e instanceof Error && e.name !== "AbortError") setError(e.message);
        } finally {
            setCandlesLoading(false);
        }
    }, []);

    const run = useCallback(async (symbol: string, interval: Interval, locale: Locale = "ko") => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);

        const step = (idx: number) => {
            const s = ANALYSIS_STEPS[idx];
            setProgress({ label: s[locale], pct: s.pct, stepIndex: idx });
        };

        try {
            step(0);
            await tick();
            const data = candles ?? await fetchKlines(symbol, interval);
            if (!candles) setCandles(data);
            const pivots = detectPivots(data);

            step(1);
            await tick();
            const trendLines = detectTrendLines(data, pivots);

            step(2);
            await tick();
            const srLevels = detectSRLevels(data, pivots);

            step(3);
            await tick();
            const fibonacci = calculateFibonacci(pivots);

            step(4);
            await tick();
            const marketStructure = analyzeMarketStructure(data, pivots);

            step(5);
            await tick();
            const candlestickPatterns = detectCandlestickPatterns(data);

            step(6);
            await tick();
            const setup = generateSignal(data, trendLines, srLevels, fibonacci, marketStructure, candlestickPatterns, locale);

            step(7);
            await tick();
            const trendLineSetups = generateTrendLineSetups(data, trendLines, srLevels);

            setResult({
                candles: data,
                pivots,
                trendLines,
                srLevels,
                fibonacci,
                marketStructure,
                candlestickPatterns,
                setup,
                trendLineSetups,
                interval,
                symbol,
            });
        } catch (e) {
            if (e instanceof Error && e.name !== "AbortError") setError(e.message);
        } finally {
            setLoading(false);
            setProgress(null);
        }
    }, [candles]);

    return { candles, result, candlesLoading, loading, progress, error, loadCandles, run };
}
