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
import type { Locale } from "../../types/locale.types";

type D = (ko: string, en: string) => string;

export function generateSignal(
    candles: Candle[],
    trendLines: TrendLine[],
    srLevels: SRLevel[],
    fibonacci: FibRetracement | null,
    marketStructure: MarketStructure,
    candlestickPatterns: CandlestickPattern[],
    locale: Locale = "ko",
): TradeSetup {
    const closes = candles.map(c => c.close);
    const n      = candles.length - 1;
    const price  = closes[n];
    const atr    = avgATR(candles);

    const d: D = (ko, en) => locale === "en" ? en : ko;
    const src = {
        mktStruct:  d("시장구조",      "Mkt Structure"),
        bos:        "BOS",
        choch:      "CHoCH",
        candle:     d("캔들패턴",      "Candle Pattern"),
        rsi:        "RSI",
        rsiDiv:     d("RSI 다이버전스","RSI Divergence"),
        stoch:      "StochRSI",
        macd:       "MACD",
        bb:         d("볼린저밴드",    "Bollinger Bands"),
        ema:        "EMA",
        ema200:     "EMA200",
        adx:        "ADX",
        ichimoku:   d("이치모쿠",      "Ichimoku"),
        obv:        "OBV",
        trendline:  d("추세선",        "Trend Line"),
        support:    d("지지선",        "Support"),
        resistance: d("저항선",        "Resistance"),
        fib:        d("피보나치",      "Fibonacci"),
    };

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

    // ── 1. 시장 구조 ─────────────────────────────────────────────────────
    const { trend, trendStrength, bos, choch } = marketStructure;

    if (trend === "uptrend") {
        const s = trendStrength >= 75 ? 3 : 2;
        score += s;
        reasons.push({ source: src.mktStruct, description: d(`상승 구조 HH/HL (강도 ${trendStrength})`, `Uptrend HH/HL (Str ${trendStrength})`), bullish: true, score: s });
    } else if (trend === "downtrend") {
        const s = trendStrength >= 75 ? -3 : -2;
        score += s;
        reasons.push({ source: src.mktStruct, description: d(`하락 구조 LH/LL (강도 ${trendStrength})`, `Downtrend LH/LL (Str ${trendStrength})`), bullish: false, score: s });
    }

    if (bos) {
        const s = bos.direction === "bullish" ? 2 : -2;
        score += s;
        reasons.push({ source: src.bos, description: d(
            `구조 돌파 ${bos.direction === "bullish" ? "상승" : "하락"} (추세 지속)`,
            `Structure Break ${bos.direction === "bullish" ? "Bullish" : "Bearish"} (Trend Cont.)`
        ), bullish: s > 0, score: s });
    }

    if (choch) {
        const s = choch.direction === "bullish" ? 1 : -1;
        score += s;
        reasons.push({ source: src.choch, description: d(
            `추세 전환 신호 ${choch.direction === "bullish" ? "상승 전환" : "하락 전환"}`,
            `Trend Reversal ${choch.direction === "bullish" ? "Bullish" : "Bearish"}`
        ), bullish: s > 0, score: s });
    }

    // ── 2. 캔들스틱 패턴 ─────────────────────────────────────────────────
    const recentPatterns = candlestickPatterns.filter(p => p.index >= n - 2 && p.type !== "neutral");

    for (const pat of recentPatterns.slice(0, 2)) {
        const s = pat.type === "bullish" ? pat.strength : -(pat.strength as number);
        score += s;
        const patName = locale === "en" ? pat.name : pat.koreanName;
        reasons.push({ source: src.candle, description: d(
            `${pat.koreanName} (강도 ${pat.strength})`,
            `${patName} (Str ${pat.strength})`
        ), bullish: pat.type === "bullish", score: s });
    }

    // ── 3. RSI ────────────────────────────────────────────────────────────
    const rsiVal = rsi[n];

    if (rsiVal > 0) {
        if (rsiVal < 25) {
            score += 3;
            reasons.push({ source: src.rsi, description: d(`${rsiVal.toFixed(0)} 극단 과매도`, `${rsiVal.toFixed(0)} Extreme Oversold`), bullish: true, score: 3 });
        } else if (rsiVal < 35) {
            score += 2;
            reasons.push({ source: src.rsi, description: d(`${rsiVal.toFixed(0)} 과매도`, `${rsiVal.toFixed(0)} Oversold`), bullish: true, score: 2 });
        } else if (rsiVal > 75) {
            score -= 3;
            reasons.push({ source: src.rsi, description: d(`${rsiVal.toFixed(0)} 극단 과매수`, `${rsiVal.toFixed(0)} Extreme Overbought`), bullish: false, score: -3 });
        } else if (rsiVal > 65) {
            score -= 2;
            reasons.push({ source: src.rsi, description: d(`${rsiVal.toFixed(0)} 과매수`, `${rsiVal.toFixed(0)} Overbought`), bullish: false, score: -2 });
        }

        if (n >= 14) {
            const w = 14;
            const priceSlice = closes.slice(n - w, n);
            const rsiSlice   = rsi.slice(n - w, n).filter(v => v > 0);

            if (rsiSlice.length >= 5) {
                const pMin = Math.min(...priceSlice);
                const rMin = Math.min(...rsiSlice);
                if (price <= pMin * 1.005 && rsiVal > rMin * 1.08) {
                    score += 2;
                    reasons.push({ source: src.rsiDiv, description: d("강세 다이버전스 (가격↓ RSI↑)", "Bullish Divergence (Price↓ RSI↑)"), bullish: true, score: 2 });
                }
                const pMax = Math.max(...priceSlice);
                const rMax = Math.max(...rsiSlice);
                if (price >= pMax * 0.995 && rsiVal < rMax * 0.92) {
                    score -= 2;
                    reasons.push({ source: src.rsiDiv, description: d("약세 다이버전스 (가격↑ RSI↓)", "Bearish Divergence (Price↑ RSI↓)"), bullish: false, score: -2 });
                }
            }
        }
    }

    // ── 4. Stochastic RSI ─────────────────────────────────────────────────
    const stK     = stoch.k[n];
    const stD     = stoch.d[n];
    const stKPrev = stoch.k[n - 1] ?? stK;

    if (stK > 0 && stD > 0) {
        if (stK < 20 && stD < 20) {
            score += 2;
            reasons.push({ source: src.stoch, description: d(`K${stK.toFixed(0)} 과매도 구간`, `K${stK.toFixed(0)} Oversold Zone`), bullish: true, score: 2 });
        } else if (stK > 80 && stD > 80) {
            score -= 2;
            reasons.push({ source: src.stoch, description: d(`K${stK.toFixed(0)} 과매수 구간`, `K${stK.toFixed(0)} Overbought Zone`), bullish: false, score: -2 });
        }
        if (stKPrev < stD && stK >= stD && stK < 40) {
            score += 1;
            reasons.push({ source: src.stoch, description: d("과매도권 K 상향 교차", "K Bullish Cross (Oversold)"), bullish: true, score: 1 });
        } else if (stKPrev > stD && stK <= stD && stK > 60) {
            score -= 1;
            reasons.push({ source: src.stoch, description: d("과매수권 K 하향 교차", "K Bearish Cross (Overbought)"), bullish: false, score: -1 });
        }
    }

    // ── 5. MACD ───────────────────────────────────────────────────────────
    const macdVal  = macd.macd[n];
    const sigVal   = macd.signal[n];
    const histCurr = macd.histogram[n];
    const histPrev = macd.histogram[n - 1] ?? 0;
    const histPp   = macd.histogram[n - 2] ?? 0;

    if (macdVal > sigVal) {
        const expanding = histCurr > histPrev && histPrev > histPp;
        const s = expanding ? 2 : 1;
        score += s;
        reasons.push({ source: src.macd, description: d(
            expanding ? "골든크로스 + 히스토그램 확대" : "골든크로스",
            expanding ? "Golden Cross + Expanding Histogram" : "Golden Cross"
        ), bullish: true, score: s });
    } else if (macdVal < sigVal) {
        const expanding = histCurr < histPrev && histPrev < histPp;
        const s = expanding ? -2 : -1;
        score += s;
        reasons.push({ source: src.macd, description: d(
            expanding ? "데드크로스 + 히스토그램 확대" : "데드크로스",
            expanding ? "Death Cross + Expanding Histogram" : "Death Cross"
        ), bullish: false, score: s });
    }

    // ── 6. 볼린저밴드 ─────────────────────────────────────────────────────
    const bbUpper = bb.upper[n];
    const bbLower = bb.lower[n];
    const bbWidth = bb.width[n];

    if (bbUpper > 0 && bbLower > 0) {
        if (price <= bbLower) {
            const s = bbWidth > 3 ? 2 : 1;
            score += s;
            reasons.push({ source: src.bb, description: d(`하단 이탈 (밴드폭 ${bbWidth.toFixed(1)}%)`, `Below Lower Band (Width ${bbWidth.toFixed(1)}%)`), bullish: true, score: s });
        } else if (price >= bbUpper) {
            const s = bbWidth > 3 ? -2 : -1;
            score += s;
            reasons.push({ source: src.bb, description: d(`상단 이탈 (밴드폭 ${bbWidth.toFixed(1)}%)`, `Above Upper Band (Width ${bbWidth.toFixed(1)}%)`), bullish: false, score: s });
        }
    }

    // ── 7. EMA 배열 ───────────────────────────────────────────────────────
    const e20  = ema20[n];
    const e50  = ema50[n];
    const e200 = ema200[n];
    const adxVal   = adx.adx[n];
    const plusDI   = adx.plusDI[n];
    const minusDI  = adx.minusDI[n];
    const hasTrend = adxVal > 22;

    if (e20 > 0 && e50 > 0 && e200 > 0) {
        if (e20 > e50 && e50 > e200) {
            const s = hasTrend ? 2 : 1;
            score += s;
            reasons.push({ source: src.ema, description: d(`정배열 (ADX ${adxVal.toFixed(0)}) 상승추세`, `Bullish Alignment (ADX ${adxVal.toFixed(0)})`), bullish: true, score: s });
        } else if (e20 < e50 && e50 < e200) {
            const s = hasTrend ? -2 : -1;
            score += s;
            reasons.push({ source: src.ema, description: d(`역배열 (ADX ${adxVal.toFixed(0)}) 하락추세`, `Bearish Alignment (ADX ${adxVal.toFixed(0)})`), bullish: false, score: s });
        }

        if (price > e200 && price < e200 * 1.02) {
            score += 1;
            reasons.push({ source: src.ema200, description: d("EMA200 직상 지지 영역", "Just Above EMA200 Support"), bullish: true, score: 1 });
        } else if (price < e200 && price > e200 * 0.98) {
            score -= 1;
            reasons.push({ source: src.ema200, description: d("EMA200 직하 저항 영역", "Just Below EMA200 Resistance"), bullish: false, score: -1 });
        }
    }

    if (adxVal > 25 && plusDI > 0 && minusDI > 0) {
        if (plusDI > minusDI * 1.4) {
            score += 1;
            reasons.push({ source: src.adx, description: d(`ADX ${adxVal.toFixed(0)} +DI 우세 (강한 상승압력)`, `ADX ${adxVal.toFixed(0)} +DI Dominant (Bull Pressure)`), bullish: true, score: 1 });
        } else if (minusDI > plusDI * 1.4) {
            score -= 1;
            reasons.push({ source: src.adx, description: d(`ADX ${adxVal.toFixed(0)} -DI 우세 (강한 하락압력)`, `ADX ${adxVal.toFixed(0)} -DI Dominant (Bear Pressure)`), bullish: false, score: -1 });
        }
    }

    // ── 8. 이치모쿠 ──────────────────────────────────────────────────────
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
            reasons.push({ source: src.ichimoku, description: d("구름 위 (강세 영역)", "Above Cloud (Bullish Zone)"), bullish: true, score: 2 });
        } else if (price < cloudBot) {
            score -= 2;
            reasons.push({ source: src.ichimoku, description: d("구름 아래 (약세 영역)", "Below Cloud (Bearish Zone)"), bullish: false, score: -2 });
        }
    }

    if (tenkan > 0 && kijun > 0) {
        if (tenkanP < kijunP && tenkan >= kijun) {
            score += 1;
            reasons.push({ source: src.ichimoku, description: d("전환선 기준선 골든크로스", "TK Golden Cross"), bullish: true, score: 1 });
        } else if (tenkanP > kijunP && tenkan <= kijun) {
            score -= 1;
            reasons.push({ source: src.ichimoku, description: d("전환선 기준선 데드크로스", "TK Death Cross"), bullish: false, score: -1 });
        }
    }

    // ── 9. OBV ────────────────────────────────────────────────────────────
    if (obv.length >= 25) {
        const obvWindow  = 20;
        const obvRecent  = obv.slice(-obvWindow);
        const obvEarly   = obvRecent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const obvLate    = obvRecent.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const priceEarly = closes[closes.length - obvWindow];
        const priceChange = price - priceEarly;

        if (obvLate > obvEarly * 1.01 && priceChange < -atr) {
            score += 1;
            reasons.push({ source: src.obv, description: d("강세 다이버전스 (매집 신호)", "Bullish Divergence (Accumulation)"), bullish: true, score: 1 });
        } else if (obvLate < obvEarly * 0.99 && priceChange > atr) {
            score -= 1;
            reasons.push({ source: src.obv, description: d("약세 다이버전스 (배분 신호)", "Bearish Divergence (Distribution)"), bullish: false, score: -1 });
        } else if (Math.abs(priceChange) > atr * 1.5) {
            const s = priceChange > 0 && obvLate >= obvEarly ? 1 : priceChange < 0 && obvLate <= obvEarly ? -1 : 0;
            if (s !== 0) {
                score += s;
                reasons.push({ source: src.obv, description: d(
                    priceChange > 0 ? "거래량 상승 확인" : "거래량 하락 확인",
                    priceChange > 0 ? "Volume Confirmed Rally" : "Volume Confirmed Drop"
                ), bullish: s > 0, score: s });
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
            reasons.push({ source: src.trendline, description: d(`상승 추세선 터치 (강도 ${best.strength})`, `Uptrend Touch (Str ${best.strength})`), bullish: true, score: 2 });
        } else if (price > lp) {
            score += 1;
            reasons.push({ source: src.trendline, description: d(`상승 추세선 위 (강도 ${best.strength})`, `Above Uptrend (Str ${best.strength})`), bullish: true, score: 1 });
        }
    }

    if (downLines.length) {
        const best = downLines[0];
        const lp   = best.priceAt(n);
        if (Math.abs(price - lp) < atr * 0.5) {
            score -= 2;
            reasons.push({ source: src.trendline, description: d(`하락 추세선 터치 (강도 ${best.strength})`, `Downtrend Touch (Str ${best.strength})`), bullish: false, score: -2 });
        } else if (price < lp) {
            score -= 1;
            reasons.push({ source: src.trendline, description: d(`하락 추세선 아래 (강도 ${best.strength})`, `Below Downtrend (Str ${best.strength})`), bullish: false, score: -1 });
        }
    }

    // ── 11. 지지/저항 ─────────────────────────────────────────────────────
    const support    = nearestSupport(srLevels, price);
    const resistance = nearestResistance(srLevels, price);

    if (support) {
        const gap = (price - support.price) / atr;
        if (gap < 0.5) {
            const s = Math.min(2, Math.max(1, Math.floor(support.strength / 35)));
            score += s;
            reasons.push({ source: src.support, description: d(`강한 지지선 근접 (${support.touches}회 터치)`, `Near Strong Support (${support.touches} touches)`), bullish: true, score: s });
        }
    }
    if (resistance) {
        const gap = (resistance.price - price) / atr;
        if (gap < 0.5) {
            const s = Math.min(2, Math.max(1, Math.floor(resistance.strength / 35)));
            score -= s;
            reasons.push({ source: src.resistance, description: d(`강한 저항선 근접 (${resistance.touches}회 터치)`, `Near Strong Resistance (${resistance.touches} touches)`), bullish: false, score: -s });
        }
    }

    // ── 12. 피보나치 ──────────────────────────────────────────────────────
    if (fibonacci) {
        for (const level of fibonacci.levels.filter(l => l.isKeyLevel)) {
            if (Math.abs(price - level.price) < atr * 0.5) {
                const isBullContext = score >= 0;
                const s = isBullContext ? 2 : -2;
                score += s;
                reasons.push({ source: src.fib, description: d(`핵심 레벨 Fib ${level.label} 근접`, `Near Key Fib ${level.label}`), bullish: isBullContext, score: s });
                break;
            }
        }
    }

    // ── 결론 ─────────────────────────────────────────────────────────────
    const clamped   = Math.max(-10, Math.min(10, score));
    const direction = clamped >= 3 ? "long" : clamped <= -3 ? "short" : "neutral";

    const consistent = reasons.filter(r =>
        (direction === "long"  &&  r.bullish) ||
        (direction === "short" && !r.bullish)
    ).length;
    const confidence = direction === "neutral"
        ? Math.min(55, 25 + Math.abs(clamped) * 5)
        : Math.min(95, Math.abs(clamped) * 5 + consistent * 3 + 10);

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
