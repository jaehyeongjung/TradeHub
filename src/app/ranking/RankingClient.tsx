"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RankingCoin } from "@/app/api/ranking/route";
import { useVirtualList } from "@/hooks/useVirtualList";

type SortMode = "market_cap" | "volume" | "gainers" | "losers" | "ath_drop";

const TABS: { key: SortMode; label: string; desc: string }[] = [
    { key: "market_cap", label: "시가총액",  desc: "시가총액 기준 상위 100개 코인" },
    { key: "volume",     label: "거래대금",  desc: "24시간 거래대금이 가장 많은 코인" },
    { key: "gainers",    label: "급등",      desc: "24시간 가장 많이 오른 코인" },
    { key: "losers",     label: "급락",      desc: "24시간 가장 많이 내린 코인" },
    { key: "ath_drop",   label: "고점낙폭",  desc: "역대 고점에서 가장 많이 내려온 코인" },
];

/* ─── 포맷 ─── */
function fmtPrice(n: number): string {
    if (n >= 10000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (n >= 1)     return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 0.01)  return `$${n.toFixed(4)}`;
    return `$${n.toFixed(6)}`;
}
function fmtLarge(n: number): string {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
}

/* ─── 스파크라인 ─── */
function Sparkline({ prices, isUp }: { prices: number[]; isUp: boolean }) {
    if (!prices || prices.length < 2) return <div className="w-16 h-8" />;
    const step = Math.max(1, Math.floor(prices.length / 30));
    const sampled = prices.filter((_, i) => i % step === 0);
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;
    const W = 64, H = 32;
    const pts = sampled
        .map((p, i) => {
            const x = (i / (sampled.length - 1)) * W;
            const y = H - ((p - min) / range) * (H - 4) - 2;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
            <polyline
                points={pts}
                fill="none"
                stroke={isUp ? "#10b981" : "#ef4444"}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ─── 고점낙폭 바 ─── */
function AthBar({ pct, isLight }: { pct: number; isLight: boolean }) {
    const drop = Math.abs(pct);
    const color =
        drop >= 80 ? "#ef4444" :
        drop >= 60 ? "#f97316" :
        drop >= 35 ? "#f59e0b" :
                     "#10b981";
    return (
        <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                {pct.toFixed(1)}%
            </span>
            <div className={`w-14 h-[3px] rounded-full overflow-hidden ${isLight ? "bg-neutral-200" : "bg-white/10"}`}>
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, drop)}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

/* ─── 스켈레톤 ─── */
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
            <div className={`w-16 h-2.5 rounded ${pulse} animate-pulse hidden lg:block`} />
        </div>
    );
}

/* ─── Main ─── */
export default function RankingClient({ initialData }: { initialData?: RankingCoin[] }) {
    const [coins, setCoins] = useState<RankingCoin[]>(initialData ?? []);
    const [loading, setLoading] = useState(!initialData || initialData.length === 0);
    const [sortMode, setSortMode] = useState<SortMode>("market_cap");
    const [isLight, setIsLight] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (initialData && initialData.length > 0) {
            setUpdatedAt(new Date());
            return; // SSR 데이터 있으면 클라이언트 재요청 생략
        }
        fetch("/api/ranking")
            .then((r) => r.json())
            .then((data: RankingCoin[]) => { setCoins(data); setUpdatedAt(new Date()); })
            .catch(() => {})
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

    /* ─── 가상화 ─── */
    const { visibleItems, sentinelRef, hasMore, newBatchStart } = useVirtualList(sorted, 20);

    /* ─── theme ─── */
    const bg       = isLight ? "bg-neutral-50"    : "bg-black";
    const cardBg   = isLight ? "bg-white border-neutral-200"  : "bg-surface-card border-border-subtle";
    const hoverRow = isLight ? "hover:bg-neutral-50"          : "hover:bg-surface-hover/20";
    const divider  = isLight ? "border-neutral-100"           : "border-border-subtle";
    const tabActive  = isLight
        ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
        : "bg-surface-hover text-white shadow-sm";
    const tabInactive = isLight
        ? "text-neutral-500 hover:text-neutral-700"
        : "text-text-muted hover:text-text-secondary";
    const tabWrap = isLight
        ? "bg-neutral-100 border border-neutral-200"
        : "bg-surface-input/60 border border-border-subtle";
    const colHead = isLight
        ? "text-neutral-400 border-neutral-100 bg-neutral-50/80"
        : "text-text-muted border-border-subtle bg-surface-elevated/30";

    const activeTab = TABS.find((t) => t.key === sortMode)!;
    const secondaryLabel =
        sortMode === "volume"   ? "거래대금" :
        sortMode === "ath_drop" ? "고점 대비" :
                                  "시가총액";

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">

                {/* 헤더 */}
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-text-primary"}`}>
                            코인 랭킹
                        </h1>
                        <p className={`text-xs mt-0.5 ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                            {activeTab.desc}
                        </p>
                    </div>
                    {updatedAt && (
                        <span className={`text-[11px] ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                            {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 업데이트
                        </span>
                    )}
                </div>

                {/* 탭 */}
                <div className="mb-4 overflow-x-auto pb-0.5">
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${tabWrap}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSortMode(tab.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    sortMode === tab.key ? tabActive : tabInactive
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 리스트 카드 */}
                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>

                    {/* 컬럼 헤더 */}
                    <div className={`hidden md:flex items-center gap-3 px-4 py-2 text-[11px] font-medium border-b ${colHead}`}>
                        <span className="w-5 text-right shrink-0">#</span>
                        <span className="flex-1">코인</span>
                        <span className="w-28 text-right shrink-0">현재가</span>
                        <span className="w-16 text-right shrink-0">24h</span>
                        <span className={`text-right shrink-0 hidden lg:block ${sortMode === "ath_drop" ? "w-28" : "w-24"}`}>
                            {secondaryLabel}
                        </span>
                        <span className="w-16 text-right shrink-0 hidden xl:block">7일</span>
                    </div>

                    {/* 스켈레톤 */}
                    {loading && Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonRow key={i} isLight={isLight} />
                    ))}

                    {/* 코인 리스트 — 가상화 적용 */}
                    {!loading && visibleItems.map((coin, idx) => {
                        const pct    = coin.price_change_percentage_24h ?? 0;
                        const isUp   = pct >= 0;
                        const pctColor = isUp ? "text-emerald-500" : "text-red-500";

                        // 이 배치에서 새로 마운트된 아이템의 상대 인덱스 → 스태거 딜레이
                        const batchIdx = Math.max(0, idx - newBatchStart);

                        const secondaryNode = sortMode === "ath_drop"
                            ? <AthBar pct={coin.ath_change_percentage ?? 0} isLight={isLight} />
                            : (
                                <span className={`text-xs tabular-nums ${isLight ? "text-neutral-500" : "text-text-muted"}`}>
                                    {sortMode === "volume"
                                        ? fmtLarge(coin.total_volume)
                                        : fmtLarge(coin.market_cap)}
                                </span>
                            );

                        return (
                            <motion.div
                                key={`${sortMode}-${coin.id}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: batchIdx * 0.032,
                                    duration: 0.32,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${divider} ${hoverRow}`}
                            >
                                {/* 순위 */}
                                <span className={`w-5 text-[11px] text-right shrink-0 tabular-nums ${isLight ? "text-neutral-300" : "text-text-muted/50"}`}>
                                    {idx + 1}
                                </span>

                                {/* 로고 + 이름 */}
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="relative w-8 h-8 shrink-0">
                                        <Image
                                            src={coin.image}
                                            alt={coin.name}
                                            fill
                                            className="object-contain rounded-full"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-semibold leading-snug truncate ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                            {coin.name}
                                        </div>
                                        <div className={`text-[11px] uppercase ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                            {coin.symbol}
                                        </div>
                                    </div>
                                </div>

                                {/* 현재가 */}
                                <div className={`w-28 text-sm font-mono tabular-nums text-right shrink-0 ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                    {fmtPrice(coin.current_price)}
                                </div>

                                {/* 24h */}
                                <div className={`w-16 text-sm font-semibold text-right shrink-0 tabular-nums ${pctColor}`}>
                                    {isUp ? "+" : ""}{pct.toFixed(2)}%
                                </div>

                                {/* 보조 지표 */}
                                <div className={`text-right shrink-0 hidden lg:flex lg:justify-end ${sortMode === "ath_drop" ? "w-28" : "w-24"}`}>
                                    {secondaryNode}
                                </div>

                                {/* 스파크라인 */}
                                <div className="hidden xl:flex w-16 justify-end shrink-0">
                                    <Sparkline prices={coin.sparkline_in_7d?.price ?? []} isUp={isUp} />
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* 센티넬 — IntersectionObserver 감지 지점 */}
                    {!loading && hasMore && (
                        <div ref={sentinelRef} className="h-px" aria-hidden />
                    )}
                </div>

                {/* 더 로드 중 표시 */}
                {!loading && hasMore && (
                    <div className={`flex justify-center py-4 text-xs ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                            <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                            <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                        </span>
                    </div>
                )}

                {/* CTA */}
                {!loading && !hasMore && sorted.length > 0 && (
                    <Link
                        href="/trading?tab=sim"
                        className={`mt-5 flex items-center justify-between px-5 py-4 rounded-2xl border transition-all hover:scale-[1.004] active:scale-[0.998] group ${
                            isLight
                                ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                                : "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-800/60"
                        }`}
                    >
                        <div>
                            <div className={`text-sm font-semibold ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                                이 코인들, 모의투자로 먼저 연습해보세요
                            </div>
                            <div className={`text-xs mt-0.5 ${isLight ? "text-emerald-600" : "text-emerald-600/70"}`}>
                                바이낸스 실시간 가격 기반 · 가상 10,000 USDT · 무료
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ml-4 transition-transform group-hover:translate-x-0.5 ${isLight ? "text-emerald-700" : "text-emerald-500"}`}>
                            모의투자 하기
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
