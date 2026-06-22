"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { RankingCoin } from "@/app/api/ranking/route";
import { useVirtualList } from "@/shared/hooks/useVirtualList";
import { fmtPrice, fmtLarge } from "@/shared/lib/formatting";
import { useTheme } from "@/shared/hooks/useTheme";

type SortMode = "market_cap" | "volume" | "gainers" | "losers" | "ath_drop";

const TABS_KO: { key: SortMode; label: string; desc: string }[] = [
    { key: "market_cap", label: "시가총액",  desc: "시가총액 기준 상위 100개 코인" },
    { key: "volume",     label: "거래대금",  desc: "24시간 거래대금이 가장 많은 코인" },
    { key: "gainers",    label: "급등",      desc: "24시간 가장 많이 오른 코인" },
    { key: "losers",     label: "급락",      desc: "24시간 가장 많이 내린 코인" },
    { key: "ath_drop",   label: "고점낙폭",  desc: "역대 고점에서 가장 많이 내려온 코인" },
];

const TABS_EN: { key: SortMode; label: string; desc: string }[] = [
    { key: "market_cap", label: "Market Cap",  desc: "Top 100 coins by market cap" },
    { key: "volume",     label: "Volume",      desc: "Highest 24h trading volume" },
    { key: "gainers",    label: "Gainers",     desc: "Top 24h price gainers" },
    { key: "losers",     label: "Losers",      desc: "Top 24h price losers" },
    { key: "ath_drop",   label: "ATH Drop",    desc: "Furthest from all-time high" },
];

function Sparkline({ prices, isUp, w = 64, h = 32 }: { prices: number[]; isUp: boolean; w?: number; h?: number }) {
    if (!prices || prices.length < 2) return <div style={{ width: w, height: h }} className="shrink-0" />;
    const step = Math.max(1, Math.floor(prices.length / 30));
    const sampled = prices.filter((_, i) => i % step === 0);
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;
    const pts = sampled
        .map((p, i) => {
            const x = (i / (sampled.length - 1)) * w;
            const y = h - ((p - min) / range) * (h - 4) - 2;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
            <polyline points={pts} fill="none" stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function AthBar({ pct, isLight }: { pct: number; isLight: boolean }) {
    const drop = Math.abs(pct);
    const color = drop >= 80 ? "#ef4444" : drop >= 60 ? "#f97316" : drop >= 35 ? "#f59e0b" : "#10b981";
    return (
        <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct.toFixed(1)}%</span>
            <div className={`w-14 h-[3px] rounded-full overflow-hidden ${isLight ? "bg-neutral-200" : "bg-white/10"}`}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, drop)}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function SkeletonRow({ isLight }: { isLight: boolean }) {
    const pulse = isLight ? "bg-neutral-200" : "bg-surface-elevated";
    return (
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${isLight ? "border-neutral-100" : "border-border-subtle"}`}>
            <div className={`w-4 h-2.5 rounded ${pulse} animate-pulse shrink-0`} />
            <div className="flex items-center gap-2.5 flex-1">
                <div className={`w-8 h-8 rounded-full ${pulse} animate-pulse shrink-0`} />
                <div className="flex flex-col gap-1.5">
                    <div className={`w-20 h-2.5 rounded ${pulse} animate-pulse`} />
                    <div className={`w-10 h-2 rounded ${pulse} animate-pulse`} />
                </div>
            </div>
            <div className={`w-20 h-2.5 rounded ${pulse} animate-pulse hidden sm:block`} />
            <div className={`w-12 h-2.5 rounded ${pulse} animate-pulse`} />
            <div className={`w-16 h-2.5 rounded ${pulse} animate-pulse hidden md:block`} />
        </div>
    );
}

function MarketOverviewCard({ coins, isLight, isEn }: { coins: RankingCoin[]; isLight: boolean; isEn: boolean }) {
    const stats = useMemo(() => {
        if (!coins.length) return null;
        const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
        const totalVol  = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
        const btc = coins.find((c) => c.id === "bitcoin");
        const btcDom = btc && totalMcap ? (btc.market_cap / totalMcap) * 100 : 0;
        const gainers = coins.filter((c) => (c.price_change_percentage_24h ?? 0) > 0).length;
        return { totalMcap, totalVol, btcDom, gainers, losers: coins.length - gainers };
    }, [coins]);

    const card    = isLight ? "bg-white border-neutral-200"        : "bg-surface-card border-border-subtle";
    const lbl     = isLight ? "text-neutral-400"                    : "text-text-muted";
    const val     = isLight ? "text-neutral-800"                    : "text-text-primary";
    const divider = isLight ? "border-neutral-100"                  : "border-border-subtle";

    if (!stats) {
        return <div className={`rounded-2xl border h-40 animate-pulse ${card}`} />;
    }

    const gainRatio = stats.gainers / (stats.gainers + stats.losers);

    return (
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
            <div className={`px-4 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${lbl}`}>
                    {isEn ? "Market Overview" : "시장 현황"}
                </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
                <div>
                    <div className={`text-[10px] ${lbl}`}>{isEn ? "Total Market Cap" : "총 시가총액"}</div>
                    <div className={`text-[17px] font-bold tabular-nums mt-0.5 ${val}`}>{fmtLarge(stats.totalMcap)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className={`text-[10px] ${lbl}`}>{isEn ? "24h Volume" : "24h 거래대금"}</div>
                        <div className={`text-sm font-semibold tabular-nums mt-0.5 ${val}`}>{fmtLarge(stats.totalVol)}</div>
                    </div>
                    <div>
                        <div className={`text-[10px] ${lbl}`}>{isEn ? "BTC Dom." : "BTC 비중"}</div>
                        <div className={`text-sm font-semibold tabular-nums mt-0.5 ${val}`}>{stats.btcDom.toFixed(1)}%</div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-emerald-500 font-semibold">▲ {stats.gainers} {isEn ? "up" : "상승"}</span>
                        <span className="text-red-500 font-semibold">{stats.losers} {isEn ? "down" : "하락"} ▼</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-red-100" : "bg-red-950/30"}`}>
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${gainRatio * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TopMoversCard({ coins, isLight, isEn }: { coins: RankingCoin[]; isLight: boolean; isEn: boolean }) {
    const [mode, setMode] = useState<"gainers" | "losers">("gainers");

    const movers = useMemo(() => {
        return [...coins]
            .sort((a, b) =>
                mode === "gainers"
                    ? (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
                    : (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0),
            )
            .slice(0, 5);
    }, [coins, mode]);

    const card    = isLight ? "bg-white border-neutral-200"   : "bg-surface-card border-border-subtle";
    const divider = isLight ? "border-neutral-100"             : "border-border-subtle";
    const lbl     = isLight ? "text-neutral-400"               : "text-text-muted";
    const val     = isLight ? "text-neutral-800"               : "text-text-primary";

    if (!coins.length) {
        return <div className={`rounded-2xl border h-52 animate-pulse ${card}`} />;
    }

    return (
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
            <div className={`flex border-b ${divider}`}>
                <button
                    onClick={() => setMode("gainers")}
                    className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                        mode === "gainers"
                            ? "text-emerald-500 bg-emerald-500/5"
                            : `${lbl} hover:text-emerald-500`
                    }`}
                >
                    {isEn ? "Top Gainers" : "급등 TOP 5"}
                </button>
                <button
                    onClick={() => setMode("losers")}
                    className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                        mode === "losers"
                            ? "text-red-500 bg-red-500/5"
                            : `${lbl} hover:text-red-500`
                    }`}
                >
                    {isEn ? "Top Losers" : "급락 TOP 5"}
                </button>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                >
                    {movers.map((coin, i) => {
                        const pct   = coin.price_change_percentage_24h ?? 0;
                        const isUp  = pct >= 0;
                        const color = isUp ? "text-emerald-500" : "text-red-500";
                        return (
                            <div
                                key={coin.id}
                                className={`flex items-center gap-2.5 px-3 py-2.5 border-b last:border-b-0 ${divider}`}
                            >
                                <span className={`text-[10px] w-3.5 text-right shrink-0 tabular-nums ${lbl}`}>{i + 1}</span>
                                <Image src={coin.image} alt={coin.name} width={22} height={22} className="rounded-full shrink-0" unoptimized />
                                <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-semibold uppercase truncate ${val}`}>{coin.symbol}</div>
                                    <div className={`text-[10px] tabular-nums ${lbl}`}>{fmtPrice(coin.current_price)}</div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                    <span className={`text-xs font-bold tabular-nums ${color}`}>
                                        {isUp ? "+" : ""}{pct.toFixed(2)}%
                                    </span>
                                    <Sparkline prices={coin.sparkline_in_7d?.price ?? []} isUp={isUp} w={52} h={20} />
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function MobileStatsStrip({ coins, isLight, isEn }: { coins: RankingCoin[]; isLight: boolean; isEn: boolean }) {
    const stats = useMemo(() => {
        if (!coins.length) return null;
        const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
        const totalVol  = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
        const btc = coins.find((c) => c.id === "bitcoin");
        const btcDom = btc && totalMcap ? (btc.market_cap / totalMcap) * 100 : 0;
        const gainers = coins.filter((c) => (c.price_change_percentage_24h ?? 0) > 0).length;
        return { totalMcap, totalVol, btcDom, gainers, losers: coins.length - gainers };
    }, [coins]);

    if (!stats) return null;

    const bg  = isLight ? "bg-white border-neutral-200" : "bg-surface-card border-border-subtle";
    const lbl = isLight ? "text-neutral-400"             : "text-text-muted";
    const val = isLight ? "text-neutral-700"             : "text-text-secondary";

    const items = [
        { label: isEn ? "Mkt Cap" : "시가총액",     value: fmtLarge(stats.totalMcap) },
        { label: isEn ? "24h Vol" : "24h 거래대금", value: fmtLarge(stats.totalVol) },
        { label: isEn ? "BTC Dom" : "BTC 비중",     value: `${stats.btcDom.toFixed(1)}%` },
        { label: isEn ? "Up/Down" : "상승/하락",     value: null, gainers: stats.gainers, losers: stats.losers },
    ];

    return (
        <div className={`lg:hidden flex gap-3 mb-4 overflow-x-auto pb-1 scrollbar-hide`}>
            {items.map((item, i) => (
                <div key={i} className={`flex-none flex flex-col gap-0.5 px-3 py-2 rounded-xl border ${bg}`}>
                    <span className={`text-[10px] whitespace-nowrap ${lbl}`}>{item.label}</span>
                    {item.value ? (
                        <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${val}`}>{item.value}</span>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
                            <span className="text-emerald-500">▲{item.gainers}</span>
                            <span className="text-red-500">▼{item.losers}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function SimCtaCard({ isLight, isEn }: { isLight: boolean; isEn: boolean }) {
    return (
        <Link
            href={isEn ? "/en/trading" : "/trading?tab=sim"}
            className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all hover:scale-[1.004] active:scale-[0.998] group ${
                isLight
                    ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                    : "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-800/60"
            }`}
        >
            <div>
                <div className={`text-sm font-semibold ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                    {isEn ? "Practice trading" : "모의투자로 연습"}
                </div>
                <div className={`text-[11px] mt-0.5 ${isLight ? "text-emerald-600" : "text-emerald-600/70"}`}>
                    {isEn ? "Real prices · 10,000 USDT virtual" : "실시간 가격 · 가상 10,000 USDT"}
                </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ml-3 transition-transform group-hover:translate-x-0.5 ${isLight ? "text-emerald-700" : "text-emerald-500"}`}>
                {isEn ? "Start" : "시작"}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}

export default function RankingClient({ initialData }: { initialData?: RankingCoin[] }) {
    const [coins, setCoins]         = useState<RankingCoin[]>(initialData ?? []);
    const [loading, setLoading]     = useState(!initialData || initialData.length === 0);
    const [sortMode, setSortMode]   = useState<SortMode>("market_cap");
    const [direction, setDirection] = useState(0);
    const prevTabRef                = useRef<SortMode>("market_cap");
    const isLight                   = useTheme();
    const pathname                  = usePathname();
    const isEn                      = pathname.startsWith("/en/");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    const TABS = isEn ? TABS_EN : TABS_KO;

    const tabOrder: Record<SortMode, number> = { market_cap: 0, volume: 1, gainers: 2, losers: 3, ath_drop: 4 };

    const switchTab = (next: SortMode) => {
        if (next === sortMode) return;
        setDirection(tabOrder[next] > tabOrder[prevTabRef.current] ? 1 : -1);
        prevTabRef.current = next;
        setSortMode(next);
    };

    useEffect(() => {
        if (initialData && initialData.length > 0) { setUpdatedAt(new Date()); return; }
        fetch("/api/ranking")
            .then((r) => r.json())
            .then((data: RankingCoin[]) => { setCoins(data); setUpdatedAt(new Date()); })
            .catch((e) => console.error("[RankingClient] fetch error:", e))
            .finally(() => setLoading(false));
    }, [initialData]);

    const sorted = useMemo(() => {
        const list = [...coins];
        switch (sortMode) {
            case "volume":   return list.sort((a, b) => b.total_volume - a.total_volume);
            case "gainers":  return list.sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
            case "losers":   return list.sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));
            case "ath_drop": return list.sort((a, b) => (a.ath_change_percentage ?? 0) - (b.ath_change_percentage ?? 0));
            default:         return list;
        }
    }, [coins, sortMode]);

    const { visibleItems, sentinelRef, hasMore, newBatchStart } = useVirtualList(sorted, 15);

    const bg        = isLight ? "bg-neutral-50"   : "bg-black";
    const cardBg    = isLight ? "bg-white border-neutral-200" : "bg-surface-card border-border-subtle";
    const hoverRow  = isLight ? "hover:bg-neutral-50"         : "hover:bg-surface-hover/20";
    const divider   = isLight ? "border-neutral-100"          : "border-border-subtle";
    const tabActive = isLight
        ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
        : "bg-surface-hover text-white shadow-sm";
    const tabInactive = isLight ? "text-neutral-500 hover:text-neutral-700" : "text-text-muted hover:text-text-secondary";
    const tabWrap   = isLight ? "bg-neutral-100 border border-neutral-200" : "bg-surface-input/60 border border-border-subtle";
    const colHead   = isLight ? "text-neutral-400 border-neutral-100 bg-neutral-50/80" : "text-text-muted border-border-subtle bg-surface-elevated/30";

    const activeTab = TABS.find((t) => t.key === sortMode)!;
    const secondaryLabel = isEn
        ? (sortMode === "volume" ? "Volume" : sortMode === "ath_drop" ? "vs ATH" : "Mkt Cap")
        : (sortMode === "volume" ? "거래대금" : sortMode === "ath_drop" ? "고점 대비" : "시가총액");

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-7xl mx-auto px-4 pb-24 pt-6">

                {/* Header */}
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-text-primary"}`}>
                            {isEn ? "Crypto Rankings" : "코인 랭킹"}
                        </h1>
                        <p className={`text-xs mt-0.5 ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                            {activeTab.desc}
                        </p>
                    </div>
                    {updatedAt && (
                        <span className={`text-[11px] ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                            {isEn
                                ? `Updated ${updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                                : `${updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 업데이트`}
                        </span>
                    )}
                </div>

                {/* Tabs */}
                <div className="mb-4 overflow-x-auto pb-0.5">
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${tabWrap}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => switchTab(tab.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    sortMode === tab.key ? tabActive : tabInactive
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile stats strip */}
                {!loading && <MobileStatsStrip coins={coins} isLight={isLight} isEn={isEn} />}

                {/* Two-column layout */}
                <div className="lg:grid lg:grid-cols-[1fr_272px] lg:gap-6 lg:items-start">

                    {/* Main table */}
                    <div>
                        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                            {/* Column headers */}
                            <div className={`hidden md:flex items-center gap-3 px-4 py-2 text-[11px] font-medium border-b ${colHead} relative z-10`}>
                                <span className="w-5 text-right shrink-0">#</span>
                                <span className="flex-1">{isEn ? "Coin" : "코인"}</span>
                                <span className="w-28 text-right shrink-0">{isEn ? "Price" : "현재가"}</span>
                                <span className="w-16 text-right shrink-0">24h</span>
                                <span className={`text-right shrink-0 hidden md:block ${sortMode === "ath_drop" ? "w-28" : "w-24"}`}>
                                    {secondaryLabel}
                                </span>
                                <span className="w-24 text-right shrink-0 hidden xl:block">{isEn ? "7D Chart" : "7일 차트"}</span>
                            </div>

                            {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} isLight={isLight} />)}

                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={sortMode}
                                    custom={direction}
                                    variants={{
                                        enter:  (d: number) => ({ x: d > 0 ? "40%" : "-40%", opacity: 0 }),
                                        center: { x: 0, opacity: 1 },
                                        exit:   (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
                                    }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {!loading && visibleItems.map((coin, idx) => {
                                        const pct      = coin.price_change_percentage_24h ?? 0;
                                        const isUp     = pct >= 0;
                                        const pctColor = isUp ? "text-emerald-500" : "text-red-500";
                                        const batchIdx = Math.max(0, idx - newBatchStart);

                                        const secondaryNode = sortMode === "ath_drop"
                                            ? <AthBar pct={coin.ath_change_percentage ?? 0} isLight={isLight} />
                                            : (
                                                <span className={`text-xs tabular-nums ${isLight ? "text-neutral-500" : "text-text-muted"}`}>
                                                    {sortMode === "volume" ? fmtLarge(coin.total_volume) : fmtLarge(coin.market_cap)}
                                                </span>
                                            );

                                        return (
                                            <motion.div
                                                key={`${sortMode}-${coin.id}`}
                                                initial={{ opacity: 0, y: 14 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: false, amount: 0.1 }}
                                                transition={{ delay: batchIdx * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                                className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${divider} ${hoverRow}`}
                                            >
                                                <span className={`w-5 text-[11px] text-right shrink-0 tabular-nums ${isLight ? "text-neutral-300" : "text-text-muted/50"}`}>
                                                    {idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className="relative w-8 h-8 shrink-0">
                                                        <Image src={coin.image} alt={coin.name} fill className="object-contain rounded-full" unoptimized />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`text-sm font-semibold leading-snug truncate ${isLight ? "text-neutral-800" : "text-text-primary"}`}>{coin.name}</div>
                                                        <div className={`text-[11px] uppercase ${isLight ? "text-neutral-400" : "text-text-muted"}`}>{coin.symbol}</div>
                                                    </div>
                                                </div>
                                                <div className={`w-28 text-sm font-mono tabular-nums text-right shrink-0 ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                                    {fmtPrice(coin.current_price)}
                                                </div>
                                                <div className={`w-16 text-sm font-semibold text-right shrink-0 tabular-nums ${pctColor}`}>
                                                    {isUp ? "+" : ""}{pct.toFixed(2)}%
                                                </div>
                                                <div className={`text-right shrink-0 hidden md:flex md:justify-end ${sortMode === "ath_drop" ? "w-28" : "w-24"}`}>
                                                    {secondaryNode}
                                                </div>
                                                <div className="hidden xl:flex w-24 justify-end shrink-0">
                                                    <Sparkline prices={coin.sparkline_in_7d?.price ?? []} isUp={isUp} w={88} h={36} />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    {!loading && hasMore && <div ref={sentinelRef} className="h-px" aria-hidden />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {!loading && hasMore && (
                            <div className={`flex justify-center py-4 text-xs ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                                </span>
                            </div>
                        )}

                        {/* Mobile sim trading CTA */}
                        {!loading && !hasMore && sorted.length > 0 && (
                            <div className="lg:hidden mt-5">
                                <SimCtaCard isLight={isLight} isEn={isEn} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar — desktop only */}
                    <div className="hidden lg:flex flex-col gap-4 sticky top-20">
                        <MarketOverviewCard coins={coins} isLight={isLight} isEn={isEn} />
                        <TopMoversCard coins={coins} isLight={isLight} isEn={isEn} />
                        <SimCtaCard isLight={isLight} isEn={isEn} />
                    </div>
                </div>
            </div>
        </div>
    );
}
