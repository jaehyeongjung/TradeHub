"use client";

import { useEffect, useState, useCallback } from "react";

interface LeaderboardEntry {
    user_id: string;
    total_asset: number;
    roi: number;
}

interface Props {
    userId: string | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function traderName(userId: string) {
    return `Trader #${userId.substring(0, 4).toUpperCase()}`;
}

export default function SimLeaderboard({ userId }: Props) {
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

    if (loading) {
        return (
            <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-5">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    🏆 랭킹
                </h3>
                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-neutral-800/50 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-5">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    🏆 랭킹
                </h3>
                <p className="text-[12px] text-red-400 text-center py-6">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-5">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    🏆 랭킹
                </h3>
                <p className="text-[12px] text-neutral-600 text-center py-6">데이터가 없습니다.</p>
            </div>
        );
    }

    const myRank = userId ? data.findIndex((e) => e.user_id === userId) : -1;

    return (
        <div className="bg-neutral-950 rounded-2xl border border-zinc-800 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    🏆 랭킹
                    {myRank >= 0 && (
                        <span className="ml-2 text-[10px] text-amber-400 font-normal normal-case tracking-normal">
                            내 순위: {myRank + 1}위
                        </span>
                    )}
                </h3>
                <span className="text-[10px] text-neutral-600">30초마다 갱신</span>
            </div>

            {/* 테이블 헤더 */}
            <div className="grid grid-cols-[40px_1fr_1fr_90px] gap-2 px-5 py-2 text-[11px] text-neutral-500 border-b border-zinc-800/40">
                <div className="text-center">순위</div>
                <div>트레이더</div>
                <div className="text-right">총자산</div>
                <div className="text-right">수익률</div>
            </div>

            {/* 리스트 */}
            <div className="divide-y divide-zinc-800/30 max-h-[480px] overflow-y-auto">
                {data.map((entry, idx) => {
                    const isMe = userId && entry.user_id === userId;
                    const isPositive = entry.roi >= 0;

                    return (
                        <div
                            key={entry.user_id}
                            className={`grid grid-cols-[40px_1fr_1fr_90px] gap-2 items-center px-5 py-3 transition-colors ${
                                isMe
                                    ? "bg-amber-500/8 border-l-2 border-amber-400"
                                    : "hover:bg-white/[0.015]"
                            }`}
                        >
                            {/* 순위 */}
                            <div className="text-center">
                                {idx < 3 ? (
                                    <span className="text-[16px]">{MEDALS[idx]}</span>
                                ) : (
                                    <span className="text-[12px] text-neutral-500 font-mono tabular-nums">
                                        {idx + 1}
                                    </span>
                                )}
                            </div>

                            {/* 트레이더 */}
                            <div className="flex items-center gap-2">
                                <span className={`text-[13px] font-medium ${isMe ? "text-amber-300" : "text-neutral-300"}`}>
                                    {traderName(entry.user_id)}
                                </span>
                                {isMe && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-md font-medium">
                                        나
                                    </span>
                                )}
                            </div>

                            {/* 총자산 */}
                            <div className="text-right">
                                <span className="text-[13px] text-neutral-200 font-mono tabular-nums">
                                    ${entry.total_asset.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* 수익률 */}
                            <div className="text-right">
                                <span className={`text-[13px] font-bold font-mono tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                    {isPositive ? "+" : ""}{entry.roi.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
