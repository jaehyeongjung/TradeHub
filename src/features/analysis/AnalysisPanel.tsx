"use client";

import type {
    TradeSetup, TrendLine, SRLevel, TrendLineSetup,
    MarketStructure, CandlestickPattern,
} from "@/shared/lib/technical-analysis/types";

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
}

function fmt(n: number): string {
    return n >= 1000
        ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : n.toFixed(4);
}

function ScoreMeter({ score }: { score: number }) {
    const pct  = Math.min(100, Math.max(0, ((score + 10) / 20) * 100));
    const fill = score >= 3 ? "bg-emerald-500" : score <= -3 ? "bg-red-500" : "bg-amber-400";

    return (
        <div className="space-y-1.5">
            <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between">
                <span className="text-[10px] opacity-50">숏 −10</span>
                <span className="text-[10px] font-semibold tabular-nums">{score > 0 ? `+${score}` : score} / 10</span>
                <span className="text-[10px] opacity-50">롱 +10</span>
            </div>
        </div>
    );
}

function LeverageCard({
    lev, entry, stopLoss, takeProfit1, isLong,
}: { lev: number; entry: number; stopLoss: number; takeProfit1: number; isLong: boolean }) {
    const stopDist = Math.abs(entry - stopLoss) / entry * 100;
    const tp1Dist  = Math.abs(takeProfit1 - entry) / entry * 100;
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
                    {riskOk ? "적정" : "고위험"}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="flex justify-between items-baseline col-span-2">
                    <span className="text-[10px] text-text-tertiary">손절 시 자본 손실</span>
                    <span className="text-[11px] font-semibold tabular-nums text-red-400">−{capitalRisk.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-baseline col-span-2">
                    <span className="text-[10px] text-text-tertiary">목표 달성 시 수익</span>
                    <span className="text-[11px] font-semibold tabular-nums text-emerald-400">+{capitalGain.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-baseline col-span-2">
                    <span className="text-[10px] text-text-tertiary">청산가</span>
                    <span className="text-[11px] font-semibold tabular-nums text-text-secondary">{fmt(liqPrice)}</span>
                </div>
            </div>
        </div>
    );
}

export function AnalysisPanel({
    setup, trendLines, srLevels, trendLineSetups,
    marketStructure, candlestickPatterns, currentPrice,
    leverageRange, tierLabel, tierSub,
}: Props) {
    const isLong  = setup.direction === "long";
    const isShort = setup.direction === "short";

    const dirLabel  = isLong ? "LONG" : isShort ? "SHORT" : "중립";
    const subLabel  = isLong ? "매수 시그널" : isShort ? "매도 시그널" : "방향성 불분명";
    const heroBg    = isLong ? "bg-emerald-500/10" : isShort ? "bg-red-500/10"  : "bg-amber-500/10";
    const heroColor = isLong ? "text-emerald-400"  : isShort ? "text-red-400"   : "text-amber-400";
    const rrColor   = setup.riskReward >= 2 ? "text-emerald-400" : setup.riskReward >= 1 ? "text-amber-400" : "text-red-400";

    const activeTrends  = trendLines.filter(l => !l.broken);
    const nearbyLevels  = srLevels
        .filter(l => Math.abs(l.price - currentPrice) / currentPrice < 0.03)
        .slice(0, 4);

    // 시장 구조 표시
    const trendLabel = marketStructure.trend === "uptrend" ? "상승 구조"
        : marketStructure.trend === "downtrend" ? "하락 구조" : "횡보";
    const trendColor = marketStructure.trend === "uptrend" ? "text-emerald-400"
        : marketStructure.trend === "downtrend" ? "text-red-400" : "text-amber-400";

    // 최근 캔들 패턴 (강한 것 우선)
    const topPatterns = candlestickPatterns.slice(0, 3);

    return (
        <div className="rounded-xl border border-border-subtle bg-surface-card divide-y divide-border-subtle overflow-hidden">

            {/* ── Hero ─────────────────────────────────────── */}
            <div className={`px-5 py-5 ${heroBg}`}>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className={`text-[11px] font-medium mb-1 ${heroColor} opacity-60`}>시그널</p>
                        <p className={`text-3xl font-black tracking-tight leading-none ${heroColor}`}>{dirLabel}</p>
                        <p className={`text-xs mt-1.5 ${heroColor} opacity-60`}>{subLabel}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-text-muted mb-1">신뢰도</p>
                        <p className={`text-3xl font-black tracking-tight leading-none tabular-nums ${heroColor}`}>{setup.confidence}%</p>
                    </div>
                </div>
                <ScoreMeter score={setup.score} />
            </div>

            {/* ── 시장 구조 ────────────────────────────────── */}
            <div className="px-4 py-3.5">
                <p className="text-[11px] text-text-muted mb-2.5">시장 구조</p>
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
                        <span className="text-[10px] text-text-muted tabular-nums">강도 {marketStructure.trendStrength}</span>
                    </div>
                </div>
            </div>

            {/* ── 캔들 패턴 ────────────────────────────────── */}
            {topPatterns.length > 0 && (
                <div className="px-4 py-3.5">
                    <p className="text-[11px] text-text-muted mb-2.5">캔들 패턴</p>
                    <div className="flex flex-wrap gap-1.5">
                        {topPatterns.map((pat, i) => {
                            const cls = pat.type === "bullish"
                                ? "bg-emerald-500/12 text-emerald-400"
                                : pat.type === "bearish"
                                ? "bg-red-500/12 text-red-400"
                                : "bg-amber-500/12 text-amber-400";
                            return (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}>
                                    {pat.koreanName}
                                    <span className="ml-1">{"★".repeat(pat.strength)}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 레버리지 분석 ─────────────────────────────── */}
            <div className="px-4 py-4">
                <div className="flex items-baseline justify-between mb-3">
                    <p className="text-[11px] text-text-muted">레버리지 리스크</p>
                    <span className="text-[10px] text-text-tertiary">{tierLabel} · {tierSub} · {leverageRange[0]}x~{leverageRange[1]}x</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <LeverageCard
                        lev={leverageRange[0]}
                        entry={setup.entry}
                        stopLoss={setup.stopLoss}
                        takeProfit1={setup.takeProfit1}
                        isLong={setup.direction === "long"}
                    />
                    <LeverageCard
                        lev={leverageRange[1]}
                        entry={setup.entry}
                        stopLoss={setup.stopLoss}
                        takeProfit1={setup.takeProfit1}
                        isLong={setup.direction === "long"}
                    />
                </div>
            </div>

            {/* ── 트레이드 셋업 ─────────────────────────────── */}
            <div className="px-4 py-4">
                <p className="text-[11px] text-text-muted mb-3">트레이드 셋업</p>
                <div className="space-y-2.5">
                    {[
                        { label: "진입가", value: fmt(setup.entry),       cls: "text-blue-400"    },
                        { label: "손절가", value: fmt(setup.stopLoss),    cls: "text-red-400"     },
                        { label: "목표 1", value: fmt(setup.takeProfit1), cls: "text-emerald-400" },
                        { label: "목표 2", value: fmt(setup.takeProfit2), cls: "text-emerald-400" },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="flex justify-between items-baseline">
                            <span className="text-xs text-text-tertiary">{label}</span>
                            <span className={`text-sm font-semibold tabular-nums ${cls}`}>{value}</span>
                        </div>
                    ))}
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-border-subtle">
                        <span className="text-xs text-text-tertiary">손익비</span>
                        <span className={`text-sm font-bold tabular-nums ${rrColor}`}>1 : {setup.riskReward.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ── 추세선 타점 ──────────────────────────────── */}
            {trendLineSetups.length > 0 && (
                <div className="px-4 py-4">
                    <p className="text-[11px] text-text-muted mb-3">추세선 타점</p>
                    <div className="space-y-3">
                        {trendLineSetups.map(ts => {
                            const isL    = ts.setupType === "pullback_long";
                            const accent = isL ? "text-emerald-400" : "text-red-400";
                            const bgCls  = isL ? "bg-emerald-500/8" : "bg-red-500/8";
                            return (
                                <div key={ts.id} className={`rounded-lg px-3 py-2.5 ${bgCls}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-semibold ${accent}`}>{ts.label}</span>
                                        <span className="text-[10px] text-text-muted">{ts.entryOffset}캔들 후 · 신뢰도 {ts.confidence}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {[
                                            { label: "진입", value: fmt(ts.entryPrice),  cls: "text-blue-400"    },
                                            { label: "손절", value: fmt(ts.stopLoss),    cls: "text-red-400"     },
                                            { label: "목표1", value: fmt(ts.takeProfit1), cls: "text-emerald-400" },
                                            { label: "손익비", value: `1 : ${ts.riskReward.toFixed(2)}`, cls: ts.riskReward >= 2 ? "text-emerald-400" : "text-amber-400" },
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
                    <p className="text-[11px] text-text-muted mb-3">감지된 추세선 {activeTrends.length}개</p>
                    <div className="space-y-2">
                        {activeTrends.slice(0, 3).map(line => (
                            <div key={line.id} className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${line.type === "uptrend" ? "text-emerald-400" : "text-red-400"}`}>
                                    {line.type === "uptrend" ? "상승" : "하락"} 추세선
                                </span>
                                <span className="text-[11px] tabular-nums text-text-muted">강도 {line.strength} · {line.touches}터치</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 주요 레벨 ─────────────────────────────────── */}
            {nearbyLevels.length > 0 && (
                <div className="px-4 py-4">
                    <p className="text-[11px] text-text-muted mb-3">현재가 ±3% 주요 레벨</p>
                    <div className="space-y-2">
                        {nearbyLevels.map((level, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${level.type === "support" ? "text-emerald-400" : "text-red-400"}`}>
                                    {level.type === "support" ? "지지" : "저항"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs tabular-nums font-medium ${level.type === "support" ? "text-emerald-400" : "text-red-400"}`}>
                                        {fmt(level.price)}
                                    </span>
                                    <span className="text-[10px] text-text-muted">{level.touches}회</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 분석 근거 ──────────────────────────────────── */}
            <div className="px-4 py-4">
                <p className="text-[11px] text-text-muted mb-3">분석 근거</p>
                <div className="space-y-2.5">
                    {setup.reasons.map((r, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.bullish ? "bg-emerald-400" : "bg-red-400"}`} />
                            <div className="flex-1 min-w-0 leading-snug">
                                <span className="text-[11px] font-semibold text-text-secondary">{r.source}</span>
                                <span className="text-[11px] text-text-tertiary ml-1">{r.description}</span>
                            </div>
                            <span className={`text-[11px] tabular-nums font-semibold flex-shrink-0 ${r.score > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {r.score > 0 ? `+${r.score}` : r.score}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
