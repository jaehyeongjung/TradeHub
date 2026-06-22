"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useAnalysis, ANALYSIS_STEPS } from "@/features/analysis/useAnalysis";
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
    dot: string;
}> = {
    high: {
        ko: { label: "고배율",  sub: "단기 스캘핑"     },
        en: { label: "High Lev", sub: "Scalping"       },
        interval: "1h", leverageRange: [10, 20], color: "text-red-400", dot: "bg-red-400",
    },
    mid: {
        ko: { label: "중배율",  sub: "스윙 트레이딩"   },
        en: { label: "Mid Lev",  sub: "Swing Trading"  },
        interval: "4h", leverageRange: [5, 10],  color: "text-amber-400", dot: "bg-amber-400",
    },
    low: {
        ko: { label: "저배율",  sub: "포지션 트레이딩" },
        en: { label: "Low Lev",  sub: "Position Trade" },
        interval: "1d", leverageRange: [3, 5],   color: "text-emerald-400", dot: "bg-emerald-400",
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
        pendingTitle: "AI 기술적 분석",
        pendingHint: "분석하기를 눌러 시작",
        analyzeHint: "아래 항목을 자동 분석합니다",
        chartLegend: "차트 범례",
        tierGuide: "배율별 가이드",
    },
    en: {
        chart: "Chart", analysis: "Analysis",
        analyze: "Analyze", analyzing: "Analyzing",
        selectSymbol: "Select a symbol",
        selectHint: "Chart will load when interval is selected",
        resultTitle: "Analysis Result",
        pendingTitle: "AI Technical Analysis",
        pendingHint: "Click Analyze to start",
        analyzeHint: "The following items will be analyzed",
        chartLegend: "Chart Legend",
        tierGuide: "Leverage Guide",
    },
} as const;

// ── SVG 아이콘 ────────────────────────────────────────────────────────────────

function IcTrend() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,12.5 5.5,7.5 9,9.5 14.5,3.5" />
            <polyline points="11,3.5 14.5,3.5 14.5,7" />
        </svg>
    );
}

function IcTarget() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="8" cy="8" r="4.5" />
            <line x1="8" y1="1" x2="8" y2="3.5" />
            <line x1="8" y1="12.5" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3.5" y2="8" />
            <line x1="12.5" y1="8" x2="15" y2="8" />
        </svg>
    );
}

function IcSR() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="2" y1="5" x2="14" y2="5" />
            <line x1="2" y1="11" x2="14" y2="11" />
            <circle cx="5.5" cy="5" r="1.2" fill="currentColor" strokeWidth="0" />
            <circle cx="10.5" cy="11" r="1.2" fill="currentColor" strokeWidth="0" />
        </svg>
    );
}

function IcShield() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1.5L13.5 4V8.5C13.5 11.5 8 14.5 8 14.5C8 14.5 2.5 11.5 2.5 8.5V4L8 1.5Z" />
        </svg>
    );
}

function IcStructure() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,12 4.5,5.5 8,9 11.5,3.5 15,6.5" />
        </svg>
    );
}

function IcCandle() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="3.5" y="5.5" width="3.5" height="5.5" rx="0.5" />
            <line x1="5.25" y1="2" x2="5.25" y2="5.5" />
            <line x1="5.25" y1="11" x2="5.25" y2="14" />
            <rect x="9" y="7" width="3.5" height="3.5" rx="0.5" />
            <line x1="10.75" y1="4" x2="10.75" y2="7" />
            <line x1="10.75" y1="10.5" x2="10.75" y2="13" />
        </svg>
    );
}

function IcCheck() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,8.5 6.5,12 13,4.5" />
        </svg>
    );
}

// ── 데이터 상수 ───────────────────────────────────────────────────────────────

const FEATURE_ITEMS = [
    {
        icon: <IcTrend />,
        ko: { title: "추세선 자동 감지", desc: "상승·하락 추세선과 미래 연장선을 차트에 자동 표시" },
        en: { title: "Auto Trend Lines", desc: "Detect trend lines with 30-candle future extension" },
    },
    {
        icon: <IcTarget />,
        ko: { title: "진입 타점 계산", desc: "진입가·손절가·목표가를 레버리지 배율에 맞게 자동 산출" },
        en: { title: "Entry Point Calc", desc: "Auto-calculate entry, stop-loss & take-profit" },
    },
    {
        icon: <IcSR />,
        ko: { title: "지지·저항 레벨", desc: "현재가 ±3% 내 주요 가격대와 피보나치 레벨 감지" },
        en: { title: "Support & Resistance", desc: "Key S/R levels within ±3% and Fibonacci levels" },
    },
    {
        icon: <IcShield />,
        ko: { title: "레버리지 리스크", desc: "배율별 청산가·자본 손실·수익률 실시간 시뮬레이션" },
        en: { title: "Leverage Risk", desc: "Liquidation price and capital simulation per leverage" },
    },
    {
        icon: <IcStructure />,
        ko: { title: "시장 구조 분석", desc: "BOS·CHoCH 감지로 추세 전환 시그널 포착" },
        en: { title: "Market Structure", desc: "BOS & CHoCH detection to spot trend reversals" },
    },
    {
        icon: <IcCandle />,
        ko: { title: "캔들 패턴 인식", desc: "주요 반전·지속 패턴을 자동 인식해 신뢰도에 반영" },
        en: { title: "Candle Patterns", desc: "Auto-detect reversal and continuation patterns" },
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
        { tier: "high" as LeverageTier, label: "High", range: "10~20x", interval: "1h", sub: "Scalping" },
        { tier: "mid"  as LeverageTier, label: "Mid",  range: "5~10x",  interval: "4h", sub: "Swing" },
        { tier: "low"  as LeverageTier, label: "Low",  range: "3~5x",   interval: "1d", sub: "Position" },
    ],
};

// ── LineSwatch ────────────────────────────────────────────────────────────────

function LineSwatch({ color, style }: { color: string; style: string }) {
    if (style === "solid") {
        return <div className="w-6 h-px flex-shrink-0" style={{ backgroundColor: color }} />;
    }
    if (style === "dashed") {
        return (
            <div className="w-6 flex-shrink-0 flex items-center gap-px">
                {[0, 1, 2].map(i => <div key={i} className="h-px flex-1" style={{ backgroundColor: color }} />)}
            </div>
        );
    }
    return (
        <div className="w-6 flex-shrink-0 flex items-center justify-between">
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            ))}
        </div>
    );
}

// ── AnalysisPage ──────────────────────────────────────────────────────────────

export function AnalysisPage({ locale = "ko" }: { locale?: Locale }) {
    const isLight = useTheme();
    const { candles, result, candlesLoading, loading, progress, error, loadCandles, run } = useAnalysis();

    const [symbol, setSymbol]       = useState(DEFAULT_SYMBOL);
    const [tier, setTier]           = useState<LeverageTier>(DEFAULT_TIER);
    const [activeTab, setActiveTab] = useState<ViewTab>("chart");
    const [hasMoreBelow, setHasMoreBelow] = useState(false);
    const [displayPct, setDisplayPct] = useState(0);
    const rafRef = useRef<number | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // 게이지 % 부드럽게 카운트업
    useEffect(() => {
        if (!progress) { setDisplayPct(0); return; }
        const target = progress.pct;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        let current = displayPct;
        const animate = () => {
            const diff = target - current;
            if (Math.abs(diff) < 0.4) { setDisplayPct(target); return; }
            current += diff * 0.12;
            setDisplayPct(Math.round(current));
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress?.pct]);

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

    const iconBg = isLight ? "bg-neutral-100" : "bg-white/6";

    const showChart  = candles && candles.length > 0;
    const showPanel  = !!result && !loading;
    const anyLoading = candlesLoading || loading;
    const currentTier = TIER_CONFIG[tier];
    const tierLabel = currentTier[locale];
    const tierGuide = TIER_GUIDE[locale];
    const chartLegend = CHART_LEGEND[locale];

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-surface-page px-5 pt-12 pb-3 2xl:pb-4">
            <div className="flex flex-col gap-3 flex-1 min-h-0 mt-3">

                {/* 컨트롤 바 */}
                <div className={`flex-shrink-0 rounded-xl ${cardBg} flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5`}>
                    <SymbolSelector
                        value={symbol}
                        onChange={handleSymbolChange}
                        symbols={SUPPORTED_SYMBOLS}
                        symbolNames={SYMBOL_NAMES}
                        isLight={isLight}
                    />

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
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentTier.dot}`} />
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
                    <div className="flex-shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* 메인 레이아웃 */}
                {showChart ? (
                    <div className="flex-1 min-h-0 xl:grid xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_380px_220px] gap-3">

                        {/* 차트 */}
                        <div
                            className={`h-full min-h-0 rounded-xl ${cardBg} overflow-hidden relative ${
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

                            {/* 분석 진행 오버레이 */}
                            {loading && progress && (
                                <div className="absolute inset-0 backdrop-blur-[3px] flex flex-col items-center justify-center gap-5 px-12 transition-colors duration-500"
                                    style={{ background: displayPct === 100
                                        ? "rgba(2,192,118,0.08)"
                                        : isLight ? "rgba(255,255,255,0.75)" : "rgba(12,20,34,0.75)"
                                    }}
                                >
                                    <div className="w-full max-w-xs space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium transition-colors duration-300 ${
                                                displayPct === 100 ? "text-emerald-400" : "text-text-secondary"
                                            }`}>{progress.label}</span>
                                            <span className={`text-[11px] tabular-nums font-semibold transition-colors duration-300 ${
                                                displayPct === 100 ? "text-emerald-400" : "text-text-muted"
                                            }`}>{displayPct}%</span>
                                        </div>
                                        <div className="rounded-full overflow-hidden" style={{
                                            height: "3px",
                                            background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
                                        }}>
                                            <motion.div
                                                className="h-full rounded-full relative overflow-hidden"
                                                animate={displayPct === 100 ? { scaleY: [1, 1.8, 1] } : { scaleY: 1 }}
                                                transition={displayPct === 100
                                                    ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                                                    : { duration: 0 }}
                                                style={{
                                                    width: `${displayPct}%`,
                                                    background: displayPct === 100
                                                        ? "linear-gradient(90deg, #02C076, #00a86b)"
                                                        : "linear-gradient(90deg, #f7a600, #e09500)",
                                                    transition: "width 0.15s ease-out, background 0.5s ease",
                                                    transformOrigin: "center",
                                                    boxShadow: displayPct === 100
                                                        ? "0 0 8px 1px rgba(2,192,118,0.6)"
                                                        : "none",
                                                }}
                                            >
                                                <AnimatePresence>
                                                    {displayPct === 100 && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-full"
                                                            style={{
                                                                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                                                            }}
                                                            animate={{ x: ["-100%", "300%"] }}
                                                            transition={{ duration: 1.3, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        </div>
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
                                {loading && progress ? (
                                    /* 분석 진행 중 - 단계별 체크리스트 */
                                    <div className={`rounded-xl h-full flex flex-col overflow-hidden transition-colors duration-500 ${
                                        displayPct === 100
                                            ? isLight ? "bg-emerald-50 border border-emerald-200" : "bg-emerald-500/5 border border-emerald-500/20"
                                            : cardBg
                                    }`}>
                                        <div className={`px-5 py-4 border-b transition-colors duration-500 ${
                                            displayPct === 100
                                                ? isLight ? "border-emerald-200" : "border-emerald-500/20"
                                                : isLight ? "border-neutral-100" : "border-border-subtle"
                                        }`}>
                                            <motion.p
                                                className={`text-sm font-bold transition-colors duration-300 ${
                                                    displayPct === 100 ? "text-emerald-500" : "text-text-primary"
                                                }`}
                                                animate={displayPct === 100 ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                                                transition={displayPct === 100
                                                    ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                                                    : { duration: 0 }}
                                            >
                                                {displayPct === 100
                                                    ? (locale === "ko" ? "분석 완료" : "Analysis Complete")
                                                    : t.analyzing}
                                            </motion.p>
                                            <p className={`text-xs mt-0.5 tabular-nums transition-colors duration-300 ${
                                                displayPct === 100 ? "text-emerald-400/70" : "text-text-muted"
                                            }`}>
                                                {displayPct === 100
                                                    ? (locale === "ko" ? "결과를 불러오는 중..." : "Loading results...")
                                                    : `${displayPct}%`}
                                            </p>
                                        </div>
                                        <div className="flex-1 px-5 py-4 space-y-3.5">
                                            {ANALYSIS_STEPS.map((s, i) => {
                                                const done   = i < progress.stepIndex;
                                                const active = i === progress.stepIndex;
                                                return (
                                                    <div key={s.key} className={`flex items-center gap-2.5 transition-opacity duration-200 ${
                                                        done || active ? "opacity-100" : "opacity-25"
                                                    }`}>
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                                            done
                                                                ? "text-emerald-400"
                                                                : active
                                                                ? "text-amber-400"
                                                                : isLight ? "text-neutral-300" : "text-white/20"
                                                        }`}>
                                                            {done ? (
                                                                <IcCheck />
                                                            ) : active ? (
                                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                            ) : (
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-neutral-300" : "bg-white/20"}`} />
                                                            )}
                                                        </div>
                                                        <span className={`text-xs transition-all ${
                                                            active
                                                                ? "font-semibold text-text-primary"
                                                                : done
                                                                ? "text-text-secondary"
                                                                : "text-text-muted"
                                                        }`}>
                                                            {s[locale]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : showPanel ? (
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
                                    /* 분석 전 - 기능 목록 */
                                    <div className={`rounded-xl ${cardBg} h-full flex flex-col overflow-hidden`}>
                                        <div className={`px-5 py-4 border-b ${isLight ? "border-neutral-100" : "border-border-subtle"}`}>
                                            <p className="text-sm font-bold text-text-primary">{t.pendingTitle}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{t.pendingHint}</p>
                                        </div>
                                        <div className={`divide-y ${isLight ? "divide-neutral-100" : "divide-border-subtle"} overflow-y-auto scrollbar-hide`}>
                                            {FEATURE_ITEMS.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-text-tertiary ${iconBg}`}>
                                                        {item.icon}
                                                    </div>
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
                                    className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center pb-2 rounded-b-xl ${
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
                                    {t.chartLegend}
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
                                    {t.tierGuide}
                                </p>
                                <div className="space-y-1">
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
                                                        ? isLight ? "bg-neutral-100" : "bg-white/6"
                                                        : isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.03]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${isActiveTier ? "opacity-100" : "opacity-40"}`} />
                                                        <span className={`text-[11px] font-semibold ${isActiveTier ? cfg.color : "text-text-secondary"}`}>
                                                            {g.label}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] tabular-nums ${isActiveTier ? "text-text-secondary" : "text-text-muted"}`}>
                                                        {g.range}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 ml-3">
                                                    <span className={`text-[10px] font-mono ${isActiveTier ? "text-text-muted" : "text-text-tertiary"}`}>
                                                        {g.interval}
                                                    </span>
                                                    <span className={`text-[10px] ${isActiveTier ? "text-text-muted" : "text-text-tertiary"}`}>
                                                        {g.sub}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                ) : candlesLoading ? (
                    <div className={`flex-1 min-h-[400px] rounded-xl ${cardBg} overflow-hidden animate-pulse`} />
                ) : (
                    <div className={`flex-1 min-h-[400px] rounded-xl ${cardBg} px-6 flex flex-col items-center justify-center text-center`}>
                        <p className="text-sm font-medium text-text-primary">{t.selectSymbol}</p>
                        <p className="mt-1 text-xs text-text-muted">{t.selectHint}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
