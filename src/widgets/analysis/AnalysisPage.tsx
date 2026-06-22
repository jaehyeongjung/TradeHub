"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAnalysis } from "@/features/analysis/useAnalysis";
import { AnalysisPanel } from "@/features/analysis/AnalysisPanel";
import { SymbolSelector } from "@/shared/ui/SymbolSelector";
import { SUPPORTED_SYMBOLS, SYMBOL_NAMES } from "@/shared/constants/sim-trading.constants";
import { useTheme } from "@/shared/hooks/useTheme";
import type { Interval } from "@/shared/types/binance.types";
import type { Locale } from "@/shared/types/locale.types";

const AnalysisChart = dynamic(
    () => import("@/features/analysis/AnalysisChart").then(m => ({ default: m.AnalysisChart })),
    { ssr: false }
);

type LeverageTier = "high" | "mid" | "low";

const TIER_CONFIG: Record<LeverageTier, {
    ko: { label: string; sub: string };
    en: { label: string; sub: string };
    interval: Interval;
    leverageRange: [number, number];
    color: string;
}> = {
    high: {
        ko: { label: "고배율",  sub: "단기 스캘핑"     },
        en: { label: "High Lev", sub: "Scalping"       },
        interval: "1h", leverageRange: [10, 20], color: "text-red-400",
    },
    mid: {
        ko: { label: "중배율",  sub: "스윙 트레이딩"   },
        en: { label: "Mid Lev",  sub: "Swing Trading"  },
        interval: "4h", leverageRange: [5, 10],  color: "text-amber-400",
    },
    low: {
        ko: { label: "저배율",  sub: "포지션 트레이딩" },
        en: { label: "Low Lev",  sub: "Position Trade" },
        interval: "1d", leverageRange: [3, 5],   color: "text-emerald-400",
    },
};

const TIER_ORDER: LeverageTier[] = ["high", "mid", "low"];
const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_TIER: LeverageTier = "mid";

type ViewTab = "chart" | "analysis";

const UI = {
    ko: {
        chart: "차트", analysis: "분석",
        analyze: "분석하기", analyzing: "분석 중",
        selectSymbol: "종목을 선택하세요",
        selectHint: "인터벌을 선택하면 차트를 불러옵니다",
        resultTitle: "분석 결과",
        resultHint: "분석하기를 눌러\n추세선·지지저항·시그널을 확인하세요",
        pendingTitle: "AI 기술적 분석",
        pendingHint: "분석하기를 눌러 시작",
    },
    en: {
        chart: "Chart", analysis: "Analysis",
        analyze: "Analyze", analyzing: "Analyzing",
        selectSymbol: "Select a symbol",
        selectHint: "Chart will load when interval is selected",
        resultTitle: "Analysis Result",
        resultHint: "Click Analyze to see\ntrend lines, S/R levels & signals",
        pendingTitle: "AI Technical Analysis",
        pendingHint: "Click Analyze to start",
    },
} as const;

const FEATURE_ITEMS = [
    {
        icon: "📈",
        ko: { title: "추세선 자동 감지", desc: "상승·하락 추세선과 미래 30캔들 연장선을 차트에 자동 표시" },
        en: { title: "Auto Trend Lines", desc: "Detect and draw trend lines with 30-candle future extension" },
    },
    {
        icon: "🎯",
        ko: { title: "진입 타점 계산", desc: "진입가·손절가·목표가를 레버리지 배율에 맞게 자동 산출" },
        en: { title: "Entry Point Calc", desc: "Auto-calculate entry, stop-loss & take-profit for your leverage" },
    },
    {
        icon: "🛡",
        ko: { title: "지지·저항 레벨", desc: "현재가 ±3% 내 주요 가격대와 피보나치 레벨 자동 감지" },
        en: { title: "Support & Resistance", desc: "Key S/R levels within ±3% and Fibonacci auto-detection" },
    },
    {
        icon: "⚡",
        ko: { title: "레버리지 리스크", desc: "배율별 청산가·자본 손실·수익률 실시간 시뮬레이션" },
        en: { title: "Leverage Risk Sim", desc: "Liquidation price and capital loss/gain simulation per leverage" },
    },
    {
        icon: "📊",
        ko: { title: "시장 구조 분석", desc: "BOS·CHoCH 감지로 시장 추세 전환 시그널 포착" },
        en: { title: "Market Structure", desc: "BOS & CHoCH detection to identify trend reversal signals" },
    },
    {
        icon: "🕯",
        ko: { title: "캔들 패턴 인식", desc: "주요 반전·지속 패턴을 자동 인식해 신뢰도 계산에 반영" },
        en: { title: "Candle Patterns", desc: "Auto-detect reversal and continuation patterns for confidence scoring" },
    },
];

const CHART_LEGEND = {
    ko: [
        { color: "#3182F6", style: "dashed",  label: "진입가" },
        { color: "#FF4B4B", style: "dashed",  label: "손절가" },
        { color: "#0DC268", style: "dashed",  label: "목표가" },
        { color: "#02C076", style: "solid",   label: "상승 추세선" },
        { color: "#F75467", style: "solid",   label: "하락 추세선" },
        { color: "#02C076", style: "dotted",  label: "지지선" },
        { color: "#F75467", style: "dotted",  label: "저항선" },
        { color: "#FBDC24", style: "dotted",  label: "피보나치" },
    ],
    en: [
        { color: "#3182F6", style: "dashed",  label: "Entry" },
        { color: "#FF4B4B", style: "dashed",  label: "Stop Loss" },
        { color: "#0DC268", style: "dashed",  label: "Take Profit" },
        { color: "#02C076", style: "solid",   label: "Uptrend Line" },
        { color: "#F75467", style: "solid",   label: "Downtrend Line" },
        { color: "#02C076", style: "dotted",  label: "Support" },
        { color: "#F75467", style: "dotted",  label: "Resistance" },
        { color: "#FBDC24", style: "dotted",  label: "Fibonacci" },
    ],
};

const TIER_GUIDE = {
    ko: [
        { tier: "high" as LeverageTier, label: "고배율", range: "10~20x", interval: "1h", sub: "단기 스캘핑" },
        { tier: "mid"  as LeverageTier, label: "중배율", range: "5~10x",  interval: "4h", sub: "스윙 트레이딩" },
        { tier: "low"  as LeverageTier, label: "저배율", range: "3~5x",   interval: "1d", sub: "포지션 트레이딩" },
    ],
    en: [
        { tier: "high" as LeverageTier, label: "High",     range: "10~20x", interval: "1h", sub: "Scalping" },
        { tier: "mid"  as LeverageTier, label: "Mid",      range: "5~10x",  interval: "4h", sub: "Swing" },
        { tier: "low"  as LeverageTier, label: "Low",      range: "3~5x",   interval: "1d", sub: "Position" },
    ],
};

function LineSwatch({ color, style }: { color: string; style: string }) {
    if (style === "solid") {
        return <div className="w-7 h-px flex-shrink-0" style={{ backgroundColor: color }} />;
    }
    if (style === "dashed") {
        return (
            <div className="w-7 flex-shrink-0 flex items-center gap-px">
                {[0,1,2].map(i => <div key={i} className="h-px flex-1" style={{ backgroundColor: color }} />)}
            </div>
        );
    }
    return (
        <div className="w-7 flex-shrink-0 flex items-center gap-px">
            {[0,1,2,3].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />)}
        </div>
    );
}

export function AnalysisPage({ locale = "ko" }: { locale?: Locale }) {
    const isLight = useTheme();
    const { candles, result, candlesLoading, loading, error, loadCandles, run } = useAnalysis();

    const [symbol, setSymbol]       = useState(DEFAULT_SYMBOL);
    const [tier, setTier]           = useState<LeverageTier>(DEFAULT_TIER);
    const [activeTab, setActiveTab] = useState<ViewTab>("chart");
    const [hasMoreBelow, setHasMoreBelow] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const t = UI[locale];

    const checkScroll = useCallback(() => {
        const el = panelRef.current;
        if (!el) return;
        setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    }, []);

    useEffect(() => { checkScroll(); }, [result, checkScroll]);

    useEffect(() => {
        loadCandles(DEFAULT_SYMBOL, TIER_CONFIG[DEFAULT_TIER].interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (result) setActiveTab("analysis");
    }, [result]);

    const handleSymbolChange = (s: string) => {
        setSymbol(s);
        loadCandles(s, TIER_CONFIG[tier].interval);
    };
    const handleTierChange = (t: LeverageTier) => {
        setTier(t);
        loadCandles(symbol, TIER_CONFIG[t].interval);
    };

    const tabWrap = isLight
        ? "bg-neutral-100 border border-neutral-200"
        : "bg-surface-input/60 border border-border-subtle";
    const tabActive = isLight
        ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
        : "bg-surface-hover text-white shadow-sm";
    const tabInactive = isLight
        ? "text-neutral-500 hover:text-neutral-700"
        : "text-text-muted hover:text-text-secondary";

    const cardBg = isLight
        ? "bg-white border border-neutral-200"
        : "bg-surface-card border border-border-subtle";

    const showChart  = candles && candles.length > 0;
    const showPanel  = !!result && !loading;
    const anyLoading = candlesLoading || loading;
    const currentTier = TIER_CONFIG[tier];
    const tierLabel = currentTier[locale];
    const tierGuide = TIER_GUIDE[locale];
    const chartLegend = CHART_LEGEND[locale];

    return (
        <div className="min-h-screen pt-14 bg-surface-page">
            <div className="max-w-[1800px] mx-auto px-4 pb-4">

                {/* 컨트롤 바 */}
                <div className={`mt-3 2xl:mt-4 rounded-xl ${cardBg} flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5`}>
                    <SymbolSelector
                        value={symbol}
                        onChange={handleSymbolChange}
                        symbols={SUPPORTED_SYMBOLS}
                        symbolNames={SYMBOL_NAMES}
                        isLight={isLight}
                    />

                    {/* 레버리지 티어 탭 */}
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${tabWrap}`}>
                        {TIER_ORDER.map(t => {
                            const cfg = TIER_CONFIG[t];
                            const isActive = tier === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTierChange(t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                        isActive ? tabActive : tabInactive
                                    }`}
                                >
                                    <span className={`text-xs font-semibold ${isActive ? cfg.color : ""}`}>
                                        {cfg[locale].label}
                                    </span>
                                    <span className={`text-[10px] hidden sm:inline ${isActive ? "opacity-60" : "opacity-40"}`}>
                                        {cfg.leverageRange[0]}x~{cfg.leverageRange[1]}x
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 현재 인터벌 배지 */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                        isLight ? "bg-neutral-100 text-neutral-500" : "bg-white/5 text-text-muted"
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${currentTier.color.replace("text-", "bg-")}`} />
                        {currentTier.interval.toUpperCase()} · {tierLabel.sub}
                    </div>

                    {/* 모바일 차트/분석 탭 토글 */}
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 xl:hidden ${tabWrap}`}>
                        {(["chart", "analysis"] as ViewTab[]).map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === tab ? tabActive : tabInactive
                                }`}
                            >
                                {tab === "chart" ? t.chart : t.analysis}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => run(symbol, currentTier.interval, locale)}
                        disabled={anyLoading}
                        className="ml-auto flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-semibold active:scale-[0.97] disabled:cursor-not-allowed transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(90deg, #f7a600 0%, #e09500 100%)", color: "#000" }}
                    >
                        {loading ? (
                            <>
                                <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t.analyzing}
                            </>
                        ) : t.analyze}
                    </button>
                </div>

                {error && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* 메인 레이아웃 */}
                {showChart ? (
                    <div className="mt-4 xl:grid xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_380px_220px] gap-4 h-[calc(100vh-200px)] min-h-[480px] overflow-hidden">

                        {/* 차트 */}
                        <div
                            className={`min-h-0 rounded-xl ${cardBg} overflow-hidden relative ${
                                activeTab === "analysis" ? "hidden xl:block" : ""
                            }`}
                        >
                            {candlesLoading ? (
                                <div className="w-full h-full bg-surface-card animate-pulse" />
                            ) : (
                                <AnalysisChart
                                    candles={candles}
                                    overlay={result}
                                    isLight={isLight}
                                    locale={locale}
                                />
                            )}
                            {loading && (
                                <div className="absolute inset-0 bg-surface-card/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {t.analyzing}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 분석 패널 */}
                        <div className={`relative min-h-0 ${activeTab === "chart" ? "hidden xl:block" : ""}`}>
                            <div
                                ref={panelRef}
                                onScroll={checkScroll}
                                className="overflow-y-auto scrollbar-hide h-full"
                            >
                                {showPanel ? (
                                    <AnalysisPanel
                                        setup={result.setup}
                                        trendLines={result.trendLines}
                                        srLevels={result.srLevels}
                                        trendLineSetups={result.trendLineSetups}
                                        marketStructure={result.marketStructure}
                                        candlestickPatterns={result.candlestickPatterns}
                                        currentPrice={candles[candles.length - 1].close}
                                        leverageRange={currentTier.leverageRange}
                                        tierLabel={tierLabel.label}
                                        tierSub={tierLabel.sub}
                                        locale={locale}
                                    />
                                ) : (
                                    /* 분석 전 - 기능 미리보기 패널 */
                                    <div className={`rounded-xl ${cardBg} h-full flex flex-col overflow-hidden`}>
                                        <div className={`px-5 py-4 border-b ${isLight ? "border-neutral-100" : "border-border-subtle"}`}>
                                            <p className="text-sm font-bold text-text-primary">{t.pendingTitle}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{t.pendingHint}</p>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                                            {FEATURE_ITEMS.map(item => (
                                                <div
                                                    key={item.ko.title}
                                                    className={`rounded-lg px-3.5 py-3 flex items-start gap-3 ${
                                                        isLight ? "bg-neutral-50" : "bg-white/[0.03]"
                                                    }`}
                                                >
                                                    <span className="text-base leading-none flex-shrink-0 mt-px">{item.icon}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-text-secondary leading-snug">
                                                            {item[locale].title}
                                                        </p>
                                                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                                                            {item[locale].desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {showPanel && hasMoreBelow && (
                                <div
                                    className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center pb-2 rounded-b-xl transition-opacity duration-300 ${
                                        isLight
                                            ? "bg-gradient-to-t from-neutral-50 to-transparent"
                                            : "bg-gradient-to-t from-surface-page to-transparent"
                                    }`}
                                >
                                    <svg className="w-4 h-4 opacity-40 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* 사이드 인포 컬럼 (2xl 전용) */}
                        <div className="hidden 2xl:flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-hide">
                            {/* 차트 범례 */}
                            <div className={`rounded-xl ${cardBg} px-4 py-3.5`}>
                                <p className={`text-[11px] font-medium mb-3 ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                    {locale === "ko" ? "차트 범례" : "Chart Legend"}
                                </p>
                                <div className="space-y-2">
                                    {chartLegend.map(item => (
                                        <div key={item.label} className="flex items-center gap-2.5">
                                            <LineSwatch color={item.color} style={item.style} />
                                            <span className="text-[11px] text-text-secondary">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 배율별 가이드 */}
                            <div className={`rounded-xl ${cardBg} px-4 py-3.5`}>
                                <p className={`text-[11px] font-medium mb-3 ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                    {locale === "ko" ? "배율별 가이드" : "Leverage Guide"}
                                </p>
                                <div className="space-y-2.5">
                                    {tierGuide.map(g => {
                                        const cfg = TIER_CONFIG[g.tier];
                                        const isActiveTier = tier === g.tier;
                                        return (
                                            <button
                                                key={g.tier}
                                                type="button"
                                                onClick={() => handleTierChange(g.tier)}
                                                className={`w-full text-left rounded-lg px-3 py-2.5 transition-all cursor-pointer ${
                                                    isActiveTier
                                                        ? isLight ? "bg-neutral-100 ring-1 ring-neutral-200" : "bg-white/6 ring-1 ring-white/10"
                                                        : isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.03]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className={`text-[11px] font-bold ${isActiveTier ? cfg.color : "text-text-secondary"}`}>
                                                        {g.label}
                                                    </span>
                                                    <span className={`text-[10px] font-mono ${isActiveTier ? cfg.color : "text-text-muted"} opacity-70`}>
                                                        {g.range}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                        isLight ? "bg-neutral-200 text-neutral-500" : "bg-white/8 text-text-muted"
                                                    }`}>
                                                        {g.interval}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted">{g.sub}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                ) : candlesLoading ? (
                    <div className={`mt-4 rounded-xl ${cardBg} overflow-hidden animate-pulse h-[calc(100vh-200px)] min-h-[480px]`} />
                ) : (
                    <div className={`mt-4 rounded-xl ${cardBg} px-6 py-16 text-center`}>
                        <p className="text-sm font-medium text-text-primary">{t.selectSymbol}</p>
                        <p className="mt-1 text-xs text-text-muted">{t.selectHint}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
