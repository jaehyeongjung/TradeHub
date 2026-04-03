import type { Candle, TrendLine, SRLevel, TrendLineSetup } from "./types";
import { avgATR } from "./pivot";
import { nearestSupport, nearestResistance } from "./support-resistance";

/**
 * 추세선 기반 미래 진입 타점 계산
 *
 * - 상승추세선(uptrend) 위에 현재가 → pullback_long
 *   : 가격이 추세선까지 눌렸을 때 매수 타점
 * - 하락추세선(downtrend) 아래에 현재가 → pullback_short
 *   : 가격이 추세선까지 반등했을 때 매도 타점
 */
export function generateTrendLineSetups(
    candles: Candle[],
    trendLines: TrendLine[],
    srLevels: SRLevel[],
): TrendLineSetup[] {
    const n     = candles.length - 1;
    const price = candles[n].close;
    const atr   = avgATR(candles);
    const setups: TrendLineSetup[] = [];

    for (const line of trendLines.filter(l => !l.broken)) {
        const lp  = line.priceAt(n);
        const gap = price - lp;

        if (line.type === "uptrend" && gap > atr * 0.1 && gap < atr * 15) {
            const entryOffset = Math.max(5, Math.min(25, Math.ceil(gap / (atr * 0.4))));
            const entryIdx    = n + entryOffset;
            const entryPrice  = line.priceAt(entryIdx);

            const stopLoss = entryPrice - atr * 1.2;
            const risk     = entryPrice - stopLoss;
            const res      = nearestResistance(srLevels, entryPrice);
            const tp1      = res && res.price > entryPrice
                ? Math.min(res.price, entryPrice + risk * 2)
                : entryPrice + risk * 2;
            const tp2 = entryPrice + risk * 3.5;

            setups.push({
                id:           `setup-${line.id}`,
                trendLineId:  line.id,
                setupType:    "pullback_long",
                entryPrice,
                entryOffset,
                stopLoss,
                takeProfit1:  tp1,
                takeProfit2:  tp2,
                riskReward:   risk > 0 ? (tp1 - entryPrice) / risk : 0,
                confidence:   Math.min(85, Math.round(line.strength * 0.65 + 18)),
                label:        "상승 추세선 눌림 매수",
            });
        }

        if (line.type === "downtrend" && gap < -atr * 0.1 && Math.abs(gap) < atr * 15) {
            const absGap      = Math.abs(gap);
            const entryOffset = Math.max(5, Math.min(25, Math.ceil(absGap / (atr * 0.4))));
            const entryIdx    = n + entryOffset;
            const entryPrice  = line.priceAt(entryIdx);

            const stopLoss = entryPrice + atr * 1.2;
            const risk     = stopLoss - entryPrice;
            const sup      = nearestSupport(srLevels, entryPrice);
            const tp1      = sup && sup.price < entryPrice
                ? Math.max(sup.price, entryPrice - risk * 2)
                : entryPrice - risk * 2;
            const tp2 = entryPrice - risk * 3.5;

            setups.push({
                id:           `setup-${line.id}`,
                trendLineId:  line.id,
                setupType:    "pullback_short",
                entryPrice,
                entryOffset,
                stopLoss,
                takeProfit1:  tp1,
                takeProfit2:  tp2,
                riskReward:   risk > 0 ? (entryPrice - tp1) / risk : 0,
                confidence:   Math.min(85, Math.round(line.strength * 0.65 + 18)),
                label:        "하락 추세선 반등 매도",
            });
        }
    }

    return setups
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
}
