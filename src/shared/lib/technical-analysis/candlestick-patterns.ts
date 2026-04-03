import type { Candle, CandlestickPattern } from "./types";

function body(c: Candle)        { return Math.abs(c.close - c.open); }
function totalRange(c: Candle)  { return c.high - c.low; }
function upper(c: Candle)       { return c.high - Math.max(c.open, c.close); }
function lower(c: Candle)       { return Math.min(c.open, c.close) - c.low; }
function isBull(c: Candle)      { return c.close > c.open; }
function isBear(c: Candle)      { return c.close < c.open; }
function mid(c: Candle)         { return (c.open + c.close) / 2; }

/**
 * 최근 5캔들에서 주요 캔들스틱 패턴 감지
 *
 * 구현 패턴:
 *   단일봉: 도지(3종), 망치/교수형, 슈팅스타/역망치형
 *   2봉:    강세/약세 장악형, 관통형, 흑운형, 강세/약세 잉태형
 *   3봉:    모닝스타, 이브닝스타, 적삼병, 흑삼병
 */
export function detectCandlestickPatterns(candles: Candle[]): CandlestickPattern[] {
    if (candles.length < 3) return [];

    const n = candles.length - 1;
    const start = Math.max(2, n - 4);
    const patterns: CandlestickPattern[] = [];

    for (let i = start; i <= n; i++) {
        const c0 = candles[i];
        const c1 = i >= 1 ? candles[i - 1] : null;
        const c2 = i >= 2 ? candles[i - 2] : null;

        const b0  = body(c0);
        const r0  = totalRange(c0);
        const u0  = upper(c0);
        const l0  = lower(c0);

        if (r0 < 1e-10) continue;

        // ──────────────────────────── 단일봉 ──────────────────────────────

        // 드래곤플라이 도지: 위꼬리 없고 아래꼬리 길다 → 강세 반전
        if (b0 < r0 * 0.07 && u0 < r0 * 0.05 && l0 > r0 * 0.6) {
            patterns.push({ name: "Dragonfly Doji", koreanName: "드래곤플라이 도지", type: "bullish", strength: 2, index: i });
            continue;
        }

        // 묘비형 도지: 아래꼬리 없고 위꼬리 길다 → 약세 반전
        if (b0 < r0 * 0.07 && l0 < r0 * 0.05 && u0 > r0 * 0.6) {
            patterns.push({ name: "Gravestone Doji", koreanName: "묘비형 도지", type: "bearish", strength: 2, index: i });
            continue;
        }

        // 일반 도지: 몸통이 range의 7% 미만
        if (b0 < r0 * 0.07) {
            patterns.push({ name: "Doji", koreanName: "도지", type: "neutral", strength: 1, index: i });
            continue;
        }

        // 망치형 / 교수형: 몸통 작고, 아래꼬리 ≥ 2×몸통, 위꼬리 ≤ 0.4×몸통
        if (b0 > r0 * 0.05 && l0 >= b0 * 2.0 && u0 <= b0 * 0.4) {
            if (c1 && isBear(c1)) {
                patterns.push({ name: "Hammer", koreanName: "망치형", type: "bullish", strength: 2, index: i });
            } else if (c1 && isBull(c1)) {
                patterns.push({ name: "Hanging Man", koreanName: "교수형", type: "bearish", strength: 2, index: i });
            }
        }

        // 슈팅스타 / 역망치형: 위꼬리 ≥ 2×몸통, 아래꼬리 ≤ 0.4×몸통
        if (b0 > r0 * 0.05 && u0 >= b0 * 2.0 && l0 <= b0 * 0.4) {
            if (c1 && isBull(c1)) {
                patterns.push({ name: "Shooting Star", koreanName: "슈팅스타", type: "bearish", strength: 2, index: i });
            } else if (c1 && isBear(c1)) {
                patterns.push({ name: "Inverted Hammer", koreanName: "역망치형", type: "bullish", strength: 2, index: i });
            }
        }

        // ──────────────────────────── 2봉 패턴 ───────────────────────────

        if (c1) {
            const b1 = body(c1);

            // 강세 장악형: 전봉 음봉, 현봉 양봉이 전봉 완전 포함
            if (isBear(c1) && isBull(c0) &&
                c0.open <= c1.close && c0.close >= c1.open &&
                b0 > b1 * 1.05) {
                patterns.push({ name: "Bullish Engulfing", koreanName: "강세 장악형", type: "bullish", strength: 3, index: i });
            }

            // 약세 장악형: 전봉 양봉, 현봉 음봉이 전봉 완전 포함
            if (isBull(c1) && isBear(c0) &&
                c0.open >= c1.close && c0.close <= c1.open &&
                b0 > b1 * 1.05) {
                patterns.push({ name: "Bearish Engulfing", koreanName: "약세 장악형", type: "bearish", strength: 3, index: i });
            }

            // 관통형: 전봉 음봉, 현봉 양봉이 전봉 중간 이상 돌파
            if (isBear(c1) && isBull(c0) &&
                c0.open < c1.low &&
                c0.close > mid(c1) && c0.close < c1.open) {
                patterns.push({ name: "Piercing Line", koreanName: "관통형", type: "bullish", strength: 2, index: i });
            }

            // 흑운형: 전봉 양봉, 현봉 음봉이 전봉 중간 이하
            if (isBull(c1) && isBear(c0) &&
                c0.open > c1.high &&
                c0.close < mid(c1) && c0.close > c1.open) {
                patterns.push({ name: "Dark Cloud Cover", koreanName: "흑운형", type: "bearish", strength: 2, index: i });
            }

            // 강세 잉태형: 큰 음봉 안에 작은 양봉
            if (isBear(c1) && isBull(c0) &&
                c0.open > c1.close && c0.close < c1.open &&
                b0 < b1 * 0.6) {
                patterns.push({ name: "Bullish Harami", koreanName: "상승 잉태형", type: "bullish", strength: 2, index: i });
            }

            // 약세 잉태형: 큰 양봉 안에 작은 음봉
            if (isBull(c1) && isBear(c0) &&
                c0.open < c1.close && c0.close > c1.open &&
                b0 < b1 * 0.6) {
                patterns.push({ name: "Bearish Harami", koreanName: "하락 잉태형", type: "bearish", strength: 2, index: i });
            }
        }

        // ──────────────────────────── 3봉 패턴 ───────────────────────────

        if (c1 && c2) {
            const b1 = body(c1);
            const b2 = body(c2);
            const u1 = upper(c1);
            const l1 = lower(c1);

            // 모닝스타: 음봉 + 작은 몸통(별) + 큰 양봉이 음봉 중간 이상
            if (isBear(c2) && b2 > 0 &&
                b1 < b2 * 0.45 &&
                isBull(c0) &&
                c0.close > mid(c2) &&
                b0 > b2 * 0.5) {
                patterns.push({ name: "Morning Star", koreanName: "모닝스타", type: "bullish", strength: 3, index: i });
            }

            // 이브닝스타: 양봉 + 작은 몸통(별) + 큰 음봉이 양봉 중간 이하
            if (isBull(c2) && b2 > 0 &&
                b1 < b2 * 0.45 &&
                isBear(c0) &&
                c0.close < mid(c2) &&
                b0 > b2 * 0.5) {
                patterns.push({ name: "Evening Star", koreanName: "이브닝스타", type: "bearish", strength: 3, index: i });
            }

            // 적삼병: 3연속 양봉, 점진적 상승, 위꼬리 작음
            if (isBull(c0) && isBull(c1) && isBull(c2) &&
                c0.close > c1.close && c1.close > c2.close &&
                c0.open > c2.open && c1.open > c2.open &&
                upper(c0) < b0 * 0.35 && u1 < b1 * 0.35) {
                patterns.push({ name: "Three White Soldiers", koreanName: "적삼병", type: "bullish", strength: 3, index: i });
            }

            // 흑삼병: 3연속 음봉, 점진적 하락, 아래꼬리 작음
            if (isBear(c0) && isBear(c1) && isBear(c2) &&
                c0.close < c1.close && c1.close < c2.close &&
                c0.open < c2.open && c1.open < c2.open &&
                lower(c0) < b0 * 0.35 && l1 < b1 * 0.35) {
                patterns.push({ name: "Three Black Crows", koreanName: "흑삼병", type: "bearish", strength: 3, index: i });
            }
        }
    }

    // 같은 인덱스에서 가장 강한 패턴만 유지, 최대 5개
    const seen = new Set<number>();
    return patterns
        .sort((a, b) => b.strength - a.strength || b.index - a.index)
        .filter(p => {
            if (seen.has(p.index)) return false;
            seen.add(p.index);
            return true;
        })
        .slice(0, 5);
}
