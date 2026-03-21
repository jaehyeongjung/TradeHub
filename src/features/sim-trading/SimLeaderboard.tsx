"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/shared/hooks/useTheme";

interface LeaderboardEntry {
    user_id: string;
    total_asset: number;
    roi: number;
}

interface Props {
    userId: string | null;
}

// ── 추상 트레이더 정체성 ──────────────────────────────────────────────
const ADJS = ["냉정한", "날카로운", "대담한", "신중한", "빠른", "강인한", "조용한", "예리한", "침착한", "용감한"];
const ANIMALS = ["고래", "독수리", "황소", "호랑이", "매", "곰", "사자", "여우", "늑대", "표범"];
const EMOJIS  = ["🐋",   "🦅",      "🐂",    "🐯",     "🦅", "🐻", "🦁",   "🦊",   "🐺",   "🐆"];
const PALETTES = [
    "bg-blue-500/20 text-blue-400",
    "bg-violet-500/20 text-violet-400",
    "bg-teal-500/20 text-teal-400",
    "bg-pink-500/20 text-pink-400",
    "bg-indigo-500/20 text-indigo-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-orange-500/20 text-orange-400",
    "bg-rose-500/20 text-rose-400",
    "bg-lime-500/20 text-lime-400",
    "bg-amber-500/20 text-amber-400",
];

function stableHash(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = Math.imul(31, h) + id.charCodeAt(i) | 0;
    }
    return Math.abs(h);
}

function traderAlias(userId: string) {
    const h = stableHash(userId);
    const adj     = ADJS[h % ADJS.length];
    const animalI = Math.floor(h / ADJS.length) % ANIMALS.length;
    return {
        name:    `${adj} ${ANIMALS[animalI]}`,
        emoji:   EMOJIS[animalI],
        palette: PALETTES[h % PALETTES.length],
    };
}

// ── 순위 배지 색상 ─────────────────────────────────────────────────────
const RANK_BADGE = [
    { text: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30"   }, // 1st
    { text: "text-neutral-300", bg: "bg-neutral-500/10", border: "border-neutral-500/20" }, // 2nd
    { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20"  }, // 3rd
];

export default function SimLeaderboard({ userId }: Props) {
    const isLight = useTheme();
    const [data, setData]       = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch("/api/leaderboard");
            if (!res.ok) throw new Error("Failed");
            setData(await res.json());
            setError(null);
        } catch {
            setError("랭킹 데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
        const t = setInterval(fetchLeaderboard, 30_000);
        return () => clearInterval(t);
    }, [fetchLeaderboard]);

    // ── 테마 토큰 ──────────────────────────────────────────────────────
    const card    = isLight ? "bg-white border-neutral-200"           : "bg-neutral-950 border-white/[0.06]";
    const divider = isLight ? "border-neutral-100 divide-neutral-100" : "border-white/[0.04] divide-white/[0.04]";
    const t1 = isLight ? "text-neutral-900" : "text-white";
    const t2 = isLight ? "text-neutral-500" : "text-neutral-400";
    const t3 = isLight ? "text-neutral-400" : "text-neutral-600";
    const rowHover = isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.025]";

    // ── 로딩 스켈레톤 ─────────────────────────────────────────────────
    if (loading) {
        const sk = isLight ? "bg-neutral-100 animate-pulse" : "bg-white/[0.05] animate-pulse";
        return (
            <div className={`rounded-2xl border overflow-hidden ${card}`}>
                <div className={`px-5 py-3.5 border-b ${divider} flex items-center justify-between`}>
                    <div className={`h-4 w-24 rounded-full ${sk}`} />
                    <div className={`h-3 w-12 rounded-full ${sk}`} />
                </div>
                <div className={`p-4 space-y-2 border-b ${divider}`}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`h-[68px] rounded-2xl ${sk}`} style={{ opacity: 1 - i * 0.15 }} />
                    ))}
                </div>
                <div className="divide-y divide-transparent">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                            <div className={`w-5 h-3 rounded-full ${sk}`} />
                            <div className={`w-8 h-8 rounded-full ${sk}`} />
                            <div className="flex-1 space-y-1.5">
                                <div className={`h-3 w-24 rounded-full ${sk}`} />
                                <div className={`h-2.5 w-16 rounded-full ${sk}`} style={{ opacity: 0.6 }} />
                            </div>
                            <div className={`h-6 w-16 rounded-lg ${sk}`} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || data.length === 0) {
        return (
            <div className={`rounded-2xl border p-12 text-center ${card}`}>
                <p className={`text-[12px] ${error ? "text-red-400" : t3}`}>
                    {error ?? "아직 랭킹 데이터가 없습니다"}
                </p>
            </div>
        );
    }

    const myRank = userId ? data.findIndex((e) => e.user_id === userId) : -1;
    const top3   = data.slice(0, 3);
    const rest   = data.slice(3);
    const maxRoi = Math.max(...data.map((e) => Math.abs(e.roi)), 1);

    return (
        <div className={`rounded-2xl border overflow-hidden ${card}`}>

            {/* ── 헤더 ────────────────────────────────────────────── */}
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-bold tracking-tight ${t1}`}>수익률 랭킹</span>
                    {myRank >= 0 && (
                        <span className="text-[10px] px-2 py-[3px] bg-amber-500/15 text-amber-500 rounded-full font-semibold border border-amber-500/25">
                            내 순위 {myRank + 1}위
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className={`text-[10px] ${t3}`}>실시간</span>
                </div>
            </div>

            {/* ── TOP 3 카드 리스트 ─────────────────────────────────── */}
            <div className={`p-3 space-y-1.5 border-b ${divider}`}>
                {top3.map((entry, i) => {
                    const alias      = traderAlias(entry.user_id);
                    const isMe       = !!(userId && entry.user_id === userId);
                    const isPositive = entry.roi >= 0;
                    const badge      = RANK_BADGE[i];
                    const barPct     = Math.round((Math.abs(entry.roi) / maxRoi) * 100);

                    return (
                        <div
                            key={entry.user_id}
                            className={`relative rounded-2xl px-4 py-3 overflow-hidden ${
                                i === 0
                                    ? isLight
                                        ? "bg-amber-50 border border-amber-200/60"
                                        : "bg-amber-500/[0.07] border border-amber-500/20"
                                    : isLight
                                        ? "bg-neutral-50 border border-neutral-200/60"
                                        : "bg-white/[0.03] border border-white/[0.05]"
                            }`}
                        >
                            {/* ROI 게이지 바 (배경) */}
                            <div
                                className={`absolute left-0 top-0 h-full rounded-2xl pointer-events-none transition-all duration-700 ${
                                    isPositive ? "bg-emerald-500/[0.06]" : "bg-red-500/[0.06]"
                                }`}
                                style={{ width: `${barPct}%` }}
                            />

                            <div className="relative flex items-center gap-3">
                                {/* 순위 뱃지 */}
                                <span className={`text-[9px] font-black tracking-widest w-8 text-center py-1 rounded-lg border flex-shrink-0 ${badge.text} ${badge.bg} ${badge.border}`}>
                                    {i + 1}위
                                </span>

                                {/* 이모지 아바타 */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] flex-shrink-0 ${
                                    isMe
                                        ? "ring-2 ring-amber-500/50 ring-offset-1 ring-offset-transparent"
                                        : ""
                                } ${isMe ? "bg-amber-500/20" : alias.palette.split(" ")[0]}`}>
                                    {alias.emoji}
                                </div>

                                {/* 이름 + 자산 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[12px] font-semibold truncate ${i === 0 ? (isLight ? "text-amber-700" : "text-amber-300") : t1}`}>
                                            {alias.name}
                                        </span>
                                        {isMe && (
                                            <span className="text-[8px] px-1.5 py-px bg-amber-500/20 text-amber-400 rounded-full font-bold flex-shrink-0">나</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-mono ${t3}`}>
                                        ${entry.total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                </div>

                                {/* ROI */}
                                <span className={`text-[14px] font-bold font-mono tabular-nums flex-shrink-0 ${
                                    isPositive ? "text-emerald-500" : "text-red-400"
                                }`}>
                                    {isPositive ? "+" : ""}{entry.roi.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── 나머지 순위 ──────────────────────────────────────── */}
            <div className={`divide-y ${divider} max-h-[300px] overflow-y-auto scrollbar-none`}>
                {rest.map((entry, i) => {
                    const alias      = traderAlias(entry.user_id);
                    const rank       = i + 4;
                    const isMe       = !!(userId && entry.user_id === userId);
                    const isPositive = entry.roi >= 0;

                    return (
                        <div
                            key={entry.user_id}
                            className={`relative flex items-center gap-3 px-5 py-2.5 transition-colors ${
                                isMe
                                    ? isLight ? "bg-amber-50/80" : "bg-amber-500/[0.04]"
                                    : rowHover
                            }`}
                        >
                            {isMe && <div className="absolute left-0 inset-y-0 w-[2px] bg-amber-500 rounded-r" />}

                            {/* 순위 */}
                            <span className={`w-5 text-right text-[11px] font-mono font-medium flex-shrink-0 ${isMe ? "text-amber-500" : t3}`}>
                                {rank}
                            </span>

                            {/* 이모지 아바타 */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[14px] flex-shrink-0 ${
                                isMe ? "bg-amber-500/20" : alias.palette.split(" ")[0]
                            }`}>
                                {alias.emoji}
                            </div>

                            {/* 이름 + 자산 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className={`text-[12px] font-medium truncate ${isMe ? "text-amber-400" : t2}`}>
                                        {alias.name}
                                    </span>
                                    {isMe && (
                                        <span className="text-[8px] px-1.5 py-px bg-amber-500/20 text-amber-400 rounded-full font-bold flex-shrink-0">나</span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-mono ${t3}`}>
                                    ${entry.total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>

                            {/* ROI 필 */}
                            <span className={`text-[12px] font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg flex-shrink-0 ${
                                isPositive
                                    ? "text-emerald-500 bg-emerald-500/[0.08]"
                                    : "text-red-400 bg-red-500/[0.08]"
                            }`}>
                                {isPositive ? "+" : ""}{entry.roi.toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ── 내 순위 고정 배너 ─────────────────────────────────── */}
            {myRank > 12 && userId && data[myRank] && (() => {
                const me      = data[myRank];
                const alias   = traderAlias(userId);
                const isPositive = me.roi >= 0;
                return (
                    <div className={`border-t ${divider} px-5 py-3 ${isLight ? "bg-amber-50/50" : "bg-amber-500/[0.04]"}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-[2px] h-7 bg-amber-500 rounded-full flex-shrink-0" />
                            <span className="text-[11px] font-bold text-amber-500 w-5 text-right flex-shrink-0 font-mono">
                                {myRank + 1}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-[14px] flex-shrink-0">
                                {alias.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-amber-400 leading-tight">{alias.name}</p>
                                <p className={`text-[10px] font-mono ${t3}`}>
                                    ${me.total_asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <span className={`text-[13px] font-bold font-mono tabular-nums px-2.5 py-0.5 rounded-lg flex-shrink-0 ${
                                isPositive
                                    ? "text-emerald-500 bg-emerald-500/[0.08]"
                                    : "text-red-400 bg-red-500/[0.08]"
                            }`}>
                                {isPositive ? "+" : ""}{me.roi.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
