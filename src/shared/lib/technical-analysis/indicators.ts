import type { Candle } from "./types";

// ── EMA ───────────────────────────────────────────────────────────────────

export function calculateEMA(values: number[], period: number): number[] {
    if (values.length < period) return new Array(values.length).fill(0);

    const k   = 2 / (period + 1);
    const ema = new Array<number>(values.length).fill(0);
    ema[period - 1] = values.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < values.length; i++) {
        ema[i] = values[i] * k + ema[i - 1] * (1 - k);
    }
    return ema;
}

// ── RSI (Wilder) ──────────────────────────────────────────────────────────

export function calculateRSI(candles: Candle[], period = 14): number[] {
    const rsi = new Array<number>(candles.length).fill(0);
    if (candles.length <= period) return rsi;

    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const d = candles[i].close - candles[i - 1].close;
        if (d > 0) avgGain += d; else avgLoss -= d;
    }
    avgGain /= period;
    avgLoss /= period;

    for (let i = period; i < candles.length; i++) {
        if (i > period) {
            const d = candles[i].close - candles[i - 1].close;
            avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
        }
        rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return rsi;
}

// ── Stochastic RSI ────────────────────────────────────────────────────────

export type StochRSIResult = { k: number[]; d: number[] }

/**
 * Stochastic RSI (Connors)
 * RSI에 스토캐스틱 공식을 적용해 과매수/과매도 반응이 RSI보다 빠름
 */
export function calculateStochasticRSI(
    candles: Candle[],
    rsiPeriod   = 14,
    stochPeriod = 14,
    kSmooth     = 3,
    dSmooth     = 3,
): StochRSIResult {
    const rsi  = calculateRSI(candles, rsiPeriod);
    const n    = candles.length;
    const raw  = new Array<number>(n).fill(0);

    for (let i = rsiPeriod + stochPeriod - 1; i < n; i++) {
        const slice = rsi.slice(i - stochPeriod + 1, i + 1).filter(v => v > 0);
        if (slice.length < 2) continue;
        const lo = Math.min(...slice);
        const hi = Math.max(...slice);
        raw[i] = hi > lo ? (rsi[i] - lo) / (hi - lo) * 100 : 50;
    }

    const k = calculateEMA(raw, kSmooth);
    const d = calculateEMA(k, dSmooth);
    return { k, d };
}

// ── MACD ──────────────────────────────────────────────────────────────────

export type MACDResult = { macd: number[]; signal: number[]; histogram: number[] }

export function calculateMACD(candles: Candle[], fast = 12, slow = 26, sig = 9): MACDResult {
    const c    = candles.map(x => x.close);
    const macd = calculateEMA(c, fast).map((v, i) => v && calculateEMA(c, slow)[i] ? v - calculateEMA(c, slow)[i] : 0);
    // Re-calculate properly (avoid calling calculateEMA twice)
    const ef   = calculateEMA(c, fast);
    const es   = calculateEMA(c, slow);
    const macd2 = ef.map((v, i) => (v && es[i]) ? v - es[i] : 0);
    const signal = calculateEMA(macd2, sig);
    const histogram = macd2.map((v, i) => v - signal[i]);
    return { macd: macd2, signal, histogram };
}

// ── Bollinger Bands ───────────────────────────────────────────────────────

export type BollingerResult = { upper: number[]; middle: number[]; lower: number[]; width: number[] }

export function calculateBollinger(candles: Candle[], period = 20, mult = 2): BollingerResult {
    const closes = candles.map(c => c.close);
    const upper: number[] = [], middle: number[] = [], lower: number[] = [], width: number[] = [];

    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) { upper.push(0); middle.push(0); lower.push(0); width.push(0); continue; }
        const slice = closes.slice(i - period + 1, i + 1);
        const avg   = slice.reduce((a, b) => a + b, 0) / period;
        const std   = Math.sqrt(slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period);
        const u = avg + mult * std, l = avg - mult * std;
        upper.push(u); middle.push(avg); lower.push(l);
        width.push(avg > 0 ? (u - l) / avg * 100 : 0);
    }
    return { upper, middle, lower, width };
}

// ── ADX (Average Directional Index) ──────────────────────────────────────

export type ADXResult = { adx: number[]; plusDI: number[]; minusDI: number[] }

/**
 * Wilder's ADX
 * ADX > 25: 추세 존재 / > 40: 강한 추세 / < 20: 횡보
 * +DI > -DI: 상승압력 우세, -DI > +DI: 하락압력 우세
 */
export function calculateADX(candles: Candle[], period = 14): ADXResult {
    const n = candles.length;
    const plusDM  = new Array<number>(n).fill(0);
    const minusDM = new Array<number>(n).fill(0);
    const tr      = new Array<number>(n).fill(0);

    for (let i = 1; i < n; i++) {
        const up   = candles[i].high - candles[i - 1].high;
        const down = candles[i - 1].low - candles[i].low;
        plusDM[i]  = up > down && up > 0 ? up : 0;
        minusDM[i] = down > up && down > 0 ? down : 0;
        tr[i] = Math.max(
            candles[i].high - candles[i].low,
            Math.abs(candles[i].high - candles[i - 1].close),
            Math.abs(candles[i].low  - candles[i - 1].close),
        );
    }

    // Wilder smoothing (first value = sum, then rolling)
    const sTR  = new Array<number>(n).fill(0);
    const sPDM = new Array<number>(n).fill(0);
    const sMDM = new Array<number>(n).fill(0);

    sTR[period]  = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
    sPDM[period] = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
    sMDM[period] = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

    for (let i = period + 1; i < n; i++) {
        sTR[i]  = sTR[i - 1]  - sTR[i - 1]  / period + tr[i];
        sPDM[i] = sPDM[i - 1] - sPDM[i - 1] / period + plusDM[i];
        sMDM[i] = sMDM[i - 1] - sMDM[i - 1] / period + minusDM[i];
    }

    const plusDI  = new Array<number>(n).fill(0);
    const minusDI = new Array<number>(n).fill(0);
    const dx      = new Array<number>(n).fill(0);

    for (let i = period; i < n; i++) {
        if (sTR[i] === 0) continue;
        plusDI[i]  = (sPDM[i] / sTR[i]) * 100;
        minusDI[i] = (sMDM[i] / sTR[i]) * 100;
        const sum  = plusDI[i] + minusDI[i];
        dx[i] = sum > 0 ? Math.abs(plusDI[i] - minusDI[i]) / sum * 100 : 0;
    }

    // ADX = smoothed DX
    const adx = new Array<number>(n).fill(0);
    const adxStart = period * 2;
    if (adxStart < n) {
        adx[adxStart] = dx.slice(period, adxStart + 1).reduce((a, b) => a + b, 0) / (period + 1);
        for (let i = adxStart + 1; i < n; i++) {
            adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
        }
    }

    return { adx, plusDI, minusDI };
}

// ── OBV (On Balance Volume) ───────────────────────────────────────────────

/**
 * OBV: 가격이 오를 때 +거래량, 내릴 때 -거래량
 * OBV가 가격보다 먼저 움직이면 스마트머니 방향 신호
 */
export function calculateOBV(candles: Candle[]): number[] {
    const obv = [0];
    for (let i = 1; i < candles.length; i++) {
        const diff = candles[i].close - candles[i - 1].close;
        obv.push(obv[i - 1] + (diff > 0 ? candles[i].volume : diff < 0 ? -candles[i].volume : 0));
    }
    return obv;
}

// ── Ichimoku Cloud ────────────────────────────────────────────────────────

export type IchimokuResult = {
    tenkan:  number[]   // 전환선 (9)
    kijun:   number[]   // 기준선 (26)
    senkouA: number[]   // 선행 스팬 A (현재 시점 기준, 26 미래 displacement 미반영)
    senkouB: number[]   // 선행 스팬 B
}

function highLowMid(candles: Candle[], from: number, to: number): number {
    let hi = -Infinity, lo = Infinity;
    for (let i = from; i <= to; i++) { hi = Math.max(hi, candles[i].high); lo = Math.min(lo, candles[i].low); }
    return (hi + lo) / 2;
}

/**
 * 이치모쿠 구름
 * 현재가가 구름 위: 강세, 구름 아래: 약세
 * 전환선이 기준선 위: 단기 강세, 아래: 단기 약세
 */
export function calculateIchimoku(candles: Candle[]): IchimokuResult {
    const n       = candles.length;
    const tenkan  = new Array<number>(n).fill(0);
    const kijun   = new Array<number>(n).fill(0);
    const senkouA = new Array<number>(n).fill(0);
    const senkouB = new Array<number>(n).fill(0);

    for (let i = 8;  i < n; i++) tenkan[i]  = highLowMid(candles, i - 8,  i);
    for (let i = 25; i < n; i++) kijun[i]   = highLowMid(candles, i - 25, i);
    for (let i = 25; i < n; i++) senkouA[i] = (tenkan[i] + kijun[i]) / 2;
    for (let i = 51; i < n; i++) senkouB[i] = highLowMid(candles, i - 51, i);

    return { tenkan, kijun, senkouA, senkouB };
}
