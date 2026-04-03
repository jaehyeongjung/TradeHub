import type { Candle, Pivot, MarketStructure, SwingPoint, BreakOfStructure } from "./types";

/**
 * 시장 구조 분석 (ICT / Smart Money Concepts)
 *
 * HH (Higher High): 이전 고점보다 높은 고점 → 상승 구조 확인
 * HL (Higher Low):  이전 저점보다 높은 저점 → 상승 구조 확인
 * LH (Lower High):  이전 고점보다 낮은 고점 → 하락 구조 확인
 * LL (Lower Low):   이전 저점보다 낮은 저점 → 하락 구조 확인
 *
 * BOS (Break of Structure):  기존 추세 방향으로 구조 돌파 → 추세 지속 신호
 * CHoCH (Change of Character): 반대 방향 구조 돌파 → 추세 전환 경고
 */
export function analyzeMarketStructure(candles: Candle[], pivots: Pivot[]): MarketStructure {
    if (pivots.length < 4) {
        return { trend: "ranging", swingPoints: [], bos: null, choch: null, trendStrength: 0 };
    }

    // 최근 12개 피벗으로 분류 (너무 오래된 구조는 의미 없음)
    const highs = pivots.filter(p => p.type === "high").slice(-8);
    const lows  = pivots.filter(p => p.type === "low").slice(-8);

    const swingPoints: SwingPoint[] = [];

    for (let i = 1; i < highs.length; i++) {
        swingPoints.push({
            swingType:  highs[i].price > highs[i - 1].price ? "HH" : "LH",
            index:      highs[i].index,
            price:      highs[i].price,
            pivotType:  "high",
        });
    }

    for (let i = 1; i < lows.length; i++) {
        swingPoints.push({
            swingType:  lows[i].price > lows[i - 1].price ? "HL" : "LL",
            index:      lows[i].index,
            price:      lows[i].price,
            pivotType:  "low",
        });
    }

    swingPoints.sort((a, b) => a.index - b.index);

    // 최근 8개 스윙포인트로 트렌드 판별
    const recent = swingPoints.slice(-8);
    const bullCount = recent.filter(p => p.swingType === "HH" || p.swingType === "HL").length;
    const bearCount = recent.filter(p => p.swingType === "LH" || p.swingType === "LL").length;
    const total = recent.length;

    let trend: MarketStructure["trend"];
    let trendStrength = 0;

    if (total >= 4) {
        const bullRatio = bullCount / total;
        const bearRatio = bearCount / total;

        if (bullRatio >= 0.625) {
            trend = "uptrend";
            trendStrength = Math.min(100, Math.round(bullRatio * 120));
        } else if (bearRatio >= 0.625) {
            trend = "downtrend";
            trendStrength = Math.min(100, Math.round(bearRatio * 120));
        } else {
            trend = "ranging";
            trendStrength = Math.round(Math.abs(bullCount - bearCount) / total * 60);
        }
    } else {
        trend = "ranging";
    }

    // BOS / CHoCH 판별
    const currentPrice = candles[candles.length - 1].close;

    const lastHigh  = highs[highs.length - 1]?.price  ?? 0;
    const prevHigh  = highs[highs.length - 2]?.price  ?? 0;
    const lastLow   = lows[lows.length - 1]?.price   ?? Infinity;
    const prevLow   = lows[lows.length - 2]?.price   ?? Infinity;

    let bos:  BreakOfStructure | null = null;
    let choch: BreakOfStructure | null = null;

    if (trend === "uptrend") {
        // 상승추세 내 이전 고점 돌파 → BOS (추세 지속)
        if (prevHigh > 0 && currentPrice > prevHigh) {
            bos = { direction: "bullish", price: prevHigh, index: candles.length - 1 };
        }
        // 상승추세 내 저점 이탈 → CHoCH (전환 경고)
        if (lastLow < Infinity && currentPrice < lastLow) {
            choch = { direction: "bearish", price: lastLow, index: candles.length - 1 };
        }
    } else if (trend === "downtrend") {
        // 하락추세 내 이전 저점 이탈 → BOS (추세 지속)
        if (prevLow < Infinity && currentPrice < prevLow) {
            bos = { direction: "bearish", price: prevLow, index: candles.length - 1 };
        }
        // 하락추세 내 고점 돌파 → CHoCH (전환 경고)
        if (lastHigh > 0 && currentPrice > lastHigh) {
            choch = { direction: "bullish", price: lastHigh, index: candles.length - 1 };
        }
    }

    return { trend, swingPoints, bos, choch, trendStrength };
}
