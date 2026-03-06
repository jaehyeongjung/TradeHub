"use client";

import { useEffect, useState, useCallback } from "react";

function useTheme() {
    const [isLight, setIsLight] = useState(false);
    useEffect(() => {
        const html = document.documentElement;
        setIsLight(html.classList.contains("light"));
        const observer = new MutationObserver(() => setIsLight(html.classList.contains("light")));
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);
    return isLight;
}

interface LeaderboardEntry {
    user_id: string;
    total_asset: number;
    roi: number;
}

interface Props {
    userId: string | null;
}

function traderName(userId: string) {
    return `Trader #${userId.substring(0, 6).toUpperCase()}`;
}

function traderInitials(userId: string) {
    return userId.substring(0, 2).toUpperCase();
}

const PODIUM_ORDER = [1, 0, 2]; // 2등, 1등(중앙), 3등

export default function SimLeaderboard({ userId }: Props) {
    const isLight = useTheme();
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch("/api/leaderboard");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
            setError(null);
        } catch {
            setError("랭킹 데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30_000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    const border = isLight ? "border-neutral-200" : "border-zinc-800/60";
    const bg = isLight ? "bg-white" : "bg-neutral-950";
    const podiumBg = isLight ? "bg-neutral-50" : "bg-neutral-900/60";
    const textPrimary = isLight ? "text-neutral-900" : "text-white";
    const textSecondary = isLight ? "text-neutral-600" : "text-neutral-400";
    const textTertiary = isLight ? "text-neutral-500" : "text-neutral-600";
    const avatarBg = isLight ? "bg-neutral-100 text-neutral-500" : "bg-neutral-800 text-neutral-400";
    const rowHover = isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.015]";

    if (loading) {
        return (
            <div className={`${bg} rounded-2xl border ${border} p-5 space-y-3`}>
                <div className="flex items-center justify-between mb-2">
                    <div className={`h-4 w-12 ${isLight ? "bg-neutral-100" : "bg-neutral-800"} rounded animate-pulse`} />
                    <div className={`h-3 w-20 ${isLight ? "bg-neutral-100" : "bg-neutral-900"} rounded animate-pulse`} />
                </div>
                <div className="flex items-end justify-center gap-3 py-4">
                    {["h-20 w-24", "h-28 w-28", "h-16 w-24"].map((cls, i) => (
                        <div key={i} className={`${cls} ${isLight ? "bg-neutral-100" : "bg-neutral-800/60"} rounded-2xl animate-pulse`} />
                    ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-12 rounded-xl ${isLight ? "bg-neutral-100" : "bg-neutral-900/60"} animate-pulse`} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${bg} rounded-2xl border ${border} p-8 text-center`}>
                <p className="text-[12px] text-red-500">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={`${bg} rounded-2xl border ${border} p-8 text-center`}>
                <p className={`text-[13px] ${textTertiary}`}>아직 랭킹 데이터가 없습니다</p>
            </div>
        );
    }

    const myRank = userId ? data.findIndex((e) => e.user_id === userId) : -1;
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    const PODIUM_HEIGHTS = ["h-24", "h-32", "h-20"];   // 2등, 1등, 3등
    const PODIUM_MEDALS = ["🥈", "🥇", "🥉"];
    const PODIUM_LABELS = ["2nd", "1st", "3rd"];

    return (
        <div className={`${bg} rounded-2xl border ${border} overflow-hidden`}>
            {/* 헤더 */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${border}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-bold ${textPrimary}`}>랭킹</span>
                    {myRank >= 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-500 rounded-full font-medium">
                            내 순위 {myRank + 1}위
                        </span>
                    )}
                </div>
                <span className={`text-[10px] ${textTertiary}`}>30초마다 갱신</span>
            </div>

            {/* ── 포디엄 (TOP 3) ── */}
            {top3.length >= 1 && (
                <div className={`px-5 py-6 border-b ${border}`}>
                    <div className="flex items-end justify-center gap-3">
                        {PODIUM_ORDER.map((dataIdx, podiumPos) => {
                            const entry = top3[dataIdx];
                            if (!entry) return <div key={podiumPos} className="w-28" />;
                            const isMe = !!(userId && entry.user_id === userId);
                            const isCenter = podiumPos === 1;
                            const isPositive = entry.roi >= 0;

                            return (
                                <div key={entry.user_id} className="flex flex-col items-center">
                                    <div className="text-[20px] mb-2">{PODIUM_MEDALS[podiumPos]}</div>

                                    {/* 아바타 */}
                                    <div className={`relative rounded-2xl flex items-center justify-center font-bold mb-2 ${
                                        isCenter ? "w-14 h-14 text-[16px]" : "w-11 h-11 text-[12px]"
                                    } ${
                                        isMe
                                            ? "bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/40"
                                            : avatarBg
                                    }`}>
                                        {traderInitials(entry.user_id)}
                                        {isMe && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                                <span className="text-[7px] font-black text-black">나</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 포디엄 박스 */}
                                    <div className={`${isCenter ? "w-28" : "w-24"} ${PODIUM_HEIGHTS[podiumPos]} rounded-t-2xl flex flex-col items-center justify-center gap-1 border ${
                                        isMe ? "bg-amber-500/8 border-amber-500/20" : `${podiumBg} ${border}`
                                    }`}>
                                        <span className={`text-[9px] font-bold ${textTertiary}`}>{PODIUM_LABELS[podiumPos]}</span>
                                        <span className={`text-[11px] font-bold ${textPrimary} text-center px-2 leading-tight`}>
                                            {traderName(entry.user_id)}
                                        </span>
                                        <span className={`text-[12px] font-bold font-mono tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                                            {isPositive ? "+" : ""}{entry.roi.toFixed(2)}%
                                        </span>
                                        <span className={`text-[9px] ${textTertiary} font-mono`}>
                                            ${entry.total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 나머지 순위 ── */}
            <div className={`divide-y ${isLight ? "divide-neutral-100" : "divide-zinc-800/30"} max-h-[360px] overflow-y-auto scrollbar-none`}>
                {rest.map((entry, i) => {
                    const idx = i + 3;
                    const isMe = !!(userId && entry.user_id === userId);
                    const isPositive = entry.roi >= 0;

                    return (
                        <div
                            key={entry.user_id}
                            className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                                isMe ? "bg-amber-500/6" : rowHover
                            }`}
                        >
                            <div className="w-7 text-center flex-shrink-0">
                                <span className={`text-[12px] ${textTertiary} font-mono tabular-nums font-medium`}>
                                    {idx + 1}
                                </span>
                            </div>

                            {/* 아바타 */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                isMe ? "bg-amber-500/20 text-amber-500" : avatarBg
                            }`}>
                                {traderInitials(entry.user_id)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[13px] font-medium truncate ${isMe ? "text-amber-500" : textSecondary}`}>
                                        {traderName(entry.user_id)}
                                    </span>
                                    {isMe && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-full font-bold flex-shrink-0">나</span>
                                    )}
                                </div>
                                <div className={`text-[10px] ${textTertiary} font-mono`}>
                                    ${entry.total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <div className={`text-[14px] font-bold font-mono tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                                    {isPositive ? "+" : ""}{entry.roi.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 내 순위 고정 배너 (상위 표시 밖일 때) */}
            {myRank > 12 && userId && data[myRank] && (
                <div className={`border-t ${border} px-5 py-3 bg-amber-500/5`}>
                    <div className="flex items-center gap-3">
                        <div className="w-7 text-center flex-shrink-0">
                            <span className="text-[12px] text-amber-500 font-mono font-bold">{myRank + 1}</span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {traderInitials(userId)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-medium text-amber-500">나</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-full font-bold">MY</span>
                            </div>
                            <div className={`text-[10px] ${textTertiary} font-mono`}>
                                ${data[myRank].total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className={`text-[14px] font-bold font-mono ${data[myRank].roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {data[myRank].roi >= 0 ? "+" : ""}{data[myRank].roi.toFixed(2)}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
