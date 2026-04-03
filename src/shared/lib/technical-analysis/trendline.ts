import type { Candle, Pivot, TrendLine } from "./types";
import { avgATR } from "./pivot";

function fitLine(p1: Pivot, p2: Pivot): { slope: number; intercept: number } {
    const slope = (p2.price - p1.price) / (p2.index - p1.index);
    const intercept = p1.price - slope * p1.index;
    return { slope, intercept };
}

function linePrice(slope: number, intercept: number, index: number): number {
    return slope * index + intercept;
}

/**
 * 캔들이 추세선에 실제로 닿은 횟수
 * - 연속 터치는 1번으로 간주 (gap > 2)
 */
function countTouches(
    candles: Candle[],
    slope: number,
    intercept: number,
    tolerance: number,
    startIdx: number,
    endIdx: number,
): number {
    let count = 0;
    let lastTouchIdx = -10;

    for (let i = startIdx; i <= endIdx; i++) {
        const lp = linePrice(slope, intercept, i);
        const touchedHigh = Math.abs(candles[i].high - lp) < tolerance;
        const touchedLow = Math.abs(candles[i].low - lp) < tolerance;

        if ((touchedHigh || touchedLow) && i - lastTouchIdx > 2) {
            count++;
            lastTouchIdx = i;
        }
    }

    return count;
}

/**
 * 추세선 돌파 여부 (종가 기준)
 * 다우 이론: 종가가 ATR × 0.3 이상 라인을 벗어나면 돌파로 간주
 */
function isViolated(
    candles: Candle[],
    slope: number,
    intercept: number,
    type: "uptrend" | "downtrend",
    startIdx: number,
    violationTol: number,
): boolean {
    for (let i = startIdx; i < candles.length; i++) {
        const lp = linePrice(slope, intercept, i);
        if (type === "uptrend" && candles[i].close < lp - violationTol) return true;
        if (type === "downtrend" && candles[i].close > lp + violationTol) return true;
    }
    return false;
}

/**
 * 다우 이론 기반 추세선 감지
 *
 * 유효 조건:
 *   1. 상승추세: Higher Lows 연결 (slope > 0)
 *      하락추세: Lower Highs 연결 (slope < 0)
 *   2. 각도 10°~ 80° (너무 가파르거나 완만하면 신뢰도 낮음)
 *   3. 최소 3번 터치 (2번은 선, 3번부터 추세선)
 *   4. 돌파 여부 체크
 */
export function detectTrendLines(candles: Candle[], pivots: Pivot[]): TrendLine[] {
    if (pivots.length < 2) return [];

    const atr = avgATR(candles);
    const tolerance = atr * 0.15;
    const violationTol = atr * 0.3;
    const endIdx = candles.length - 1;
    const lines: TrendLine[] = [];

    const highPivots = pivots.filter(p => p.type === "high");
    const lowPivots = pivots.filter(p => p.type === "low");

    // 상승추세선: Higher Lows 연결
    for (let i = 0; i < lowPivots.length - 1; i++) {
        for (let j = i + 1; j < lowPivots.length; j++) {
            const p1 = lowPivots[i];
            const p2 = lowPivots[j];
            if (p2.price <= p1.price) continue; // Higher Low 아니면 패스

            const { slope, intercept } = fitLine(p1, p2);
            const angle = Math.atan(Math.abs(slope)) * (180 / Math.PI);
            if (angle < 10 || angle > 80) continue;

            const touches = countTouches(candles, slope, intercept, tolerance, p1.index, endIdx);
            if (touches < 3) continue;

            const broken = isViolated(candles, slope, intercept, "uptrend", p1.index, violationTol);
            const strength = Math.min(100, touches * 18 + (j - i) * 3 + (broken ? 0 : 15));

            lines.push({
                id: `up-${i}-${j}`,
                type: "uptrend",
                pivots: [p1, p2],
                slope, intercept, touches, strength, broken,
                startIndex: p1.index,
                endIndex: endIdx,
                priceAt: (idx) => slope * idx + intercept,
            });
        }
    }

    // 하락추세선: Lower Highs 연결
    for (let i = 0; i < highPivots.length - 1; i++) {
        for (let j = i + 1; j < highPivots.length; j++) {
            const p1 = highPivots[i];
            const p2 = highPivots[j];
            if (p2.price >= p1.price) continue; // Lower High 아니면 패스

            const { slope, intercept } = fitLine(p1, p2);
            const angle = Math.atan(Math.abs(slope)) * (180 / Math.PI);
            if (angle < 10 || angle > 80) continue;

            const touches = countTouches(candles, slope, intercept, tolerance, p1.index, endIdx);
            if (touches < 3) continue;

            const broken = isViolated(candles, slope, intercept, "downtrend", p1.index, violationTol);
            const strength = Math.min(100, touches * 18 + (j - i) * 3 + (broken ? 0 : 15));

            lines.push({
                id: `down-${i}-${j}`,
                type: "downtrend",
                pivots: [p1, p2],
                slope, intercept, touches, strength, broken,
                startIndex: p1.index,
                endIndex: endIdx,
                priceAt: (idx) => slope * idx + intercept,
            });
        }
    }

    // 강도순 정렬, 겹치는 선 제거 (같은 피벗 공유하는 선 중 강한 것만)
    const sorted = lines.sort((a, b) => b.strength - a.strength);
    const deduped: TrendLine[] = [];

    for (const line of sorted) {
        const isDup = deduped.some(existing =>
            existing.type === line.type &&
            existing.pivots.some(ep => line.pivots.some(lp => ep.index === lp.index)) &&
            Math.abs(existing.slope - line.slope) < 0.001,
        );
        if (!isDup) deduped.push(line);
        if (deduped.length >= 6) break;
    }

    return deduped;
}
