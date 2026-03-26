"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { AltseasonData } from "@/app/api/altseason/route";
import { useVirtualList } from "@/hooks/useVirtualList";

type FilterMode = "all" | "outperform" | "underperform";

/* ─── Zone config ─── */
function getZoneConfig(zone: AltseasonData["zone"]) {
    switch (zone) {
        case "altcoin": return {
            label: "알트코인 시즌",
            hex: "#10b981",
            textClass: "text-emerald-500",
            badgeDark: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
            badgeLight: "bg-emerald-50 border-emerald-200 text-emerald-600",
        };
        case "bitcoin": return {
            label: "비트코인 시즌",
            hex: "#f97316",
            textClass: "text-orange-500",
            badgeDark: "bg-orange-500/10 border-orange-500/20 text-orange-400",
            badgeLight: "bg-orange-50 border-orange-200 text-orange-600",
        };
        default: return {
            label: "중립 구간",
            hex: "#94A3B8",
            textClass: "text-slate-400",
            badgeDark: "bg-slate-500/10 border-slate-500/20 text-slate-400",
            badgeLight: "bg-slate-100 border-slate-200 text-slate-500",
        };
    }
}

/* ─── 인사이트 — 헤드라인 + 서브 2줄 ─── */
function getInsight(zone: AltseasonData["zone"], outperformedCount: number, total: number) {
    const under = total - outperformedCount;
    if (zone === "altcoin") return {
        headline: "알트코인이 BTC를 압도하고 있어요",
        sub: `상위 ${total}개 중 ${outperformedCount}개가 BTC보다 좋은 성과를 내고 있어요`,
    };
    if (zone === "bitcoin") return {
        headline: "지금은 BTC가 대세예요",
        sub: `${under}개 코인이 BTC에 뒤처지며 BTC 강세장이 이어지고 있어요`,
    };
    return {
        headline: "아직 방향이 정해지지 않았어요",
        sub: `BTC 초과 ${outperformedCount}개 · BTC 미달 ${under}개로 균형을 이루고 있어요`,
    };
}

/* ─── 점수 카운트업 ─── */
function useCountUp(target: number, enabled: boolean) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!enabled) return;
        const duration = 900;
        const startTime = performance.now();
        let raf: number;
        const tick = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setVal(Math.round(eased * target));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, enabled]);
    return val;
}

/* ─── Arc Gauge ─── */
function ArcGauge({ score, zone, isLight }: { score: number; zone: AltseasonData["zone"]; isLight: boolean }) {
    const { hex } = getZoneConfig(zone);
    const r = 72, cx = 100, cy = 86, sw = 10;
    const angle = Math.PI * (1 - score / 100);
    const dotX = cx + r * Math.cos(angle);
    const dotY = cy - r * Math.sin(angle);
    const trackColor = isLight ? "#e5e7eb" : "#1f2937";

    return (
        <div className="flex justify-center">
            <svg width="200" height="96" viewBox="0 0 200 96" className="overflow-visible">
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round"
                />
                <motion.path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={hex} strokeWidth={sw} strokeLinecap="round"
                    pathLength={1} strokeDasharray={1}
                    initial={{ strokeDashoffset: 1 }}
                    animate={{ strokeDashoffset: 1 - score / 100 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.circle
                    cx={dotX} cy={dotY} r={7}
                    fill="white" stroke={hex} strokeWidth={2.5}
                    style={{ filter: `drop-shadow(0 2px 6px ${hex}55)` }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                />
                <text x={cx - r - 6} y={cy + 15} textAnchor="end" fontSize="9"
                    fill={isLight ? "#9ca3af" : "#6b7280"} fontWeight="500">BTC</text>
                <text x={cx + r + 6} y={cy + 15} textAnchor="start" fontSize="9"
                    fill={isLight ? "#9ca3af" : "#6b7280"} fontWeight="500">ALT</text>
            </svg>
        </div>
    );
}

/* ─── Skeleton ─── */
function Sk({ w = "w-20", h = "h-4", isLight }: { w?: string; h?: string; isLight: boolean }) {
    return (
        <div className={`${w} ${h} rounded-lg ${isLight ? "bg-neutral-200" : "bg-surface-elevated"} animate-pulse`} />
    );
}

/* ─── Main ─── */
export default function AltseasonClient({ initialData }: { initialData?: AltseasonData }) {
    const [data, setData] = useState<AltseasonData | null>(initialData ?? null);
    const [loading, setLoading] = useState(!initialData);
    const [isLight, setIsLight] = useState(false);
    const [filter, setFilter] = useState<FilterMode>("all");

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (initialData) return; // SSR 데이터 있으면 생략
        fetch("/api/altseason")
            .then((r) => r.json())
            .then((d: AltseasonData) => setData(d))
            .catch((e) => console.error("[AltseasonClient] fetch error:", e))
            .finally(() => setLoading(false));
    }, [initialData]);

    const filteredAlts = useMemo(() => {
        if (!data) return [];
        if (filter === "outperform")   return data.alts.filter((c) => c.outperformedBtc);
        if (filter === "underperform") return data.alts.filter((c) => !c.outperformedBtc);
        return data.alts;
    }, [data, filter]);

    /* 가상화 — 필터 변경 시 자동 리셋 */
    const { visibleItems, sentinelRef, hasMore, newBatchStart } = useVirtualList(filteredAlts, 15);

    /* 점수 카운트업 */
    const animatedScore = useCountUp(data?.score ?? 0, !loading && !!data);

    /* ─── 다크모드 토큰 (ranking 페이지와 동일한 시스템) ─── */
    const bg       = isLight ? "bg-neutral-50"                    : "bg-black";
    const cardBg   = isLight ? "bg-white border-neutral-200"      : "bg-surface-card border-border-subtle";
    const hoverRow = isLight ? "hover:bg-neutral-50"              : "hover:bg-surface-hover/20";
    const divider  = isLight ? "border-neutral-100"               : "border-border-subtle";
    const muted    = isLight ? "text-neutral-400"                 : "text-text-muted";
    const primary  = isLight ? "text-neutral-900"                 : "text-text-primary";
    const tabActive   = isLight
        ? "bg-neutral-900 text-white"
        : "bg-surface-hover text-white";
    const tabInactive = isLight
        ? "text-neutral-400 hover:text-neutral-600"
        : "text-text-muted hover:text-text-secondary";

    const zone   = data ? getZoneConfig(data.zone) : null;
    const insight = data && zone ? getInsight(data.zone, data.outperformedCount, data.total) : null;

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-lg mx-auto px-4 pb-24 pt-6 space-y-3">

                {/* ── 헤더 ── */}
                <div className="px-1 mb-1">
                    <h1 className={`text-lg font-bold tracking-tight ${primary}`}>알트코인 시즌 지수</h1>
                    <p className={`text-xs mt-0.5 ${muted}`}>상위 50개 알트코인의 BTC 대비 30일 수익률 기준</p>
                </div>

                {/* ── Hero 카드 ── */}
                <div className={`rounded-2xl border p-6 ${cardBg}`}>
                    {loading ? (
                        <div className="flex flex-col items-center gap-5 py-2">
                            <Sk w="w-28" h="h-6" isLight={isLight} />
                            <Sk w="w-24" h="h-16" isLight={isLight} />
                            <Sk w="w-full" h="h-[80px]" isLight={isLight} />
                            <Sk w="w-2/3" h="h-3.5" isLight={isLight} />
                            <Sk w="w-1/2" h="h-3" isLight={isLight} />
                        </div>
                    ) : data && zone && insight && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* 존 배지 */}
                            <div className="flex justify-center mb-4">
                                <span className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border ${isLight ? zone.badgeLight : zone.badgeDark}`}>
                                    {zone.label}
                                </span>
                            </div>

                            {/* 점수 카운트업 */}
                            <div className="flex flex-col items-center mb-1">
                                <span className={`text-[76px] font-bold tabular-nums leading-none ${zone.textClass}`}>
                                    {animatedScore}
                                </span>
                                <span className={`text-sm mt-1 ${muted}`}>/ 100점</span>
                            </div>

                            {/* 아크 게이지 */}
                            <div className="mt-1 mb-4">
                                <ArcGauge score={data.score} zone={data.zone} isLight={isLight} />
                            </div>

                            {/* 인사이트 — 헤드라인 + 서브 */}
                            <div className="text-center space-y-1">
                                <p className={`text-sm font-semibold leading-snug ${primary}`}>
                                    {insight.headline}
                                </p>
                                <p className={`text-xs leading-relaxed ${muted}`}>
                                    {insight.sub}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* ── 통계 카드 ── */}
                <div className={`rounded-2xl border px-5 py-4 ${cardBg}`}>
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Sk w="w-14" h="h-7" isLight={isLight} />
                                    <Sk w="w-16" h="h-3" isLight={isLight} />
                                </div>
                            ))}
                        </div>
                    ) : data && (
                        <div className={`grid grid-cols-3 divide-x ${isLight ? "divide-neutral-100" : "divide-border-subtle"}`}>
                            <div className="flex flex-col items-center gap-0.5 pr-3">
                                <span className={`text-2xl font-bold tabular-nums text-emerald-500`}>
                                    {data.outperformedCount}
                                    <span className={`text-sm font-normal ml-0.5 ${muted}`}>개</span>
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>BTC 초과</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 px-3">
                                <span className={`text-2xl font-bold tabular-nums ${data.btc30d >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {data.btc30d >= 0 ? "+" : ""}{data.btc30d.toFixed(1)}%
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>BTC 30일</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 pl-3">
                                <span className={`text-2xl font-bold tabular-nums text-red-400`}>
                                    {data.total - data.outperformedCount}
                                    <span className={`text-sm font-normal ml-0.5 ${muted}`}>개</span>
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>BTC 미달</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 코인 리스트 카드 ── */}
                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>

                    {/* 필터 탭 */}
                    {!loading && data && (
                        <div className={`flex gap-1 p-2 border-b ${divider}`}>
                            {([
                                { key: "all",          label: `전체 ${data.alts.length}` },
                                { key: "outperform",   label: `BTC 초과 ${data.outperformedCount}` },
                                { key: "underperform", label: `BTC 미달 ${data.alts.length - data.outperformedCount}` },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                        filter === tab.key ? tabActive : tabInactive
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 로딩 스켈레톤 */}
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3.5 border-b ${divider}`}>
                            <Sk w="w-4" h="h-2.5" isLight={isLight} />
                            <div className={`w-8 h-8 rounded-full ${isLight ? "bg-neutral-200" : "bg-surface-elevated"} animate-pulse shrink-0`} />
                            <div className="flex-1 space-y-1.5">
                                <Sk w="w-20" h="h-2.5" isLight={isLight} />
                                <Sk w="w-12" h="h-2" isLight={isLight} />
                            </div>
                            <Sk w="w-14" h="h-3.5" isLight={isLight} />
                        </div>
                    ))}

                    {/* 코인 행 — 가상화 + stagger 애니메이션 */}
                    {!loading && visibleItems.map((coin, idx) => {
                        const isUp = coin.change30d >= 0;
                        const pctColor = coin.outperformedBtc
                            ? "text-emerald-500"
                            : isUp
                                ? isLight ? "text-neutral-500" : "text-text-muted"
                                : "text-red-500";
                        const batchIdx = Math.max(0, idx - newBatchStart);

                        return (
                            <motion.div
                                key={`${filter}-${coin.id}`}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{
                                    delay: batchIdx * 0.032,
                                    duration: 0.3,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${divider} ${hoverRow}`}
                            >
                                <span className={`w-5 text-[11px] text-right shrink-0 tabular-nums ${isLight ? "text-neutral-300" : "text-text-muted/50"}`}>
                                    {idx + 1}
                                </span>
                                <div className="relative w-8 h-8 shrink-0">
                                    <Image
                                        src={coin.image} alt={coin.name} fill
                                        className="object-contain rounded-full" unoptimized
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold leading-snug truncate ${primary}`}>
                                        {coin.name}
                                    </div>
                                    <div className={`text-[11px] uppercase ${muted}`}>{coin.symbol}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-sm font-bold tabular-nums ${pctColor}`}>
                                        {isUp ? "+" : ""}{coin.change30d.toFixed(1)}%
                                    </div>
                                    {coin.outperformedBtc && (
                                        <div className="text-[10px] text-emerald-500/70 mt-0.5">BTC 초과</div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* 센티넬 */}
                    {!loading && hasMore && (
                        <div ref={sentinelRef} className="h-px" aria-hidden />
                    )}
                </div>

                {/* 더 로드 중 */}
                {!loading && hasMore && (
                    <div className={`flex justify-center py-3 gap-1`}>
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className={`w-1 h-1 rounded-full animate-bounce ${isLight ? "bg-neutral-300" : "bg-text-muted/40"}`}
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </div>
                )}

                {/* 푸터 */}
                {!loading && !hasMore && (
                    <p className={`text-center text-xs ${muted}`}>
                        75점 이상 알트시즌 · 25점 이하 비트코인 시즌 · 30분마다 업데이트
                    </p>
                )}
            </div>
        </div>
    );
}
