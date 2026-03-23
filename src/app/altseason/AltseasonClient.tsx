"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { AltseasonData } from "@/app/api/altseason/route";

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
            hex: "#818cf8",
            textClass: "text-indigo-400",
            badgeDark: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
            badgeLight: "bg-indigo-50 border-indigo-200 text-indigo-600",
        };
    }
}

function getInsight(zone: AltseasonData["zone"], outperformedCount: number, total: number) {
    if (zone === "altcoin")
        return `상위 ${total}개 알트 중 ${outperformedCount}개가 BTC를 앞서고 있어요. 자금이 알트코인으로 이동 중인 알트시즌입니다.`;
    if (zone === "bitcoin")
        return `BTC가 대부분의 알트를 압도하고 있어요. 알트보다 BTC를 보유하는 게 유리한 시장입니다.`;
    return `BTC와 알트가 비슷하게 움직이고 있어요. 아직 방향이 결정되지 않은 중립 구간입니다.`;
}

/* ─── Arc Gauge (SVG 반원) ─── */
function ArcGauge({ score, zone, isLight }: { score: number; zone: AltseasonData["zone"]; isLight: boolean }) {
    const { hex } = getZoneConfig(zone);
    const r = 72;
    const cx = 100;
    const cy = 86;
    const sw = 10; // strokeWidth

    // needle dot position
    const angle = Math.PI * (1 - score / 100);
    const dotX = cx + r * Math.cos(angle);
    const dotY = cy - r * Math.sin(angle);

    const trackColor = isLight ? "#e5e7eb" : "#1f2937";

    return (
        <div className="flex justify-center">
            <svg width="200" height="96" viewBox="0 0 200 96" className="overflow-visible">
                {/* track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round"
                />
                {/* fill — pathLength=1 trick */}
                <motion.path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={hex} strokeWidth={sw} strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    initial={{ strokeDashoffset: 1 }}
                    animate={{ strokeDashoffset: 1 - score / 100 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* needle dot */}
                <motion.circle
                    cx={dotX} cy={dotY} r={7}
                    fill="white" stroke={hex} strokeWidth={2.5}
                    style={{ filter: `drop-shadow(0 2px 6px ${hex}55)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                />
                {/* BTC / ALT 레이블 */}
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
    return <div className={`${w} ${h} rounded-xl ${isLight ? "bg-neutral-100" : "bg-white/[0.06]"} animate-pulse`} />;
}

/* ─── Main ─── */
export default function AltseasonClient() {
    const [data, setData] = useState<AltseasonData | null>(null);
    const [loading, setLoading] = useState(true);
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
        fetch("/api/altseason")
            .then((r) => r.json())
            .then((d: AltseasonData) => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filteredAlts = useMemo(() => {
        if (!data) return [];
        if (filter === "outperform") return data.alts.filter((c) => c.outperformedBtc);
        if (filter === "underperform") return data.alts.filter((c) => !c.outperformedBtc);
        return data.alts;
    }, [data, filter]);

    /* theme tokens */
    const bg       = isLight ? "bg-[#f5f5f5]" : "bg-[#0a0a0a]";
    const card     = isLight ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "bg-[#141414]";
    const muted    = isLight ? "text-neutral-400" : "text-neutral-500";
    const primary  = isLight ? "text-neutral-900" : "text-white";
    const divider  = isLight ? "border-neutral-100" : "border-white/[0.05]";
    const rowHover = isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.025]";

    const zone = data ? getZoneConfig(data.zone) : null;

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-lg mx-auto px-4 pb-24 pt-6 space-y-3">

                {/* ── 헤더 ── */}
                <div className="px-1 mb-1">
                    <h1 className={`text-lg font-bold tracking-tight ${primary}`}>알트코인 시즌 지수</h1>
                    <p className={`text-xs mt-0.5 ${muted}`}>상위 50개 알트코인의 BTC 대비 30일 수익률 기준</p>
                </div>

                {/* ── Hero card ── */}
                <div className={`rounded-3xl p-6 ${card}`}>
                    {loading ? (
                        <div className="flex flex-col items-center gap-5 py-3">
                            <Sk w="w-24" h="h-5" isLight={isLight} />
                            <Sk w="w-20" h="h-16" isLight={isLight} />
                            <Sk w="w-full" h="h-[76px]" isLight={isLight} />
                            <Sk w="w-3/4" h="h-3" isLight={isLight} />
                            <Sk w="w-1/2" h="h-3" isLight={isLight} />
                        </div>
                    ) : data && zone && (
                        <>
                            {/* 존 배지 */}
                            <div className="flex justify-center mb-3">
                                <span className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border ${isLight ? zone.badgeLight : zone.badgeDark}`}>
                                    {zone.label}
                                </span>
                            </div>

                            {/* 점수 */}
                            <div className="flex flex-col items-center">
                                <motion.div
                                    className={`text-[72px] font-bold tabular-nums leading-none ${zone.textClass}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {data.score}
                                </motion.div>
                                <div className={`text-sm mt-0.5 ${muted}`}>/ 100점</div>
                            </div>

                            {/* 아크 게이지 */}
                            <div className="mt-1 mb-3">
                                <ArcGauge score={data.score} zone={data.zone} isLight={isLight} />
                            </div>

                            {/* 인사이트 */}
                            <p className={`text-center text-[13px] leading-relaxed ${muted}`}>
                                {getInsight(data.zone, data.outperformedCount, data.total)}
                            </p>
                        </>
                    )}
                </div>

                {/* ── 통계 카드 ── */}
                <div className={`rounded-3xl px-5 py-4 ${card}`}>
                    {loading ? (
                        <div className="grid grid-cols-3 gap-4">
                            {[0,1,2].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Sk w="w-14" h="h-7" isLight={isLight} />
                                    <Sk w="w-16" h="h-3" isLight={isLight} />
                                </div>
                            ))}
                        </div>
                    ) : data && (
                        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-white/[0.05]">
                            <div className="flex flex-col items-center gap-0.5 pr-4">
                                <span className={`text-2xl font-bold tabular-nums ${primary}`}>
                                    {data.outperformedCount}
                                    <span className={`text-sm font-normal ml-0.5 ${muted}`}>개</span>
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>BTC 초과 코인</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 px-4">
                                <span className={`text-2xl font-bold tabular-nums ${data.btc30d >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {data.btc30d >= 0 ? "+" : ""}{data.btc30d.toFixed(1)}%
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>BTC 30일</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 pl-4">
                                <span className={`text-2xl font-bold tabular-nums ${primary}`}>
                                    {data.total}
                                    <span className={`text-sm font-normal ml-0.5 ${muted}`}>개</span>
                                </span>
                                <span className={`text-[11px] text-center ${muted}`}>분석 알트</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 코인 리스트 카드 ── */}
                <div className={`rounded-3xl overflow-hidden ${card}`}>

                    {/* 필터 탭 */}
                    {!loading && data && (
                        <div className={`flex gap-1 p-2.5 border-b ${divider}`}>
                            {([
                                { key: "all",          label: `전체 ${data.alts.length}` },
                                { key: "outperform",   label: `BTC 초과 ${data.outperformedCount}` },
                                { key: "underperform", label: `BTC 미달 ${data.alts.length - data.outperformedCount}` },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                                        filter === tab.key
                                            ? isLight
                                                ? "bg-neutral-900 text-white"
                                                : "bg-white text-black"
                                            : `${muted} hover:opacity-80`
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 로딩 스켈레톤 */}
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 px-5 py-3.5 border-b ${divider}`}>
                            <Sk w="w-4" h="h-3" isLight={isLight} />
                            <div className={`w-9 h-9 rounded-full ${isLight ? "bg-neutral-100" : "bg-white/[0.06]"} animate-pulse shrink-0`} />
                            <div className="flex-1 space-y-2">
                                <Sk w="w-20" h="h-3" isLight={isLight} />
                                <Sk w="w-12" h="h-2.5" isLight={isLight} />
                            </div>
                            <Sk w="w-14" h="h-4" isLight={isLight} />
                        </div>
                    ))}

                    {/* 코인 행 */}
                    {!loading && data && filteredAlts.map((coin, idx) => {
                        const isUp = coin.change30d >= 0;
                        const pctColor = coin.outperformedBtc
                            ? "text-emerald-500"
                            : isUp
                                ? isLight ? "text-neutral-500" : "text-neutral-400"
                                : "text-red-500";

                        return (
                            <motion.div
                                key={coin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: Math.min(idx * 0.015, 0.3), duration: 0.2 }}
                                className={`flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0 transition-colors ${divider} ${rowHover}`}
                            >
                                <span className={`w-5 text-[11px] tabular-nums text-right shrink-0 ${isLight ? "text-neutral-300" : "text-neutral-700"}`}>
                                    {idx + 1}
                                </span>
                                <div className="relative w-9 h-9 shrink-0">
                                    <Image src={coin.image} alt={coin.name} fill className="object-contain rounded-full" unoptimized />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold truncate ${primary}`}>{coin.name}</div>
                                    <div className={`text-[11px] uppercase ${muted}`}>{coin.symbol}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-sm font-bold tabular-nums ${pctColor}`}>
                                        {isUp ? "+" : ""}{coin.change30d.toFixed(1)}%
                                    </div>
                                    {coin.outperformedBtc
                                        ? <div className="text-[10px] text-emerald-500/60 mt-0.5 text-right">BTC 초과</div>
                                        : <div className={`text-[10px] mt-0.5 text-right ${muted} opacity-50`}>미달</div>
                                    }
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── 푸터 안내 ── */}
                {!loading && (
                    <p className={`text-center text-xs leading-relaxed px-2 ${muted}`}>
                        75점 이상 알트시즌 · 25점 이하 비트코인 시즌<br />
                        Blockchain Center 방법론 참고 · 30분마다 업데이트
                    </p>
                )}
            </div>
        </div>
    );
}
