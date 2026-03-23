"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { RankingCoin } from "@/app/api/ranking/route";

type SortMode = "market_cap" | "volume" | "gainers" | "losers" | "ath_drop";

const TABS: { key: SortMode; label: string; desc: string }[] = [
    { key: "market_cap", label: "시가총액", desc: "시가총액 기준 상위 100개 코인" },
    { key: "volume", label: "거래대금", desc: "24시간 거래대금이 가장 많은 코인" },
    { key: "gainers", label: "급등", desc: "24시간 가장 많이 오른 코인" },
    { key: "losers", label: "급락", desc: "24시간 가장 많이 내린 코인" },
    { key: "ath_drop", label: "고점낙폭", desc: "역대 최고점(ATH) 대비 가장 많이 하락한 코인" },
];

function fmtPrice(n: number): string {
    if (n >= 10000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(6)}`;
}

function fmtLarge(n: number): string {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
}

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
            <polyline points={pts} fill="none" stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function AthBadge({ pct }: { pct: number }) {
    const abs = Math.abs(pct);
    const color = abs >= 80 ? "text-red-500" : abs >= 50 ? "text-orange-500" : abs >= 20 ? "text-amber-500" : "text-emerald-500";
    return <span className={`text-xs font-semibold tabular-nums ${color}`}>{pct.toFixed(1)}%</span>;
}

export default function RankingClient() {
    const [coins, setCoins] = useState<RankingCoin[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetch("/api/ranking")
            .then((r) => r.json())
            .then((data: RankingCoin[]) => {
                setCoins(data);
                setUpdatedAt(new Date());
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const sorted = useMemo(() => {
        const list = [...coins];
        switch (sortMode) {
            case "volume":
                return list.sort((a, b) => b.total_volume - a.total_volume);
            case "gainers":
                return list.sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
            case "losers":
                return list.sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));
            case "ath_drop":
                return list.sort((a, b) => (a.ath_change_percentage ?? 0) - (b.ath_change_percentage ?? 0));
            default:
                return list; // market_cap_desc (already sorted by API)
        }
    }, [coins, sortMode]);

    const activeTab = TABS.find((t) => t.key === sortMode)!;

    const cardBg = isLight ? "bg-white border-neutral-200" : "bg-surface-card border-border-subtle";
    const hoverRow = isLight ? "hover:bg-neutral-50" : "hover:bg-surface-hover/30";
    const divider = isLight ? "border-neutral-100" : "border-border-subtle";
    const tabActive = isLight ? "bg-white text-neutral-800 shadow-sm border border-neutral-200" : "bg-surface-hover text-white shadow-sm";
    const tabInactive = isLight ? "text-neutral-500 hover:text-neutral-700" : "text-text-muted hover:text-text-secondary";
    const tabWrap = isLight ? "bg-neutral-100 border border-neutral-200" : "bg-surface-input/60 border border-border-subtle";

    return (
        <div className={`min-h-screen ${isLight ? "bg-neutral-50" : "bg-black"}`}>
            <div className="max-w-5xl mx-auto px-4 pb-20 pt-6">

                {/* 헤더 */}
                <div className="mb-6">
                    <div className="flex items-end justify-between mb-1">
                        <h1 className={`text-2xl font-bold ${isLight ? "text-neutral-900" : "text-text-primary"}`}>
                            코인 랭킹
                        </h1>
                        {updatedAt && (
                            <span className={`text-xs ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준
                            </span>
                        )}
                    </div>
                    <p className={`text-sm ${isLight ? "text-neutral-500" : "text-text-muted"}`}>
                        {activeTab.desc}
                    </p>
                </div>

                {/* 탭 */}
                <div className="mb-4 overflow-x-auto">
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

                {/* 고점낙폭 설명 */}
                {sortMode === "ath_drop" && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-xs leading-relaxed border ${isLight ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-950/30 border-amber-900/40 text-amber-400/80"}`}>
                        <span className="font-semibold">역대 최고점(ATH) 대비 낙폭</span> — 코인이 역대 가장 높았던 가격 대비 지금 얼마나 떨어져 있는지를 나타냅니다.
                        낙폭이 클수록 고점에서 많이 하락한 상태입니다.
                    </div>
                )}

                {/* 리스트 */}
                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                    {/* 컬럼 헤더 */}
                    <div className={`hidden md:flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium border-b ${isLight ? "text-neutral-400 border-neutral-100 bg-neutral-50" : "text-text-muted border-border-subtle bg-surface-elevated/40"}`}>
                        <span className="w-6 text-right shrink-0">#</span>
                        <span className="flex-1">코인</span>
                        <span className="w-28 text-right shrink-0">현재가</span>
                        <span className="w-16 text-right shrink-0">24h</span>
                        <span className="w-24 text-right shrink-0 hidden lg:block">
                            {sortMode === "volume" ? "거래대금" : sortMode === "ath_drop" ? "고점낙폭" : "시가총액"}
                        </span>
                        <span className="w-16 text-right shrink-0 hidden xl:block">7일 추세</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isLight ? "border-neutral-300 border-t-neutral-600" : "border-border-subtle border-t-text-muted"}`} />
                        </div>
                    ) : (
                        sorted.map((coin, idx) => {
                            const pct = coin.price_change_percentage_24h ?? 0;
                            const isUp = pct >= 0;
                            const pctColor = isUp ? "text-emerald-500" : "text-red-500";
                            const secondaryVal =
                                sortMode === "volume"
                                    ? fmtLarge(coin.total_volume)
                                    : sortMode === "ath_drop"
                                    ? null
                                    : fmtLarge(coin.market_cap);

                            return (
                                <div
                                    key={coin.id}
                                    className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${divider} ${hoverRow}`}
                                >
                                    {/* 순위 */}
                                    <span className={`w-6 text-xs text-right shrink-0 tabular-nums ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
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
                                            <div className={`text-sm font-semibold leading-tight truncate ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                                {coin.name}
                                            </div>
                                            <div className={`text-[11px] uppercase leading-tight ${isLight ? "text-neutral-400" : "text-text-muted"}`}>
                                                {coin.symbol}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 현재가 */}
                                    <div className={`w-28 text-sm font-mono tabular-nums text-right shrink-0 ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                        {fmtPrice(coin.current_price)}
                                    </div>

                                    {/* 24h 등락 */}
                                    <div className={`w-16 text-sm font-semibold text-right shrink-0 tabular-nums ${pctColor}`}>
                                        {isUp ? "+" : ""}{pct.toFixed(2)}%
                                    </div>

                                    {/* 보조 지표 */}
                                    <div className="w-24 text-right shrink-0 hidden lg:block">
                                        {sortMode === "ath_drop" ? (
                                            <AthBadge pct={coin.ath_change_percentage ?? 0} />
                                        ) : (
                                            <span className={`text-xs tabular-nums ${isLight ? "text-neutral-500" : "text-text-muted"}`}>
                                                {secondaryVal}
                                            </span>
                                        )}
                                    </div>

                                    {/* 스파크라인 */}
                                    <div className="hidden xl:flex w-16 justify-end shrink-0">
                                        <Sparkline prices={coin.sparkline_in_7d?.price ?? []} isUp={isUp} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* CTA 배너 */}
                {!loading && sorted.length > 0 && (
                    <Link
                        href="/trading?tab=sim"
                        className={`mt-6 flex items-center justify-between px-5 py-4 rounded-2xl border transition-all hover:scale-[1.005] active:scale-[0.998] group ${
                            isLight
                                ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                                : "bg-emerald-950/30 border-emerald-900/50 hover:border-emerald-700/60"
                        }`}
                    >
                        <div>
                            <div className={`text-sm font-semibold ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                                이 코인들, 모의투자로 먼저 연습해보세요
                            </div>
                            <div className={`text-xs mt-0.5 ${isLight ? "text-emerald-600" : "text-emerald-600/80"}`}>
                                바이낸스 실시간 가격 기반 · 가상 자금 10,000 USDT · 무료
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ml-4 transition-transform group-hover:translate-x-0.5 ${isLight ? "text-emerald-700" : "text-emerald-500"}`}>
                            모의투자 하기
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
