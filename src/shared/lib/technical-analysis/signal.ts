import type {
    Candle, TrendLine, SRLevel, FibRetracement,
    MarketStructure, CandlestickPattern,
    TradeSetup, SignalReason,
} from "./types";
import {
    calculateRSI, calculateStochasticRSI, calculateMACD,
    calculateBollinger, calculateEMA,
    calculateADX, calculateOBV, calculateIchimoku,
} from "./indicators";
import { avgATR } from "./pivot";
import { nearestSupport, nearestResistance } from "./support-resistance";

/**
 * 종합 트레이드 시그널 생성 (v2)
 *
 * 스코어 구성 (최대 ±10 클램프):
 *
 * 1. 시장구조 (BOS/CHoCH)      ±3 + ±2 + ±1
 * 2. 캔들스틱 패턴              ±3 (최대 2개 반영)
 * 3. RSI + 다이버전스           ±3 + ±2
 * 4. Stochastic RSI            ±2 + ±1 (크로스)
 * 5. MACD                      ±2
 * 6. 볼린저밴드                 ±2
 * 7. EMA 배열 (ADX 가중)        ±2 + ±1 (EMA200 위치)
 * 8. 이치모쿠 구름              ±2 + ±1 (TK 크로스)
 * 9. OBV 다이버전스             ±1 + ±1
 * 10. 추세선                   ±2
 * 11. 지지/저항                ±2
 * 12. 피보나치 핵심 레벨        ±2
 */
export function generateSignal(
    candles: Candle[],
    trendLines: TrendLine[],
    srLevels: SRLevel[],
    fibonacci: FibRetracement | null,
    marketStructure: MarketStructure,
    candlestickPatterns: CandlestickPattern[],
): TradeSetup {
    const closes = candles.map(c => c.close);
    const n      = candles.length - 1;
    const price  = closes[n];
    const atr    = avgATR(candles);

    // 지표 계산
    const rsi     = calculateRSI(candles);
    const stoch   = calculateStochasticRSI(candles);
    const macd    = calculateMACD(candles);
    const bb      = calculateBollinger(candles);
    const ema20   = calculateEMA(closes, 20);
    const ema50   = calculateEMA(closes, 50);
    const ema200  = calculateEMA(closes, 200);
    const adx     = calculateADX(candles);
    const ichimoku = calculateIchimoku(candles);
    const obv     = calculateOBV(candles);

    const reasons: SignalReason[] = [];
    let score = 0;

    // ── 1. 시장 구조 (Market Structure) ──────────────────────────────────
    const { trend, trendStrength, bos, choch } = marketStructure;

    if (trend === "uptrend") {
        const s = trendStrength >= 75 ? 3 : 2;
        score += s;
        reasons.push({ source: "시장구조", description: `상승 구조 HH/HL (강도 ${trendStrength})`, bullish: true, score: s });
    } else if (trend === "downtrend") {
        const s = trendStrength >= 75 ? -3 : -2;
        score += s;
        reasons.push({ source: "시장구조", description: `하락 구조 LH/LL (강도 ${trendStrength})`, bullish: false, score: s });
    }

    if (bos) {
        const s = bos.direction === "bullish" ? 2 : -2;
        score += s;
        reasons.push({ source: "BOS", description: `구조 돌파 ${bos.direction === "bullish" ? "상승" : "하락"} (추세 지속)`, bullish: s > 0, score: s });
    }

    if (choch) {
        const s = choch.direction === "bullish" ? 1 : -1;
        score += s;
        reasons.push({ source: "CHoCH", description: `추세 전환 신호 ${choch.direction === "bullish" ? "상승 전환" : "하락 전환"}`, bullish: s > 0, score: s });
    }

    // ── 2. 캔들스틱 패턴 ─────────────────────────────────────────────────
    const recentPatterns = candlestickPatterns.filter(p => p.index >= n - 2 && p.type !== "neutral");

    for (const pat of recentPatterns.slice(0, 2)) {
        const s = pat.type === "bullish" ? pat.strength : -(pat.strength as number);
        score += s;
        reasons.push({ source: "캔들패턴", description: `${pat.koreanName} (강도 ${pat.strength})`, bullish: pat.type === "bullish", score: s });
    }

    // ── 3. RSI ────────────────────────────────────────────────────────────
    const rsiVal = rsi[n];

    if (rsiVal > 0) {
        if (rsiVal < 25) {
            score += 3;
            reasons.push({ source: "RSI", description: `${rsiVal.toFixed(0)} 극단 과매도`, bullish: true, score: 3 });
        } else if (rsiVal < 35) {
            score += 2;
            reasons.push({ source: "RSI", description: `${rsiVal.toFixed(0)} 과매도`, bullish: true, score: 2 });
        } else if (rsiVal > 75) {
            score -= 3;
            reasons.push({ source: "RSI", description: `${rsiVal.toFixed(0)} 극단 과매수`, bullish: false, score: -3 });
        } else if (rsiVal > 65) {
            score -= 2;
            reasons.push({ source: "RSI", description: `${rsiVal.toFixed(0)} 과매수`, bullish: false, score: -2 });
        }

        // RSI 다이버전스 (14봉 윈도우)
        if (n >= 14) {
            const w = 14;
            const priceSlice = closes.slice(n - w, n);
            const rsiSlice   = rsi.slice(n - w, n).filter(v => v > 0);

            if (rsiSlice.length >= 5) {
                // 강세 다이버전스: 가격 신저점, RSI는 더 높은 저점
                const pMin = Math.min(...priceSlice);
                const rMin = Math.min(...rsiSlice);
                if (price <= pMin * 1.005 && rsiVal > rMin * 1.08) {
                    score += 2;
                    reasons.push({ source: "RSI 다이버전스", description: "강세 다이버전스 (가격↓ RSI↑)", bullish: true, score: 2 });
                }
                // 약세 다이버전스: 가격 신고점, RSI는 더 낮은 고점
                const pMax = Math.max(...priceSlice);
                const rMax = Math.max(...rsiSlice);
                if (price >= pMax * 0.995 && rsiVal < rMax * 0.92) {
                    score -= 2;
                    reasons.push({ source: "RSI 다이버전스", description: "약세 다이버전스 (가격↑ RSI↓)", bullish: false, score: -2 });
                }
            }
        }
    }

    // ── 4. Stochastic RSI ────────────────────────────────────────────────
    const stK     = stoch.k[n];
    const stD     = stoch.d[n];
    const stKPrev = stoch.k[n - 1] ?? stK;

    if (stK > 0 && stD > 0) {
        if (stK < 20 && stD < 20) {
            score += 2;
            reasons.push({ source: "StochRSI", description: `K${stK.toFixed(0)} 과매도 구간`, bullish: true, score: 2 });
        } else if (stK > 80 && stD > 80) {
            score -= 2;
            reasons.push({ source: "StochRSI", description: `K${stK.toFixed(0)} 과매수 구간`, bullish: false, score: -2 });
        }
        // K/D 교차 신호 (과매도/과매수 영역에서만 유효)
        if (stKPrev < stD && stK >= stD && stK < 40) {
            score += 1;
            reasons.push({ source: "StochRSI", description: "과매도권 K 상향 교차", bullish: true, score: 1 });
        } else if (stKPrev > stD && stK <= stD && stK > 60) {
            score -= 1;
            reasons.push({ source: "StochRSI", description: "과매수권 K 하향 교차", bullish: false, score: -1 });
        }
    }

    // ── 5. MACD ──────────────────────────────────────────────────────────
    const macdVal  = macd.macd[n];
    const sigVal   = macd.signal[n];
    const histCurr = macd.histogram[n];
    const histPrev = macd.histogram[n - 1] ?? 0;
    const histPp   = macd.histogram[n - 2] ?? 0;

    if (macdVal > sigVal) {
        const expanding = histCurr > histPrev && histPrev > histPp;
        const s = expanding ? 2 : 1;
        score += s;
        reasons.push({ source: "MACD", description: expanding ? "골든크로스 + 히스토그램 확대" : "골든크로스", bullish: true, score: s });
    } else if (macdVal < sigVal) {
        const expanding = histCurr < histPrev && histPrev < histPp;
        const s = expanding ? -2 : -1;
        score += s;
        reasons.push({ source: "MACD", description: expanding ? "데드크로스 + 히스토그램 확대" : "데드크로스", bullish: false, score: s });
    }

    // ── 6. 볼린저밴드 ────────────────────────────────────────────────────
    const bbUpper = bb.upper[n];
    const bbLower = bb.lower[n];
    const bbWidth = bb.width[n];

    if (bbUpper > 0 && bbLower > 0) {
        if (price <= bbLower) {
            const s = bbWidth > 3 ? 2 : 1;
            score += s;
            reasons.push({ source: "볼린저밴드", description: `하단 이탈 (밴드폭 ${bbWidth.toFixed(1)}%)`, bullish: true, score: s });
        } else if (price >= bbUpper) {
            const s = bbWidth > 3 ? -2 : -1;
            score += s;
            reasons.push({ source: "볼린저밴드", description: `상단 이탈 (밴드폭 ${bbWidth.toFixed(1)}%)`, bullish: false, score: s });
        }
    }

    // ── 7. EMA 배열 (ADX 보정) ────────────────────────────────────────────
    const e20  = ema20[n];
    const e50  = ema50[n];
    const e200 = ema200[n];
    const adxVal   = adx.adx[n];
    const plusDI   = adx.plusDI[n];
    const minusDI  = adx.minusDI[n];
    const hasTrend = adxVal > 22; // ADX > 22: 명확한 추세

    if (e20 > 0 && e50 > 0 && e200 > 0) {
        if (e20 > e50 && e50 > e200) {
            const s = hasTrend ? 2 : 1;
            score += s;
            reasons.push({ source: "EMA", description: `정배열 (ADX ${adxVal.toFixed(0)}) 상승추세`, bullish: true, score: s });
        } else if (e20 < e50 && e50 < e200) {
            const s = hasTrend ? -2 : -1;
            score += s;
            reasons.push({ source: "EMA", description: `역배열 (ADX ${adxVal.toFixed(0)}) 하락추세`, bullish: false, score: s });
        }

        // EMA200 위치 (장기 추세 컨텍스트)
        if (price > e200 && price < e200 * 1.02) {
            score += 1;
            reasons.push({ source: "EMA200", description: "EMA200 직상 지지 영역", bullish: true, score: 1 });
        } else if (price < e200 && price > e200 * 0.98) {
            score -= 1;
            reasons.push({ source: "EMA200", description: "EMA200 직하 저항 영역", bullish: false, score: -1 });
        }
    }

    // ADX +DI/-DI 방향 추가 반영
    if (adxVal > 25 && plusDI > 0 && minusDI > 0) {
        if (plusDI > minusDI * 1.4) {
            score += 1;
            reasons.push({ source: "ADX", description: `ADX ${adxVal.toFixed(0)} +DI 우세 (강한 상승압력)`, bullish: true, score: 1 });
        } else if (minusDI > plusDI * 1.4) {
            score -= 1;
            reasons.push({ source: "ADX", description: `ADX ${adxVal.toFixed(0)} -DI 우세 (강한 하락압력)`, bullish: false, score: -1 });
        }
    }

    // ── 8. 이치모쿠 구름 ────────────────────────────────────────────────
    const spanA    = ichimoku.senkouA[n];
    const spanB    = ichimoku.senkouB[n];
    const tenkan   = ichimoku.tenkan[n];
    const kijun    = ichimoku.kijun[n];
    const tenkanP  = ichimoku.tenkan[n - 1] ?? tenkan;
    const kijunP   = ichimoku.kijun[n - 1] ?? kijun;

    if (spanA > 0 && spanB > 0) {
        const cloudTop = Math.max(spanA, spanB);
        const cloudBot = Math.min(spanA, spanB);

        if (price > cloudTop) {
            score += 2;
            reasons.push({ source: "이치모쿠", description: "구름 위 (강세 영역)", bullish: true, score: 2 });
        } else if (price < cloudBot) {
            score -= 2;
            reasons.push({ source: "이치모쿠", description: "구름 아래 (약세 영역)", bullish: false, score: -2 });
        }
    }

    // 전환선/기준선 교차 (TK 크로스)
    if (tenkan > 0 && kijun > 0) {
        if (tenkanP < kijunP && tenkan >= kijun) {
            score += 1;
            reasons.push({ source: "이치모쿠", description: "전환선 기준선 골든크로스", bullish: true, score: 1 });
        } else if (tenkanP > kijunP && tenkan <= kijun) {
            score -= 1;
            reasons.push({ source: "이치모쿠", description: "전환선 기준선 데드크로스", bullish: false, score: -1 });
        }
    }

    // ── 9. OBV ───────────────────────────────────────────────────────────
    if (obv.length >= 25) {
        const obvWindow  = 20;
        const obvRecent  = obv.slice(-obvWindow);
        const obvEarly   = obvRecent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const obvLate    = obvRecent.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const priceEarly = closes[closes.length - obvWindow];
        const priceChange = price - priceEarly;

        // 강세 다이버전스: OBV 상승, 가격 하락
        if (obvLate > obvEarly * 1.01 && priceChange < -atr) {
            score += 1;
            reasons.push({ source: "OBV", description: "강세 다이버전스 (매집 신호)", bullish: true, score: 1 });
        }
        // 약세 다이버전스: OBV 하락, 가격 상승
        else if (obvLate < obvEarly * 0.99 && priceChange > atr) {
            score -= 1;
            reasons.push({ source: "OBV", description: "약세 다이버전스 (배분 신호)", bullish: false, score: -1 });
        }
        // 추세 확인
        else if (Math.abs(priceChange) > atr * 1.5) {
            const s = priceChange > 0 && obvLate >= obvEarly ? 1 : priceChange < 0 && obvLate <= obvEarly ? -1 : 0;
            if (s !== 0) {
                score += s;
                reasons.push({ source: "OBV", description: priceChange > 0 ? "거래량 상승 확인" : "거래량 하락 확인", bullish: s > 0, score: s });
            }
        }
    }

    // ── 10. 추세선 ────────────────────────────────────────────────────────
    const activeLines = trendLines.filter(l => !l.broken);
    const upLines     = activeLines.filter(l => l.type === "uptrend");
    const downLines   = activeLines.filter(l => l.type === "downtrend");

    if (upLines.length) {
        const best = upLines[0];
        const lp   = best.priceAt(n);
        if (Math.abs(price - lp) < atr * 0.5) {
            score += 2;
            reasons.push({ source: "추세선", description: `상승 추세선 터치 (강도 ${best.strength})`, bullish: true, score: 2 });
        } else if (price > lp) {
            score += 1;
            reasons.push({ source: "추세선", description: `상승 추세선 위 (강도 ${best.strength})`, bullish: true, score: 1 });
        }
    }

    if (downLines.length) {
        const best = downLines[0];
        const lp   = best.priceAt(n);
        if (Math.abs(price - lp) < atr * 0.5) {
            score -= 2;
            reasons.push({ source: "추세선", description: `하락 추세선 터치 (강도 ${best.strength})`, bullish: false, score: -2 });
        } else if (price < lp) {
            score -= 1;
            reasons.push({ source: "추세선", description: `하락 추세선 아래 (강도 ${best.strength})`, bullish: false, score: -1 });
        }
    }

    // ── 11. 지지/저항 ────────────────────────────────────────────────────
    const support    = nearestSupport(srLevels, price);
    const resistance = nearestResistance(srLevels, price);

    if (support) {
        const gap = (price - support.price) / atr;
        if (gap < 0.5) {
            const s = Math.min(2, Math.max(1, Math.floor(support.strength / 35)));
            score += s;
            reasons.push({ source: "지지선", description: `강한 지지선 근접 (${support.touches}회 터치)`, bullish: true, score: s });
        }
    }
    if (resistance) {
        const gap = (resistance.price - price) / atr;
        if (gap < 0.5) {
            const s = Math.min(2, Math.max(1, Math.floor(resistance.strength / 35)));
            score -= s;
            reasons.push({ source: "저항선", description: `강한 저항선 근접 (${resistance.touches}회 터치)`, bullish: false, score: -s });
        }
    }

    // ── 12. 피보나치 핵심 레벨 ──────────────────────────────────────────
    if (fibonacci) {
        for (const level of fibonacci.levels.filter(l => l.isKeyLevel)) {
            if (Math.abs(price - level.price) < atr * 0.5) {
                // 피보 레벨에서 방향성: 가격 위치와 현재 점수 방향 일치 여부
                const isBullContext = score >= 0;
                const s = isBullContext ? 2 : -2;
                score += s;
                reasons.push({ source: "피보나치", description: `핵심 레벨 Fib ${level.label} 근접`, bullish: isBullContext, score: s });
                break;
            }
        }
    }

    // ── 결론 ─────────────────────────────────────────────────────────────
    const clamped   = Math.max(-10, Math.min(10, score));
    const direction = clamped >= 3 ? "long" : clamped <= -3 ? "short" : "neutral";

    // 신뢰도: 점수 크기 + 일관성 있는 근거 수
    const consistent = reasons.filter(r =>
        (direction === "long"  &&  r.bullish) ||
        (direction === "short" && !r.bullish)
    ).length;
    const confidence = direction === "neutral"
        ? Math.min(55, 25 + Math.abs(clamped) * 5)
        : Math.min(95, Math.abs(clamped) * 5 + consistent * 3 + 10);

    // 진입/손절/목표가
    let entry: number, stopLoss: number, tp1: number, tp2: number;

    if (direction === "long") {
        entry = price;
        const slCandidate = support
            ? Math.min(support.price - atr * 0.25, entry - atr * 1.5)
            : entry - atr * 1.5;
        stopLoss = Math.max(entry - atr * 3.5, slCandidate);
        const risk = entry - stopLoss;
        tp1 = resistance
            ? Math.min(resistance.price * 0.999, entry + risk * 2)
            : entry + risk * 2;
        tp2 = entry + risk * 3.5;
    } else if (direction === "short") {
        entry = price;
        const slCandidate = resistance
            ? Math.max(resistance.price + atr * 0.25, entry + atr * 1.5)
            : entry + atr * 1.5;
        stopLoss = Math.min(entry + atr * 3.5, slCandidate);
        const risk = stopLoss - entry;
        tp1 = support
            ? Math.max(support.price * 1.001, entry - risk * 2)
            : entry - risk * 2;
        tp2 = entry - risk * 3.5;
    } else {
        entry    = price;
        stopLoss = price - atr * 1.5;
        tp1      = price + atr * 2;
        tp2      = price + atr * 3.5;
    }

    const risk   = Math.abs(entry - stopLoss);
    const reward = Math.abs(tp1 - entry);

    return {
        direction,
        score:        clamped,
        confidence,
        entry,
        stopLoss,
        takeProfit1:  tp1,
        takeProfit2:  tp2,
        riskReward:   risk > 0 ? reward / risk : 0,
        reasons,
    };
}
