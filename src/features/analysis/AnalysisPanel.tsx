"use client";

import type {
    TradeSetup, TrendLine, SRLevel, TrendLineSetup,
    MarketStructure, CandlestickPattern,
} from "@/shared/lib/technical-analysis/types";
import type { Locale } from "@/shared/types/locale.types";

type Props = {
    setup: TradeSetup
    trendLines: TrendLine[]
    srLevels: SRLevel[]
    trendLineSetups: TrendLineSetup[]
    marketStructure: MarketStructure
    candlestickPatterns: CandlestickPattern[]
    currentPrice: number
    leverageRange: [number, number]
    tierLabel: string
    tierSub: string
    locale: Locale
}

const PANEL_UI = {
    ko: {
        signal: "시그널",
        neutral: "중립",
        buySignal: "매수 시그널",
        sellSignal: "매도 시그널",
        unclear: "방향성 불분명",
        confidence: "신뢰도",
        shortLabel: "숏 −10",
        longLabel: "롱 +10",
        marketStructure: "시장 구조",
        uptrend: "상승 구조",
        downtrend: "하락 구조",
        ranging: "횡보",
        strength: "강도",
        candlePatterns: "캔들 패턴",
        leverageRisk: "레버리지 리스크",
        ok: "적정",
        highRisk: "고위험",
        capitalLoss: "손절 시 자본 손실",
        capitalGain: "목표 달성 시 수익",
        liqPrice: "청산가",
        tradeSetup: "트레이드 셋업",
        entry: "진입가",
        stopLoss: "손절가",
        tp1: "목표 1",
        tp2: "목표 2",
        rr: "손익비",
        trendSetups: "추세선 타점",
        candlesLater: (n: number) => `${n}캔들 후`,
        confidenceLabel: (n: number) => `신뢰도 ${n}%`,
        entryShort: "진입",
        stopShort: "손절",
        tp1Short: "목표1",
        rrShort: "손익비",
        trendLines: (n: number) => `감지된 추세선 ${n}개`,
        uptrendLine: "상승 추세선",
        downtrendLine: "하락 추세선",
        touches: (n: number) => `${n}터치`,
        nearbyLevels: "현재가 ±3% 주요 레벨",
        support: "지지",
        resistance: "저항",
        hits: (n: number) => `${n}회`,
        reasons: "분석 근거",
    },
    en: {
        signal: "Signal",
        neutral: "NEUTRAL",
        buySignal: "Buy Signal",
        sellSignal: "Sell Signal",
        unclear: "No Clear Direction",
        confidence: "Confidence",
        shortLabel: "Short −10",
        longLabel: "Long +10",
        marketStructure: "Market Structure",
        uptrend: "Uptrend",
        downtrend: "Downtrend",
        ranging: "Ranging",
        strength: "Strength",
        candlePatterns: "Candle Patterns",
        leverageRisk: "Leverage Risk",
        ok: "OK",
        highRisk: "High Risk",
        capitalLoss: "Capital loss on SL",
        capitalGain: "Profit at TP1",
        liqPrice: "Liquidation Price",
        tradeSetup: "Trade Setup",
        entry: "Entry",
        stopLoss: "Stop Loss",
        tp1: "Take Profit 1",
        tp2: "Take Profit 2",
        rr: "Risk/Reward",
        trendSetups: "Trend Line Setups",
        candlesLater: (n: number) => `${n} candles later`,
        confidenceLabel: (n: number) => `Confidence ${n}%`,
        entryShort: "Entry",
        stopShort: "SL",
        tp1Short: "TP1",
        rrShort: "R/R",
        trendLines: (n: number) => `${n} Trend Line${n > 1 ? "s" : ""} Detected`,
        uptrendLine: "Uptrend Line",
        downtrendLine: "Downtrend Line",
        touches: (n: number) => `${n} touches`,
        nearbyLevels: "Key Levels within ±3%",
        support: "Support",
        resistance: "Resistance",
        hits: (n: number) => `${n} hits`,
        reasons: "Analysis Basis",
    },
} as const;

// 분석 근거 source 이름 영문 매핑
const SOURCE_EN: Record<string, string> = {
    "시장구조": "Mkt Structure",
    "캔들패턴": "Candle Pattern",
    "볼린저밴드": "Bollinger Bands",
    "추세선": "Trend Line",
    "지지선": "Support",
    "저항선": "Resistance",
    "피보나치": "Fibonacci",
    "이치모쿠": "Ichimoku",
    "RSI 다이버전스": "RSI Divergence",
};

function fmt(n: number): string {
    return n >= 1000
        ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : n.toFixed(4);
}

function ScoreMeter({ score, shortLabel, longLabel }: { score: number; shortLabel: string; longLabel: string }) {
    const pct  = Math.min(100, Math.max(0, ((score + 10) / 20) * 100));
    const fill = score >= 3 ? "bg-emerald-500" : score <= -3 ? "bg-red-500" : "bg-amber-400";

    return (
        <div className="space-y-1.5">
            <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between">
                <span className="text-[10px] opacity-50">{shortLabel}</span>
                <span className="text-[10px] font-semibold tabular-nums">{score > 0 ? `+${score}` : score} / 10</span>
                <span className="text-[10px] opacity-50">{longLabel}</span>
            </div>
        </div>
    );
}

type PanelUI = typeof PANEL_UI["ko"] | typeof PANEL_UI["en"];

function LeverageCard({
    lev, entry, stopLoss, takeProfit1, isLong, ui,
}: {
    lev: number; entry: number; stopLoss: number; takeProfit1: number; isLong: boolean;
    ui: PanelUI;
}) {
    const stopDist   = Math.abs(entry - stopLoss) / entry * 100;
    const tp1Dist    = Math.abs(takeProfit1 - entry) / entry * 100;
    const capitalRisk = stopDist * lev;
    const capitalGain = tp1Dist  * lev;
    const liqPrice    = isLong
        ? entry * (1 - 1 / lev)
        : entry * (1 + 1 / lev);
    const riskOk = capitalRisk <= 30;

    return (
        <div className="rounded-lg bg-black/5 dark:bg-white/4 px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums">{lev}x</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    riskOk ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                }`}>
                    {riskOk ? ui.ok : ui.highRisk}
                </span>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-text-tertiary">{ui.capitalLoss}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-red-400">−{capitalRisk.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-text-tertiary">{ui.capitalGain}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-emerald-400">+{capitalGain.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-text-tertiary">{ui.liqPrice}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-text-secondary">{fmt(liqPrice)}</span>
                </div>
            </div>
        </div>
    );
}

export function AnalysisPanel({
    setup, trendLines, srLevels, trendLineSetups,
    marketStructure, candlestickPatterns, currentPrice,
    leverageRange, tierLabel, tierSub, locale,
}: Props) {
    const ui = PANEL_UI[locale];
    const isLong  = setup.direction === "long";
    const isShort = setup.direction === "short";

    const dirLabel  = isLong ? "LONG" : isShort ? "SHORT" : ui.neutral;
    const subLabel  = isLong ? ui.buySignal : isShort ? ui.sellSignal : ui.unclear;
    const heroBg    = isLong ? "bg-emerald-500/10" : isShort ? "bg-red-500/10"  : "bg-amber-500/10";
    const heroColor = isLong ? "text-emerald-400"  : isShort ? "text-red-400"   : "text-amber-400";
    const rrColor   = setup.riskReward >= 2 ? "text-emerald-400" : setup.riskReward >= 1 ? "text-amber-400" : "text-red-400";

    const activeTrends = trendLines.filter(l => !l.broken);
    const nearbyLevels = srLevels
        .filter(l => Math.abs(l.price - currentPrice) / currentPrice < 0.03)
        .slice(0, 4);

    const trendLabel = marketStructure.trend === "uptrend" ? ui.uptrend
        : marketStructure.trend === "downtrend" ? ui.downtrend : ui.ranging;
    const trendColor = marketStructure.trend === "uptrend" ? "text-emerald-400"
        : marketStructure.trend === "downtrend" ? "text-red-400" : "text-amber-400";

    const topPatterns = candlestickPatterns.slice(0, 3);

    const tradeRows = [
        { label: ui.entry,    value: fmt(setup.entry),       cls: "text-blue-400"    },
        { label: ui.stopLoss, value: fmt(setup.stopLoss),    cls: "text-red-400"     },
        { label: ui.tp1,      value: fmt(setup.takeProfit1), cls: "text-emerald-400" },
        { label: ui.tp2,      value: fmt(setup.takeProfit2), cls: "text-emerald-400" },
    ];

    return (
        <div className="rounded-xl border border-border-subtle bg-surface-card divide-y divide-border-subtle overflow-hidden">

            {/* ── Hero ─────────────────────────────────────── */}
            <div className={`px-5 py-5 ${heroBg}`}>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className={`text-[11px] font-medium mb-1 ${heroColor} opacity-60`}>{ui.signal}</p>
                        <p className={`text-3xl font-black tracking-tight leading-none ${heroColor}`}>{dirLabel}</p>
                        <p className={`text-xs mt-1.5 ${heroColor} opacity-60`}>{subLabel}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-text-muted mb-1">{ui.confidence}</p>
                        <p className={`text-3xl font-black tracking-tight leading-none tabular-nums ${heroColor}`}>{setup.confidence}%</p>
                    </div>
                </div>
                <ScoreMeter score={setup.score} shortLabel={ui.shortLabel} longLabel={ui.longLabel} />
            </div>

            {/* ── 시장 구조 ────────────────────────────────── */}
            <div className="px-4 py-3.5">
                <p className="text-[11px] text-text-muted mb-2.5">{ui.marketStructure}</p>
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${trendColor}`}>{trendLabel}</span>
                    <div className="flex items-center gap-2">
                        {marketStructure.bos && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${marketStructure.bos.direction === "bullish" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                BOS {marketStructure.bos.direction === "bullish" ? "↑" : "↓"}
                            </span>
                        )}
                        {marketStructure.choch && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${marketStructure.choch.direction === "bullish" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                CHoCH {marketStructure.choch.direction === "bullish" ? "↑" : "↓"}
                            </span>
                        )}
                        <span className="text-[10px] text-text-muted tabular-nums">{ui.strength} {marketStructure.trendStrength}</span>
                    </div>
                </div>
            </div>

            {/* ── 캔들 패턴 ────────────────────────────────── */}
            {topPatterns.length > 0 && (
                <div className="px-4 py-3.5">
                    <p className="text-[11px] text-text-muted mb-2.5">{ui.candlePatterns}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {topPatterns.map((pat, i) => {
                            const cls = pat.type === "bullish"
                                ? "bg-emerald-500/12 text-emerald-400"
                                : pat.type === "bearish"
                                ? "bg-red-500/12 text-red-400"
                                : "bg-amber-500/12 text-amber-400";
                            const patName = locale === "en" ? pat.name : pat.koreanName;
                            return (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}>
                                    {patName}
                                    <span className="ml-1">{"★".repeat(pat.strength)}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 레버리지 리스크 ───────────────────────────── */}
            <div className="px-4 py-4">
                <div className="flex items-baseline justify-between mb-3">
                    <p className="text-[11px] text-text-muted">{ui.leverageRisk}</p>
                    <span className="text-[10px] text-text-tertiary">{tierLabel} · {tierSub} · {leverageRange[0]}x~{leverageRange[1]}x</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <LeverageCard
                        lev={leverageRange[0]}
                        entry={setup.entry}
                        stopLoss={setup.stopLoss}
                        takeProfit1={setup.takeProfit1}
                        isLong={isLong}
                        ui={ui}
                    />
                    <LeverageCard
                        lev={leverageRange[1]}
                        entry={setup.entry}
                        stopLoss={setup.stopLoss}
                        takeProfit1={setup.takeProfit1}
                        isLong={isLong}
                        ui={ui}
                    />
                </div>
            </div>

            {/* ── 트레이드 셋업 ─────────────────────────────── */}
            <div className="px-4 py-4">
                <p className="text-[11px] text-text-muted mb-3">{ui.tradeSetup}</p>
                <div className="space-y-2.5">
                    {tradeRows.map(({ label, value, cls }) => (
                        <div key={label} className="flex justify-between items-baseline">
                            <span className="text-xs text-text-tertiary">{label}</span>
                            <span className={`text-sm font-semibold tabular-nums ${cls}`}>{value}</span>
                        </div>
                    ))}
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-border-subtle">
                        <span className="text-xs text-text-tertiary">{ui.rr}</span>
                        <span className={`text-sm font-bold tabular-nums ${rrColor}`}>1 : {setup.riskReward.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ── 추세선 타점 ──────────────────────────────── */}
            {trendLineSetups.length > 0 && (
                <div className="px-4 py-4">
                    <p className="text-[11px] text-text-muted mb-3">{ui.trendSetups}</p>
                    <div className="space-y-3">
                        {trendLineSetups.map(ts => {
                            const isL    = ts.setupType === "pullback_long";
                            const accent = isL ? "text-emerald-400" : "text-red-400";
                            const bgCls  = isL ? "bg-emerald-500/8" : "bg-red-500/8";
                            return (
                                <div key={ts.id} className={`rounded-lg px-3 py-2.5 ${bgCls}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-semibold ${accent}`}>{ts.label}</span>
                                        <span className="text-[10px] text-text-muted">
                                            {ui.candlesLater(ts.entryOffset)} · {ui.confidenceLabel(ts.confidence)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {[
                                            { label: ui.entryShort, value: fmt(ts.entryPrice),  cls: "text-blue-400"    },
                                            { label: ui.stopShort,  value: fmt(ts.stopLoss),    cls: "text-red-400"     },
                                            { label: ui.tp1Short,   value: fmt(ts.takeProfit1), cls: "text-emerald-400" },
                                            { label: ui.rrShort,    value: `1 : ${ts.riskReward.toFixed(2)}`, cls: ts.riskReward >= 2 ? "text-emerald-400" : "text-amber-400" },
                                        ].map(({ label, value, cls }) => (
                                            <div key={label} className="flex justify-between items-baseline">
                                                <span className="text-[10px] text-text-tertiary">{label}</span>
                                                <span className={`text-[11px] font-semibold tabular-nums ${cls}`}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 추세선 ───────────────────────────────────── */}
            {activeTrends.length > 0 && (
                <div className="px-4 py-4">
                    <p className="text-[11px] text-text-muted mb-3">{ui.trendLines(activeTrends.length)}</p>
                    <div className="space-y-2">
                        {activeTrends.slice(0, 3).map(line => (
                            <div key={line.id} className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${line.type === "uptrend" ? "text-emerald-400" : "text-red-400"}`}>
                                    {line.type === "uptrend" ? ui.uptrendLine : ui.downtrendLine}
                                </span>
                                <span className="text-[11px] tabular-nums text-text-muted">
                                    {ui.strength} {line.strength} · {ui.touches(line.touches)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 주요 레벨 ─────────────────────────────────── */}
            {nearbyLevels.length > 0 && (
                <div className="px-4 py-4">
                    <p className="text-[11px] text-text-muted mb-3">{ui.nearbyLevels}</p>
                    <div className="space-y-2">
                        {nearbyLevels.map((level, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${level.type === "support" ? "text-emerald-400" : "text-red-400"}`}>
                                    {level.type === "support" ? ui.support : ui.resistance}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs tabular-nums font-medium ${level.type === "support" ? "text-emerald-400" : "text-red-400"}`}>
                                        {fmt(level.price)}
                                    </span>
                                    <span className="text-[10px] text-text-muted">{ui.hits(level.touches)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 분석 근거 ──────────────────────────────────── */}
            <div className="px-4 py-4">
                <p className="text-[11px] text-text-muted mb-3">{ui.reasons}</p>
                <div className="space-y-2.5">
                    {setup.reasons.map((r, i) => {
                        const sourceName = locale === "en"
                            ? (SOURCE_EN[r.source] ?? r.source)
                            : r.source;
                        return (
                            <div key={i} className="flex items-center gap-2.5">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.bullish ? "bg-emerald-400" : "bg-red-400"}`} />
                                <div className="flex-1 min-w-0 leading-snug">
                                    <span className="text-[11px] font-semibold text-text-secondary">{sourceName}</span>
                                    <span className="text-[11px] text-text-tertiary ml-1">{r.description}</span>
                                </div>
                                <span className={`text-[11px] tabular-nums font-semibold flex-shrink-0 ${r.score > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {r.score > 0 ? `+${r.score}` : r.score}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
