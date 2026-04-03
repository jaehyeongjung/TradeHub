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

// ── 타임프레임별 가져올 캔들 수 ────────────────────────────────────────────
// 짧은 봉일수록 더 많이 가져와 충분한 히스토리 확보
const FETCH_TOTAL: Partial<Record<Interval, number>> = {
    "15m": 2000,   // ~20일치 (2 페이지)
    "1h":  2000,   // ~83일치 (2 페이지)
    "4h":  1000,   // ~167일치 (1 페이지)
    "1d":  500,    // ~2년치 (1 페이지)
    "1w":  200,    // ~3.8년치 (1 페이지)
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

    // 단일 페이지로 충분한 경우
    if (total <= MAX_PER_PAGE) {
        const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${total}`
        );
        if (!res.ok) throw new Error("klines fetch failed");
        return parseKlines(await res.json() as KlineRow[]);
    }

    // 다중 페이지 (오래된 데이터부터 최신까지 조합)
    const pages   = Math.ceil(total / MAX_PER_PAGE);
    const batches: Candle[][] = [];
    let endTime: number | undefined;

    for (let p = 0; p < pages; p++) {
        const url = endTime
            ? `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${MAX_PER_PAGE}&endTime=${endTime}`
            : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${MAX_PER_PAGE}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("klines fetch failed");
        const batch = parseKlines(await res.json() as KlineRow[]);
        if (batch.length === 0) break;

        batches.unshift(batch);          // 오래된 배치를 앞에 추가
        endTime = batch[0].time - 1;    // 다음 페이지는 이 시점 이전
    }

    // 합치고 중복 제거 후 시간순 정렬
    const seen = new Set<number>();
    return batches
        .flat()
        .filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; })
        .sort((a, b) => a.time - b.time);
}

export type AnalysisState = {
    candles: Candle[] | null
    result: AnalysisResult | null
    candlesLoading: boolean
    loading: boolean
    error: string | null
    loadCandles: (symbol: string, interval: Interval) => Promise<void>
    run: (symbol: string, interval: Interval, locale?: Locale) => Promise<void>
}

export function useAnalysis(): AnalysisState {
    const [candles, setCandles]               = useState<Candle[] | null>(null);
    const [result, setResult]                 = useState<AnalysisResult | null>(null);
    const [candlesLoading, setCandlesLoading] = useState(false);
    const [loading, setLoading]               = useState(false);
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

        try {
            const data = candles ?? await fetchKlines(symbol, interval);
            if (!candles) setCandles(data);

            // 분석 파이프라인
            const pivots              = detectPivots(data);
            const trendLines          = detectTrendLines(data, pivots);
            const srLevels            = detectSRLevels(data, pivots);
            const fibonacci           = calculateFibonacci(pivots);
            const marketStructure     = analyzeMarketStructure(data, pivots);
            const candlestickPatterns = detectCandlestickPatterns(data);
            const setup               = generateSignal(data, trendLines, srLevels, fibonacci, marketStructure, candlestickPatterns, locale);
            const trendLineSetups     = generateTrendLineSetups(data, trendLines, srLevels);

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
        }
    }, [candles]);

    return { candles, result, candlesLoading, loading, error, loadCandles, run };
}
