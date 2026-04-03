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
    },
    en: {
        chart: "Chart", analysis: "Analysis",
        analyze: "Analyze", analyzing: "Analyzing",
        selectSymbol: "Select a symbol",
        selectHint: "Chart will load when interval is selected",
        resultTitle: "Analysis Result",
        resultHint: "Click Analyze to see\ntrend lines, S/R levels & signals",
    },
} as const;

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

    const showChart  = candles && candles.length > 0;
    const showPanel  = !!result && !loading;
    const anyLoading = candlesLoading || loading;
    const currentTier = TIER_CONFIG[tier];
    const tierLabel = currentTier[locale];

    return (
        <div className="min-h-screen pt-14 bg-surface-page">
            <div className="max-w-[1800px] mx-auto px-4 pb-4">

                {/* 컨트롤 바 */}
                <div className="mt-3 2xl:mt-4 rounded-xl border border-border-subtle bg-surface-card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
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
                    <div className="mt-4 xl:grid xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px] gap-4 h-[calc(100vh-200px)] min-h-[480px] overflow-hidden">
                        {/* 차트 */}
                        <div
                            className={`min-h-0 rounded-xl border border-border-subtle bg-surface-card overflow-hidden relative ${
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

                        {/* 패널 */}
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
                                    <div className="rounded-xl border border-border-subtle bg-surface-card h-full flex flex-col items-center justify-center px-6 py-12 text-center gap-2">
                                        <p className="text-sm font-medium text-text-primary">{t.resultTitle}</p>
                                        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
                                            {t.resultHint}
                                        </p>
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
                    </div>
                ) : candlesLoading ? (
                    <div className="mt-4 rounded-xl border border-border-subtle bg-surface-card overflow-hidden animate-pulse h-[calc(100vh-200px)] min-h-[480px]" />
                ) : (
                    <div className="mt-4 rounded-xl border border-border-subtle bg-surface-card px-6 py-16 text-center">
                        <p className="text-sm font-medium text-text-primary">{t.selectSymbol}</p>
                        <p className="mt-1 text-xs text-text-muted">{t.selectHint}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
