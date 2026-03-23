"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import type { FundingCoin } from "@/app/api/funding/route";

type SortMode = "extreme" | "long_risk" | "short_risk";

const TABS: { key: SortMode; label: string; desc: string }[] = [
    { key: "extreme",    label: "극단 순위",  desc: "양방향 극단 펀딩비 코인 — 시장이 한쪽으로 쏠린 신호" },
    { key: "long_risk",  label: "롱 과열",   desc: "롱 포지션 과열 (longs pay shorts) — 높을수록 조정 위험" },
    { key: "short_risk", label: "숏 과열",   desc: "숏 포지션 과열 (shorts pay longs) — 반등 가능성 신호" },
];

function fmtPrice(n: number): string {
    if (n >= 10000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (n >= 1)     return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 0.01)  return `$${n.toFixed(4)}`;
    return `$${n.toFixed(6)}`;
}

function useCountdowns(coins: FundingCoin[]) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    return (nextFundingTime: number) => {
        const diff = Math.max(0, nextFundingTime - now);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };
}

function RateBar({ rate, isLight }: { rate: number; isLight: boolean }) {
    const abs = Math.abs(rate);
    const isPos = rate >= 0;
    // typical range: -0.05% ~ +0.05%, extreme: beyond
    const fill = Math.min(100, (abs / 0.05) * 100);
    const color = isPos
        ? abs >= 0.03 ? "#ef4444" : abs >= 0.01 ? "#f97316" : "#f59e0b"
        : abs >= 0.03 ? "#10b981" : abs >= 0.01 ? "#34d399" : "#6ee7b7";

    return (
        <div className="flex flex-col items-end gap-1">
            <span
                className="text-sm font-bold tabular-nums"
                style={{ color }}
            >
                {rate >= 0 ? "+" : ""}{rate.toFixed(4)}%
            </span>
            <div className={`w-16 h-[3px] rounded-full overflow-hidden ${isLight ? "bg-neutral-200" : "bg-white/10"}`}>
                <div className="h-full rounded-full" style={{ width: `${fill}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function SkeletonRow({ isLight }: { isLight: boolean }) {
    const p = isLight ? "bg-neutral-200" : "bg-surface-elevated";
    return (
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${isLight ? "border-neutral-100" : "border-border-subtle"}`}>
            <div className={`w-4 h-2.5 rounded ${p} animate-pulse shrink-0`} />
            <div className="flex items-center gap-2.5 flex-1">
                <div className={`w-8 h-8 rounded-full ${p} animate-pulse shrink-0`} />
                <div className="flex flex-col gap-1.5">
                    <div className={`w-16 h-2.5 rounded ${p} animate-pulse`} />
                    <div className={`w-10 h-2 rounded ${p} animate-pulse`} />
                </div>
            </div>
            <div className={`w-20 h-4 rounded ${p} animate-pulse hidden sm:block`} />
            <div className={`w-16 h-2.5 rounded ${p} animate-pulse hidden md:block`} />
            <div className={`w-20 h-2.5 rounded ${p} animate-pulse hidden lg:block`} />
        </div>
    );
}

export default function FundingClient() {
    const [coins, setCoins] = useState<FundingCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<SortMode>("extreme");
    const [isLight, setIsLight] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const getCountdown = useCountdowns(coins);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);

    const load = () => {
        fetch("/api/funding")
            .then((r) => r.json())
            .then((d: FundingCoin[]) => { setCoins(d); setUpdatedAt(new Date()); })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

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

    const activeTab = TABS.find((t) => t.key === sortMode)!;

    const bg       = isLight ? "bg-neutral-50"   : "bg-black";
    const cardBg   = isLight ? "bg-white border-neutral-200" : "bg-surface-card border-border-subtle";
    const hoverRow = isLight ? "hover:bg-neutral-50"         : "hover:bg-surface-hover/20";
    const divider  = isLight ? "border-neutral-100"          : "border-border-subtle";
    const tabActive   = isLight ? "bg-white text-neutral-800 shadow-sm border border-neutral-200" : "bg-surface-hover text-white shadow-sm";
    const tabInactive = isLight ? "text-neutral-500 hover:text-neutral-700" : "text-text-muted hover:text-text-secondary";
    const tabWrap     = isLight ? "bg-neutral-100 border border-neutral-200" : "bg-surface-input/60 border border-border-subtle";
    const colHead     = isLight ? "text-neutral-400 border-neutral-100 bg-neutral-50/80" : "text-text-muted border-border-subtle bg-surface-elevated/30";
    const muted       = isLight ? "text-neutral-400" : "text-text-muted";

    const avgColor = avgRate > 0.01 ? "text-red-500" : avgRate < -0.01 ? "text-emerald-500" : isLight ? "text-neutral-500" : "text-text-muted";

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">

                {/* 헤더 */}
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-text-primary"}`}>
                            코인 펀딩비 순위
                        </h1>
                        <p className={`text-xs mt-0.5 ${muted}`}>{activeTab.desc}</p>
                    </div>
                    {updatedAt && (
                        <span className={`text-[11px] ${muted}`}>
                            {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준
                        </span>
                    )}
                </div>

                {/* 시장 요약 */}
                {!loading && (
                    <div className={`mb-4 flex items-center gap-4 px-4 py-3 rounded-xl border text-xs ${isLight ? "bg-white border-neutral-200" : "bg-surface-card border-border-subtle"}`}>
                        <div className="flex items-center gap-2">
                            <span className={muted}>시장 평균 펀딩비</span>
                            <span className={`font-bold tabular-nums ${avgColor}`}>
                                {avgRate >= 0 ? "+" : ""}{avgRate.toFixed(4)}%
                            </span>
                        </div>
                        <div className={`h-3 w-px ${isLight ? "bg-neutral-200" : "bg-border-subtle"}`} />
                        <div className={muted}>
                            {avgRate > 0.01
                                ? "롱 포지션 과열 구간 — 단기 조정 위험"
                                : avgRate < -0.01
                                ? "숏 포지션 과열 구간 — 반등 가능성"
                                : "중립 구간"}
                        </div>
                    </div>
                )}

                {/* 탭 */}
                <div className="mb-4 overflow-x-auto pb-0.5">
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${tabWrap}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSortMode(tab.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${sortMode === tab.key ? tabActive : tabInactive}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 리스트 */}
                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                    <div className={`hidden md:flex items-center gap-3 px-4 py-2 text-[11px] font-medium border-b ${colHead}`}>
                        <span className="w-5 text-right shrink-0">#</span>
                        <span className="flex-1">코인</span>
                        <span className="w-32 text-right shrink-0">펀딩비</span>
                        <span className="w-24 text-right shrink-0 hidden md:block">연 환산</span>
                        <span className="w-24 text-right shrink-0 hidden lg:block">다음 정산</span>
                        <span className="w-28 text-right shrink-0 hidden sm:block">현재가</span>
                    </div>

                    {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} isLight={isLight} />)}

                    {!loading && sorted.slice(0, 50).map((coin, idx) => {
                        const isPos = coin.fundingRatePct >= 0;
                        const annColor = isPos
                            ? Math.abs(coin.annualizedPct) >= 30 ? "text-red-500" : "text-orange-500"
                            : Math.abs(coin.annualizedPct) >= 30 ? "text-emerald-500" : "text-emerald-400";

                        return (
                            <div
                                key={coin.symbol}
                                className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${divider} ${hoverRow}`}
                            >
                                <span className={`w-5 text-[11px] text-right shrink-0 tabular-nums ${isLight ? "text-neutral-300" : "text-text-muted/50"}`}>
                                    {idx + 1}
                                </span>

                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="relative w-8 h-8 shrink-0">
                                        <Image
                                            src={`https://assets.coincap.io/assets/icons/${coin.base}@2x.png`}
                                            alt={coin.base}
                                            fill
                                            className="object-contain rounded-full"
                                            unoptimized
                                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-semibold uppercase leading-snug ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                            {coin.base.toUpperCase()}
                                        </div>
                                        <div className={`text-[11px] ${muted}`}>USDT 무기한</div>
                                    </div>
                                </div>

                                <div className="w-32 text-right shrink-0">
                                    <RateBar rate={coin.fundingRatePct} isLight={isLight} />
                                </div>

                                <div className={`w-24 text-xs tabular-nums text-right shrink-0 hidden md:block font-medium ${annColor}`}>
                                    {coin.annualizedPct >= 0 ? "+" : ""}{coin.annualizedPct.toFixed(1)}%/yr
                                </div>

                                <div className={`w-24 text-xs tabular-nums text-right shrink-0 hidden lg:block font-mono ${muted}`}>
                                    {getCountdown(coin.nextFundingTime)}
                                </div>

                                <div className={`w-28 text-sm font-mono tabular-nums text-right shrink-0 hidden sm:block ${isLight ? "text-neutral-700" : "text-text-primary"}`}>
                                    {fmtPrice(coin.markPrice)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 설명 */}
                {!loading && (
                    <div className={`mt-5 px-4 py-4 rounded-xl border text-xs leading-relaxed ${isLight ? "bg-white border-neutral-200 text-neutral-500" : "bg-surface-card border-border-subtle text-text-muted"}`}>
                        <strong className={isLight ? "text-neutral-700" : "text-text-secondary"}>펀딩비란?</strong>{" "}
                        선물 무기한 계약에서 포지션 보유자들이 8시간마다 주고받는 비용입니다.
                        <strong className="text-red-500"> 양수(+)</strong>면 롱이 숏에게 지불 (롱 과열),{" "}
                        <strong className="text-emerald-500">음수(-)</strong>면 숏이 롱에게 지불 (숏 과열)합니다.
                        극단적인 펀딩비는 시장 방향 전환의 신호가 될 수 있습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
