"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { FundingCoin } from "@/app/api/funding/route";

type SortMode = "extreme" | "long_risk" | "short_risk";

const TABS: { key: SortMode; label: string }[] = [
    { key: "extreme",    label: "극단 순위" },
    { key: "long_risk",  label: "롱 과열"  },
    { key: "short_risk", label: "숏 과열"  },
];

/* ─── 펀딩비 컬러 ─── */
function rateColor(rate: number): string {
    const abs = Math.abs(rate);
    if (rate >= 0) {
        if (abs >= 0.05) return "#ef4444";
        if (abs >= 0.03) return "#f97316";
        if (abs >= 0.01) return "#f59e0b";
        return "#94a3b8";
    } else {
        if (abs >= 0.05) return "#10b981";
        if (abs >= 0.03) return "#34d399";
        if (abs >= 0.01) return "#6ee7b7";
        return "#94a3b8";
    }
}

/* ─── 시장 시그널 ─── */
function getSignal(avg: number) {
    if (avg > 0.03)  return { label: "롱 강과열", msg: "롱 포지션이 매우 과열돼 있어요. 조정 가능성에 주의하세요.", color: "#ef4444", bg: "bg-red-500/8",    border: "border-red-500/15",    lbg: "bg-red-50",    lborder: "border-red-200"    };
    if (avg > 0.01)  return { label: "롱 과열",   msg: "롱이 숏에게 비용을 지불 중이에요. 단기 조정 가능성이 있어요.", color: "#f97316", bg: "bg-orange-500/8",  border: "border-orange-500/15", lbg: "bg-orange-50", lborder: "border-orange-200" };
    if (avg < -0.03) return { label: "숏 강과열", msg: "숏 포지션이 매우 과열돼 있어요. 반등 시그널을 주목하세요.", color: "#10b981", bg: "bg-emerald-500/8", border: "border-emerald-500/15",lbg: "bg-emerald-50",lborder: "border-emerald-200"};
    if (avg < -0.01) return { label: "숏 과열",   msg: "숏이 롱에게 비용을 지불 중이에요. 반등 가능성을 열어두세요.", color: "#34d399", bg: "bg-emerald-500/8", border: "border-emerald-500/15",lbg: "bg-emerald-50",lborder: "border-emerald-200"};
    return           { label: "중립",     msg: "롱·숏 모두 균형 잡힌 상태예요. 과열 신호가 없어요.",           color: "#94a3b8", bg: "bg-slate-500/8",   border: "border-slate-500/15",  lbg: "bg-slate-50",  lborder: "border-slate-200"  };
}

/* ─── 글로벌 카운트다운 ─── */
function useNextFunding(coins: FundingCoin[]) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const nextTime = useMemo(() => {
        if (!coins.length) return null;
        return Math.min(...coins.map((c) => c.nextFundingTime));
    }, [coins]);

    if (!nextTime) return null;
    const diff = Math.max(0, nextTime - now);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/* ─── 스켈레톤 ─── */
function Sk({ w = "w-20", h = "h-4", isLight }: { w?: string; h?: string; isLight: boolean }) {
    return <div className={`${w} ${h} rounded-xl ${isLight ? "bg-neutral-100" : "bg-white/[0.06]"} animate-pulse`} />;
}

/* ─── Main ─── */
export default function FundingClient() {
    const [coins, setCoins] = useState<FundingCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<SortMode>("extreme");
    const [isLight, setIsLight] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const countdown = useNextFunding(coins);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        fetch("/api/funding")
            .then((r) => r.json())
            .then((d: FundingCoin[]) => { setCoins(d); setUpdatedAt(new Date()); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const sorted = useMemo(() => {
        const list = [...coins];
        switch (sortMode) {
            case "long_risk":  return list.sort((a, b) => b.fundingRatePct - a.fundingRatePct);
            case "short_risk": return list.sort((a, b) => a.fundingRatePct - b.fundingRatePct);
            default:           return list.sort((a, b) => Math.abs(b.fundingRatePct) - Math.abs(a.fundingRatePct));
        }
    }, [coins, sortMode]);

    const avgRate = useMemo(() => {
        if (!coins.length) return 0;
        return coins.reduce((s, c) => s + c.fundingRatePct, 0) / coins.length;
    }, [coins]);

    /* theme */
    const bg       = isLight ? "bg-[#f5f5f5]" : "bg-[#0a0a0a]";
    const card     = isLight ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "bg-[#141414]";
    const muted    = isLight ? "text-neutral-400" : "text-neutral-500";
    const primary  = isLight ? "text-neutral-900" : "text-white";
    const divider  = isLight ? "border-neutral-100" : "border-white/[0.05]";
    const rowHover = isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.025]";

    const signal = getSignal(avgRate);

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-lg mx-auto px-4 pb-24 pt-6 space-y-3">

                {/* ── 헤더 ── */}
                <div className="flex items-end justify-between px-1 mb-1">
                    <div>
                        <h1 className={`text-lg font-bold tracking-tight ${primary}`}>코인 펀딩비 순위</h1>
                        <p className={`text-xs mt-0.5 ${muted}`}>바이낸스 선물 무기한 계약 · 8시간마다 정산</p>
                    </div>
                    {updatedAt && (
                        <span className={`text-[11px] ${muted}`}>
                            {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준
                        </span>
                    )}
                </div>

                {/* ── 시장 시그널 카드 ── */}
                <div className={`rounded-3xl p-5 border ${isLight ? `${signal.lbg} ${signal.lborder}` : `${signal.bg} ${signal.border}`}`}>
                    {loading ? (
                        <div className="space-y-2.5">
                            <Sk w="w-24" h="h-5" isLight={isLight} />
                            <Sk w="w-full" h="h-3" isLight={isLight} />
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm font-bold" style={{ color: signal.color }}>
                                        {signal.label}
                                    </span>
                                    <span className="text-lg font-bold tabular-nums" style={{ color: signal.color }}>
                                        {avgRate >= 0 ? "+" : ""}{avgRate.toFixed(4)}%
                                    </span>
                                </div>
                                <p className={`text-xs leading-relaxed ${muted}`}>{signal.msg}</p>
                            </div>
                            {countdown && (
                                <div className="text-right shrink-0">
                                    <div className={`text-[10px] mb-0.5 ${muted}`}>다음 정산</div>
                                    <div className="text-sm font-mono font-bold tabular-nums" style={{ color: signal.color }}>
                                        {countdown}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── 탭 ── */}
                <div className={`rounded-3xl overflow-hidden ${card}`}>
                    {/* 필터 탭 */}
                    <div className={`flex gap-1 p-2.5 border-b ${divider}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSortMode(tab.key)}
                                className={`flex-1 py-2 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                                    sortMode === tab.key
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

                    {/* 로딩 */}
                    {loading && Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 px-5 py-4 border-b ${divider}`}>
                            <Sk w="w-4" h="h-3" isLight={isLight} />
                            <div className={`w-9 h-9 rounded-full ${isLight ? "bg-neutral-100" : "bg-white/[0.06]"} animate-pulse shrink-0`} />
                            <div className="flex-1 space-y-2">
                                <Sk w="w-16" h="h-3.5" isLight={isLight} />
                                <Sk w="w-10" h="h-2.5" isLight={isLight} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Sk w="w-20" h="h-4" isLight={isLight} />
                                <Sk w="w-14" h="h-2.5" isLight={isLight} />
                            </div>
                        </div>
                    ))}

                    {/* 코인 행 */}
                    {!loading && sorted.slice(0, 50).map((coin, idx) => {
                        const color = rateColor(coin.fundingRatePct);
                        const fill = Math.min(100, (Math.abs(coin.fundingRatePct) / 0.05) * 100);
                        const isPos = coin.fundingRatePct >= 0;

                        return (
                            <motion.div
                                key={coin.symbol}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: Math.min(idx * 0.012, 0.25), duration: 0.2 }}
                                className={`flex items-center gap-3 px-5 py-4 border-b last:border-b-0 transition-colors ${divider} ${rowHover}`}
                            >
                                {/* 순위 */}
                                <span className={`w-5 text-[11px] tabular-nums text-right shrink-0 ${isLight ? "text-neutral-300" : "text-neutral-700"}`}>
                                    {idx + 1}
                                </span>

                                {/* 아이콘 */}
                                <div className="relative w-9 h-9 shrink-0">
                                    <Image
                                        src={`https://assets.coincap.io/assets/icons/${coin.base}@2x.png`}
                                        alt={coin.base}
                                        fill
                                        className="object-contain rounded-full"
                                        unoptimized
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                </div>

                                {/* 코인명 */}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold uppercase ${primary}`}>
                                        {coin.base.toUpperCase()}
                                    </div>
                                    <div className={`text-[11px] tabular-nums ${muted}`}>
                                        {coin.annualizedPct >= 0 ? "+" : ""}{coin.annualizedPct.toFixed(1)}%/yr
                                    </div>
                                </div>

                                {/* 펀딩비 */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className="text-[15px] font-bold tabular-nums leading-none" style={{ color }}>
                                        {isPos ? "+" : ""}{coin.fundingRatePct.toFixed(4)}%
                                    </span>
                                    {/* 미니 강도 바 */}
                                    <div className={`w-16 h-[2px] rounded-full overflow-hidden ${isLight ? "bg-neutral-100" : "bg-white/[0.06]"}`}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${fill}%`, backgroundColor: color }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── 푸터 안내 ── */}
                {!loading && (
                    <p className={`text-center text-xs leading-relaxed px-2 ${muted}`}>
                        <span className="text-red-400 font-medium">+양수</span> 롱이 숏에 지불 (롱 과열) &nbsp;·&nbsp;
                        <span className="text-emerald-400 font-medium">−음수</span> 숏이 롱에 지불 (숏 과열)
                    </p>
                )}
            </div>
        </div>
    );
}
