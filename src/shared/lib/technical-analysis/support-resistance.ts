import type { Candle, Pivot, SRLevel } from "./types";
import { avgATR } from "./pivot";

/**
 * 지지/저항 레벨 감지
 *
 * 알고리즘:
 *   1. 피벗 가격들을 ATR × 0.5 기준으로 클러스터링
 *   2. 2번 이상 터치된 레벨만 유효
 *   3. 현재가 기준 위/아래로 support/resistance 구분
 *   4. 역할전환(S/R Flip): 저항선 돌파 → 지지선으로 전환
 */
export function detectSRLevels(candles: Candle[], pivots: Pivot[]): SRLevel[] {
    if (!pivots.length) return [];

    const atr = avgATR(candles);
    const clusterTol = atr * 0.5;
    const currentPrice = candles[candles.length - 1].close;

    // 피벗 가격 클러스터링
    type Cluster = { price: number; pivots: Pivot[]; lastIdx: number };
    const clusters: Cluster[] = [];

    for (const pivot of pivots) {
        const match = clusters.find(c => Math.abs(c.price - pivot.price) < clusterTol);
        if (match) {
            match.pivots.push(pivot);
            // 클러스터 중심 갱신 (평균)
            match.price = match.pivots.reduce((s, p) => s + p.price, 0) / match.pivots.length;
            match.lastIdx = Math.max(match.lastIdx, pivot.index);
        } else {
            clusters.push({ price: pivot.price, pivots: [pivot], lastIdx: pivot.index });
        }
    }

    return clusters
        .filter(c => c.pivots.length >= 2)
        .map(c => {
            const recency = c.lastIdx / candles.length;
            const strength = Math.min(100, c.pivots.length * 20 + recency * 40);

            // S/R Flip 원칙: 현재가 기준
            const type: "support" | "resistance" = currentPrice >= c.price ? "support" : "resistance";

            return {
                price: c.price,
                type,
                touches: c.pivots.length,
                strength,
                lastTouchIndex: c.lastIdx,
            };
        })
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 8);
}

/** 현재가 기준 가장 가까운 지지선 */
export function nearestSupport(levels: SRLevel[], currentPrice: number): SRLevel | null {
    return levels
        .filter(l => l.type === "support" && l.price < currentPrice)
        .sort((a, b) => b.price - a.price)[0] ?? null;
}

/** 현재가 기준 가장 가까운 저항선 */
export function nearestResistance(levels: SRLevel[], currentPrice: number): SRLevel | null {
    return levels
        .filter(l => l.type === "resistance" && l.price > currentPrice)
        .sort((a, b) => a.price - b.price)[0] ?? null;
}
