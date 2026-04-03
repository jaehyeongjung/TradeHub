import type { Candle, Pivot } from "./types";

/** Wilder's ATR */
export function calculateATR(candles: Candle[], period = 14): number[] {
    const atrs = new Array<number>(candles.length).fill(0);
    const trs: number[] = [];

    for (let i = 1; i < candles.length; i++) {
        trs.push(Math.max(
            candles[i].high - candles[i].low,
            Math.abs(candles[i].high - candles[i - 1].close),
            Math.abs(candles[i].low - candles[i - 1].close),
        ));
    }

    if (trs.length < period) return atrs;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += trs[i];
    atrs[period] = sum / period;

    for (let i = period + 1; i < candles.length; i++) {
        atrs[i] = (atrs[i - 1] * (period - 1) + trs[i - 1]) / period;
    }

    return atrs;
}

export function avgATR(candles: Candle[], period = 14): number {
    const vals = calculateATR(candles, period).filter(v => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Zigzag pivot detection (ATR 기반)
 * 직전 피벗 대비 ATR × multiplier 이상 움직였을 때만 새 피벗으로 인정
 * → 노이즈 제거, 의미있는 스윙 고점/저점만 추출
 */
export function detectPivots(candles: Candle[], atrMultiplier = 1.5): Pivot[] {
    if (candles.length < 20) return [];

    const threshold = avgATR(candles) * atrMultiplier;
    const pivots: Pivot[] = [];

    let lookingForHigh = candles[1].high > candles[0].high;
    let extremeIdx = 0;
    let extremePrice = lookingForHigh ? candles[0].high : candles[0].low;

    for (let i = 1; i < candles.length; i++) {
        if (lookingForHigh) {
            if (candles[i].high >= extremePrice) {
                extremePrice = candles[i].high;
                extremeIdx = i;
            } else if (extremePrice - candles[i].low >= threshold) {
                pivots.push({ index: extremeIdx, time: candles[extremeIdx].time, price: extremePrice, type: "high" });
                lookingForHigh = false;
                extremePrice = candles[i].low;
                extremeIdx = i;
            }
        } else {
            if (candles[i].low <= extremePrice) {
                extremePrice = candles[i].low;
                extremeIdx = i;
            } else if (candles[i].high - extremePrice >= threshold) {
                pivots.push({ index: extremeIdx, time: candles[extremeIdx].time, price: extremePrice, type: "low" });
                lookingForHigh = true;
                extremePrice = candles[i].high;
                extremeIdx = i;
            }
        }
    }

    return pivots;
}
