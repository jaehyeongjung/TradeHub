"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ResearchCoin } from "@/app/api/research/route";
import type { CoinDetail } from "@/app/api/research/[id]/route";

// ─── 포맷 유틸 ─────────────────────────────────────────────
function fmtPrice(n: number) {
    if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return "$" + n.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}
function fmtLarge(n: number) {
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    return "$" + n.toLocaleString();
}
function fmtSupply(n: number) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return n.toFixed(0);
}

// ─── 점수 색상 ──────────────────────────────────────────────
function scoreColor(score: number) {
    if (score >= 70) return { text: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
    if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" };
    return { text: "text-red-400", bg: "bg-red-500/15 border-red-500/30" };
}
function scoreColorLight(score: number) {
    if (score >= 70) return { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (score >= 50) return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    return { text: "text-red-700", bg: "bg-red-50 border-red-200" };
}

// ─── 공급량 바 ──────────────────────────────────────────────
function SupplyBar({ coin, isLight }: { coin: ResearchCoin; isLight: boolean }) {
    const base = coin.max_supply ?? coin.total_supply ?? coin.circulating_supply;
    if (!base || base === 0) return <span className="text-xs text-neutral-500">데이터 없음</span>;

    const circPct = Math.min(100, (coin.circulating_supply / base) * 100);
    const totalPct = coin.total_supply ? Math.min(100, (coin.total_supply / base) * 100) : circPct;
    const lockedPct = Math.max(0, totalPct - circPct);
    const unmintedPct = coin.max_supply ? Math.max(0, 100 - totalPct) : 0;

    const trackBg = isLight ? "bg-neutral-200" : "bg-white/10";

    return (
        <div className="space-y-1">
            <div className={`relative h-2 rounded-full overflow-hidden ${trackBg}`}>
                <div className="absolute left-0 top-0 h-full flex">
                    <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${circPct}%` }} />
                    {lockedPct > 0 && (
                        <div className="h-full bg-amber-500/60" style={{ width: `${lockedPct}%` }} />
                    )}
                    {unmintedPct > 0 && (
                        <div className="h-full bg-neutral-500/40" style={{ width: `${unmintedPct}%` }} />
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-500 font-medium">{circPct.toFixed(0)}% 유통</span>
                {lockedPct > 0 && <span className="text-amber-500/80">{lockedPct.toFixed(0)}% 잠금</span>}
                {unmintedPct > 0 && <span className="text-neutral-500">{unmintedPct.toFixed(0)}% 미발행</span>}
                {!coin.max_supply && <span className={isLight ? "text-neutral-400" : "text-neutral-500"}>∞ 무제한</span>}
            </div>
        </div>
    );
}

// ─── 스켈레톤 ──────────────────────────────────────────────
function SkeletonRow({ isLight }: { isLight: boolean }) {
    const pulse = isLight ? "bg-neutral-200" : "bg-white/8";
    const border = isLight ? "border-neutral-100" : "border-white/5";
    return (
        <div className={`flex items-center gap-3 px-4 py-4 border-b ${border}`}>
            <div className={`w-5 h-3 rounded ${pulse} animate-pulse`} />
            <div className={`w-8 h-8 rounded-full ${pulse} animate-pulse`} />
            <div className="flex-1 space-y-2">
                <div className={`w-24 h-3 rounded ${pulse} animate-pulse`} />
                <div className={`w-16 h-2 rounded ${pulse} animate-pulse`} />
            </div>
            <div className={`w-16 h-3 rounded ${pulse} animate-pulse hidden md:block`} />
            <div className={`w-20 h-3 rounded ${pulse} animate-pulse`} />
        </div>
    );
}

// ─── 상세 드로어 ────────────────────────────────────────────
function DetailDrawer({
    coin,
    onClose,
    isLight,
}: {
    coin: ResearchCoin;
    onClose: () => void;
    isLight: boolean;
}) {
    const [detail, setDetail] = useState<CoinDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);

    useEffect(() => {
        setLoadingDetail(true);
        fetch(`/api/research/${coin.id}`)
            .then((r) => r.json())
            .then((d: CoinDetail) => setDetail(d))
            .catch(() => setDetail(null))
            .finally(() => setLoadingDetail(false));
    }, [coin.id]);

    const bg = isLight ? "bg-white" : "bg-[#0e0e0e]";
    const border = isLight ? "border-neutral-200" : "border-white/8";
    const textPrimary = isLight ? "text-neutral-900" : "text-white";
    const textMuted = isLight ? "text-neutral-500" : "text-neutral-400";
    const cardBg = isLight ? "bg-neutral-50 border-neutral-200" : "bg-white/4 border-white/8";
    const sc = isLight ? scoreColorLight(coin.score) : scoreColor(coin.score);

    const pct24 = coin.price_change_percentage_24h ?? 0;
    const pct7d = coin.price_change_percentage_7d ?? 0;

    // 점수 breakdown 바
    const bars = [
        { label: "공급 건전성", value: coin.score_breakdown.supply, max: 30 },
        { label: "유동성", value: coin.score_breakdown.liquidity, max: 25 },
        { label: "실사용 (TVL)", value: coin.score_breakdown.usage, max: 30 },
        { label: "모멘텀", value: coin.score_breakdown.momentum, max: 15 },
    ];

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed top-0 right-0 h-full w-full max-w-md z-[200] shadow-2xl flex flex-col ${bg} border-l ${border}`}
        >
            {/* 헤더 */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${border} flex-shrink-0`}>
                <Image src={coin.image} alt={coin.name} width={36} height={36} className="rounded-full" unoptimized />
                <div>
                    <div className={`font-bold text-base ${textPrimary}`}>{coin.name}</div>
                    <div className={`text-xs uppercase ${textMuted}`}>{coin.symbol}</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text}`}>
                        {coin.score}점
                    </span>
                    <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-white/8 transition-colors ${textMuted}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* 가격 */}
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                    <div className={`text-2xl font-bold ${textPrimary}`}>{fmtPrice(coin.current_price)}</div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`text-sm font-semibold ${pct24 >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                            {pct24 >= 0 ? "+" : ""}{pct24.toFixed(2)}% (24h)
                        </span>
                        <span className={`text-sm font-semibold ${pct7d >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                            {pct7d >= 0 ? "+" : ""}{pct7d.toFixed(2)}% (7d)
                        </span>
                    </div>
                    <div className={`mt-2 text-xs ${textMuted}`}>
                        시가총액 {fmtLarge(coin.market_cap)} · 거래량 {fmtLarge(coin.total_volume)}
                    </div>
                </div>

                {/* 점수 분석 */}
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                    <div className={`text-xs font-semibold tracking-wider uppercase mb-3 ${textMuted}`}>점수 분석</div>
                    <div className="space-y-2.5">
                        {bars.map((b) => (
                            <div key={b.label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={textMuted}>{b.label}</span>
                                    <span className={`font-semibold ${textPrimary}`}>{b.value}/{b.max}</span>
                                </div>
                                <div className={`h-1.5 rounded-full ${isLight ? "bg-neutral-200" : "bg-white/10"}`}>
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${(b.value / b.max) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 공급량 */}
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                    <div className={`text-xs font-semibold tracking-wider uppercase mb-3 ${textMuted}`}>토크노믹스</div>
                    <SupplyBar coin={coin} isLight={isLight} />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className={`text-[10px] ${textMuted}`}>현재 유통</div>
                            <div className={`text-xs font-semibold mt-0.5 ${textPrimary}`}>{fmtSupply(coin.circulating_supply)}</div>
                        </div>
                        <div>
                            <div className={`text-[10px] ${textMuted}`}>총 발행</div>
                            <div className={`text-xs font-semibold mt-0.5 ${textPrimary}`}>
                                {coin.total_supply ? fmtSupply(coin.total_supply) : "—"}
                            </div>
                        </div>
                        <div>
                            <div className={`text-[10px] ${textMuted}`}>최대 공급</div>
                            <div className={`text-xs font-semibold mt-0.5 ${textPrimary}`}>
                                {coin.max_supply ? fmtSupply(coin.max_supply) : "∞"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TVL */}
                {coin.tvl && (
                    <div className={`rounded-xl border p-4 ${cardBg}`}>
                        <div className={`text-xs font-semibold tracking-wider uppercase mb-2 ${textMuted}`}>실사용 (TVL)</div>
                        <div className={`text-xl font-bold ${textPrimary}`}>{fmtLarge(coin.tvl)}</div>
                        {coin.tvl_change_7d != null && (
                            <div className={`text-xs mt-1 ${coin.tvl_change_7d >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                                7일 {coin.tvl_change_7d >= 0 ? "+" : ""}{coin.tvl_change_7d.toFixed(2)}%
                            </div>
                        )}
                        <div className={`text-xs mt-1 ${textMuted}`}>
                            TVL/시총 비율 {((coin.tvl / coin.market_cap) * 100).toFixed(1)}%
                        </div>
                    </div>
                )}

                {/* 기본 정보 + 개발 활동 */}
                {loadingDetail ? (
                    <div className={`rounded-xl border p-4 ${cardBg} animate-pulse`}>
                        <div className={`h-3 w-24 rounded ${isLight ? "bg-neutral-200" : "bg-white/10"} mb-3`} />
                        <div className={`h-2 w-full rounded ${isLight ? "bg-neutral-200" : "bg-white/10"} mb-2`} />
                        <div className={`h-2 w-3/4 rounded ${isLight ? "bg-neutral-200" : "bg-white/10"}`} />
                    </div>
                ) : detail ? (
                    <>
                        {/* 기본 정보 */}
                        <div className={`rounded-xl border p-4 ${cardBg}`}>
                            <div className={`text-xs font-semibold tracking-wider uppercase mb-3 ${textMuted}`}>기본 정보</div>
                            <div className="space-y-2">
                                {detail.genesis_date && (
                                    <div className="flex justify-between text-xs">
                                        <span className={textMuted}>출시일</span>
                                        <span className={`font-medium ${textPrimary}`}>{detail.genesis_date}</span>
                                    </div>
                                )}
                                {detail.categories.length > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className={textMuted}>카테고리</span>
                                        <span className={`font-medium ${textPrimary} text-right max-w-[60%]`}>
                                            {detail.categories.slice(0, 3).join(", ")}
                                        </span>
                                    </div>
                                )}
                                {detail.github_url && (
                                    <div className="flex justify-between text-xs">
                                        <span className={textMuted}>GitHub</span>
                                        <a
                                            href={detail.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-500 hover:underline truncate max-w-[60%]"
                                        >
                                            {detail.github_url.replace("https://github.com/", "")}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 개발 활동 */}
                        {(detail.commit_count_4w > 0 || detail.pr_contributors > 0) && (
                            <div className={`rounded-xl border p-4 ${cardBg}`}>
                                <div className={`text-xs font-semibold tracking-wider uppercase mb-3 ${textMuted}`}>개발 활동 (4주)</div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className={`text-lg font-bold ${textPrimary}`}>{detail.commit_count_4w}</div>
                                        <div className={`text-[10px] ${textMuted}`}>커밋</div>
                                    </div>
                                    <div>
                                        <div className={`text-lg font-bold ${textPrimary}`}>{detail.pr_contributors}</div>
                                        <div className={`text-[10px] ${textMuted}`}>기여자</div>
                                    </div>
                                    <div>
                                        <div className={`text-lg font-bold ${textPrimary}`}>{detail.stars.toLocaleString()}</div>
                                        <div className={`text-[10px] ${textMuted}`}>⭐ Stars</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 프로젝트 설명 */}
                        {detail.description && (
                            <div className={`rounded-xl border p-4 ${cardBg}`}>
                                <div className={`text-xs font-semibold tracking-wider uppercase mb-2 ${textMuted}`}>프로젝트 소개</div>
                                <p
                                    className={`text-xs leading-relaxed ${textMuted} line-clamp-6`}
                                    dangerouslySetInnerHTML={{
                                        __html: detail.description.replace(/<[^>]*>/g, "").slice(0, 600) + (detail.description.length > 600 ? "..." : ""),
                                    }}
                                />
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </motion.div>
    );
}

// ─── 메인 클라이언트 ────────────────────────────────────────
type SortKey = "score" | "market_cap" | "tvl" | "supply_pct" | "change_7d";

export default function ResearchClient() {
    const isLight = useTheme();
    const [coins, setCoins] = useState<ResearchCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ResearchCoin | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("score");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    useEffect(() => {
        fetch("/api/research")
            .then((r) => r.json())
            .then((data: ResearchCoin[]) => {
                setCoins(data);
                setUpdatedAt(new Date());
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const sorted = useMemo(() => {
        const list = [...coins];
        switch (sortKey) {
            case "market_cap": return list.sort((a, b) => b.market_cap - a.market_cap);
            case "tvl": return list.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
            case "supply_pct": {
                return list.sort((a, b) => {
                    const aPct = a.max_supply ? (a.circulating_supply / a.max_supply) : 0.5;
                    const bPct = b.max_supply ? (b.circulating_supply / b.max_supply) : 0.5;
                    return bPct - aPct;
                });
            }
            case "change_7d": return list.sort((a, b) => (b.price_change_percentage_7d ?? 0) - (a.price_change_percentage_7d ?? 0));
            default: return list.sort((a, b) => b.score - a.score);
        }
    }, [coins, sortKey]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") setSelected(null);
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const bg = isLight ? "bg-neutral-50" : "bg-black";
    const cardBg = isLight ? "bg-white border-neutral-200" : "bg-[#0e0e0e] border-white/8";
    const textPrimary = isLight ? "text-neutral-900" : "text-white";
    const textMuted = isLight ? "text-neutral-500" : "text-neutral-400";
    const border = isLight ? "border-neutral-100" : "border-white/5";
    const hoverRow = isLight ? "hover:bg-neutral-50 cursor-pointer" : "hover:bg-white/3 cursor-pointer";
    const colHead = isLight
        ? "text-neutral-400 border-neutral-100 bg-neutral-50/80"
        : "text-neutral-500 border-white/5 bg-white/2";
    const tabActive = isLight
        ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
        : "bg-white/10 text-white";
    const tabInactive = isLight ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-500 hover:text-neutral-300";
    const tabWrap = isLight ? "bg-neutral-100 border border-neutral-200" : "bg-white/5 border border-white/8";

    const TABS: { key: SortKey; label: string }[] = [
        { key: "score", label: "종합 점수" },
        { key: "market_cap", label: "시가총액" },
        { key: "tvl", label: "TVL" },
        { key: "supply_pct", label: "유통 비율" },
        { key: "change_7d", label: "7일 수익률" },
    ];

    return (
        <div className={`min-h-screen ${bg}`}>
            {/* 오버레이 */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[150]"
                            onClick={() => setSelected(null)}
                        />
                        <DetailDrawer coin={selected} onClose={() => setSelected(null)} isLight={isLight} />
                    </>
                )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
                {/* 헤더 */}
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${textPrimary}`}>코인 리서치</h1>
                        <p className={`text-xs mt-0.5 ${textMuted}`}>
                            공급 건전성 · 유동성 · 실사용(TVL) · 모멘텀 기반 종합 점수 · 상위 200개 코인
                        </p>
                    </div>
                    {updatedAt && (
                        <span className={`text-[11px] ${textMuted}`}>
                            {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 업데이트
                        </span>
                    )}
                </div>

                {/* 정렬 탭 */}
                <div className="mb-4 overflow-x-auto pb-0.5">
                    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${tabWrap}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSortKey(tab.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    sortKey === tab.key ? tabActive : tabInactive
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 안내 배너 */}
                <div className={`mb-4 px-4 py-2.5 rounded-xl border text-xs ${isLight ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-blue-950/20 border-blue-900/30 text-blue-400"}`}>
                    💡 점수는 공급 건전성(30) + 유동성(25) + 실사용 TVL(30) + 7일 모멘텀(15) 합산. 코인 클릭 시 상세 분석을 볼 수 있어요.
                </div>

                {/* 테이블 */}
                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                    <div className={`hidden md:grid grid-cols-[2rem_1fr_6rem_6rem_9rem_5rem] items-center gap-3 px-4 py-2 text-[11px] font-medium border-b ${colHead}`}>
                        <span className="text-right">#</span>
                        <span>코인</span>
                        <span className="text-right">현재가</span>
                        <span className="text-right">7일</span>
                        <span>유통 비율</span>
                        <span className="text-right">점수</span>
                    </div>

                    {loading && Array.from({ length: 15 }).map((_, i) => (
                        <SkeletonRow key={i} isLight={isLight} />
                    ))}

                    {!loading && sorted.map((coin, idx) => {
                        const pct7d = coin.price_change_percentage_7d ?? 0;
                        const sc = isLight ? scoreColorLight(coin.score) : scoreColor(coin.score);
                        const base = coin.max_supply ?? coin.total_supply ?? coin.circulating_supply;
                        const circPct = base ? (coin.circulating_supply / base) * 100 : null;

                        return (
                            <motion.div
                                key={coin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                                onClick={() => setSelected(coin)}
                                className={`grid grid-cols-[2rem_1fr_6rem_6rem_9rem_5rem] items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors ${border} ${hoverRow}`}
                            >
                                {/* 순위 */}
                                <span className={`text-[11px] text-right tabular-nums ${textMuted} opacity-50`}>{idx + 1}</span>

                                {/* 코인 정보 */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative w-7 h-7 shrink-0">
                                        <Image src={coin.image} alt={coin.name} fill className="object-contain rounded-full" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-semibold truncate ${textPrimary}`}>{coin.name}</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] uppercase ${textMuted}`}>{coin.symbol}</span>
                                            {coin.tvl && (
                                                <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${isLight ? "bg-blue-50 text-blue-600" : "bg-blue-950/30 text-blue-400"}`}>
                                                    TVL
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 현재가 */}
                                <div className={`text-sm font-mono tabular-nums text-right ${textPrimary}`}>
                                    {fmtPrice(coin.current_price)}
                                </div>

                                {/* 7일 변화 */}
                                <div className={`text-sm font-semibold text-right tabular-nums ${pct7d >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                                    {pct7d >= 0 ? "+" : ""}{pct7d.toFixed(1)}%
                                </div>

                                {/* 유통 비율 바 */}
                                <div>
                                    {circPct !== null ? (
                                        <div className="space-y-0.5">
                                            <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-neutral-200" : "bg-white/10"}`}>
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, circPct)}%` }} />
                                            </div>
                                            <div className={`text-[10px] ${textMuted}`}>
                                                {circPct.toFixed(0)}%
                                                {!coin.max_supply && " (∞)"}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`text-[11px] ${textMuted}`}>—</span>
                                    )}
                                </div>

                                {/* 점수 */}
                                <div className="flex justify-end">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text}`}>
                                        {coin.score}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {!loading && (
                    <p className={`text-center text-xs mt-4 ${textMuted}`}>
                        ※ 본 점수는 참고용이며 투자 권유가 아닙니다.
                    </p>
                )}
            </div>
        </div>
    );
}
