"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { simPricesAtom } from "@/store/atoms";
import { calcRoe } from "@/lib/sim-trading";
import type { SimPosition } from "@/types/sim-trading";

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

interface Props {
    positions: SimPosition[];
    onClose: (positionId: string, closePrice: number) => Promise<unknown>;
    onUpdateTpSl?: (positionId: string, tp: number | null, sl: number | null) => Promise<void>;
}

export default function SimPositions({ positions, onClose, onUpdateTpSl }: Props) {
    const isLight = useTheme();
    const prices = useAtomValue(simPricesAtom);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTp, setEditTp] = useState("");
    const [editSl, setEditSl] = useState("");
    const [tpSlError, setTpSlError] = useState("");

    const border = isLight ? "border-neutral-200" : "border-zinc-800/60";
    const cardBg = isLight ? "bg-white" : "bg-neutral-950";
    const subCardBg = isLight ? "bg-neutral-50" : "bg-neutral-900/60";
    const inputBg = isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-800 border-neutral-700/50";
    const textPrimary = isLight ? "text-neutral-900" : "text-white";
    const textSecondary = isLight ? "text-neutral-600" : "text-neutral-400";
    const textTertiary = isLight ? "text-neutral-500" : "text-neutral-600";
    const btnClose = isLight
        ? "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
        : "bg-neutral-900 border-zinc-800 text-neutral-500 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30";
    const btnTpSl = isLight
        ? "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
        : "bg-neutral-900 border-zinc-800 text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30";

    if (positions.length === 0) {
        return (
            <div className={`${cardBg} rounded-2xl border ${border} p-8 text-center`}>
                <div className={`w-12 h-12 rounded-2xl ${subCardBg} border ${border} flex items-center justify-center mx-auto mb-3`}>
                    <svg className={`w-6 h-6 ${textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className={`text-[13px] font-medium ${textSecondary}`}>활성 포지션이 없습니다</p>
                <p className={`text-[11px] ${textTertiary} mt-1`}>주문 패널에서 포지션을 열어보세요</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
                <span className={`text-[11px] font-semibold ${textTertiary} uppercase tracking-wider`}>포지션</span>
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-amber-500/15 text-amber-500 rounded-full">
                    {positions.length}
                </span>
            </div>

            <div className="grid gap-2">
                {positions.map((pos) => {
                    const cp = prices[pos.symbol] ?? pos.entry_price;
                    const pnl = pos.unrealized_pnl;
                    const roe = calcRoe(pnl, pos.margin);
                    const isProfit = pnl >= 0;
                    const isLong = pos.side === "LONG";
                    const notional = pos.quantity * cp;
                    const liqDist = pos.entry_price > 0
                        ? Math.abs(cp - pos.liq_price) / cp * 100
                        : 0;
                    const isEditing = editingId === pos.id;

                    return (
                        <div key={pos.id} className={`${cardBg} rounded-2xl border ${border} overflow-hidden`}>
                            {/* 상단 컬러 라인 */}
                            <div className={`h-[2px] ${isLong ? "bg-emerald-500" : "bg-red-500"}`} />

                            <div className="p-4">
                                {/* 헤더 */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black ${
                                            isLong ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
                                        }`}>
                                            {isLong ? "L" : "S"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[15px] font-bold ${textPrimary}`}>
                                                    {pos.symbol.replace("USDT", "")}
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                                                    isLong ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
                                                }`}>
                                                    {pos.side}
                                                </span>
                                                <span className="text-[10px] font-bold text-amber-500 font-mono">{Number(pos.leverage).toFixed(0)}x</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                                                    isLight ? "bg-neutral-100 text-neutral-500" : "bg-neutral-800 text-neutral-400"
                                                }`}>
                                                    {pos.margin_mode === "CROSS" ? "교차" : "격리"}
                                                </span>
                                            </div>
                                            <div className={`text-[11px] ${textTertiary} mt-0.5 font-mono`}>
                                                {pos.quantity.toFixed(pos.quantity >= 1 ? 4 : 6)} {pos.symbol.replace("USDT", "")} · ${notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onClose(pos.id, cp)}
                                        className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${btnClose}`}
                                    >
                                        청산
                                    </button>
                                </div>

                                {/* PnL 히어로 */}
                                <div className={`rounded-xl px-4 py-3 mb-3 ${isProfit ? "bg-emerald-500/8" : "bg-red-500/8"}`}>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-[24px] font-bold font-mono tabular-nums leading-none ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                                                {isProfit ? "+" : ""}{pnl.toFixed(2)}
                                                <span className={`text-[13px] ml-1 font-medium ${isProfit ? "text-emerald-500/70" : "text-red-500/70"}`}>USDT</span>
                                            </div>
                                            <div className={`text-[10px] ${textTertiary} mt-1`}>미실현 손익</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[18px] font-bold font-mono tabular-nums ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                                                {isProfit ? "+" : ""}{roe.toFixed(2)}%
                                            </div>
                                            <div className={`text-[10px] ${textTertiary} mt-1`}>수익률 (ROE)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 가격 3열 */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { label: "진입가", value: pos.entry_price.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: textSecondary },
                                        { label: "현재가", value: cp.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: isProfit ? "text-emerald-500" : "text-red-500" },
                                        { label: "청산가", value: pos.liq_price.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: "text-orange-500" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className={`${subCardBg} rounded-xl px-3 py-2 border ${border}`}>
                                            <div className={`text-[9px] ${textTertiary} mb-0.5`}>{label}</div>
                                            <div className={`text-[12px] font-mono tabular-nums font-bold ${color}`}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* 청산가 거리 바 */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[9px] ${textTertiary}`}>청산가까지 거리</span>
                                        <span className={`text-[10px] font-mono font-semibold ${
                                            liqDist < 5 ? "text-red-500" : liqDist < 15 ? "text-orange-500" : textTertiary
                                        }`}>
                                            {liqDist.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-neutral-100" : "bg-neutral-800"}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                liqDist < 5 ? "bg-red-500" : liqDist < 15 ? "bg-orange-500" : "bg-emerald-500/60"
                                            }`}
                                            style={{ width: `${Math.max(2, Math.min(100, 100 - liqDist * 3))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* TP/SL */}
                                {isEditing ? (
                                    <div className={`${subCardBg} rounded-xl p-3 border ${border} space-y-2`}>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] text-emerald-500 font-medium mb-1 block">익절가 (TP)</label>
                                                <input
                                                    type="number" value={editTp}
                                                    onChange={(e) => setEditTp(e.target.value)}
                                                    placeholder="미설정"
                                                    className={`w-full text-emerald-500 text-[12px] font-mono rounded-xl px-3 py-2 border outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-500 ${inputBg}`}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] text-red-500 font-medium mb-1 block">손절가 (SL)</label>
                                                <input
                                                    type="number" value={editSl}
                                                    onChange={(e) => setEditSl(e.target.value)}
                                                    placeholder="미설정"
                                                    className={`w-full text-red-500 text-[12px] font-mono rounded-xl px-3 py-2 border outline-none focus:border-red-500/50 transition-colors placeholder:text-neutral-500 ${inputBg}`}
                                                />
                                            </div>
                                        </div>
                                        {tpSlError && <p className="text-[10px] text-red-500">{tpSlError}</p>}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    setTpSlError("");
                                                    const tp = editTp ? parseFloat(editTp) : null;
                                                    const sl = editSl ? parseFloat(editSl) : null;
                                                    try {
                                                        await onUpdateTpSl?.(pos.id, tp, sl);
                                                        setEditingId(null);
                                                    } catch (e) {
                                                        setTpSlError(e instanceof Error ? e.message : "TP/SL 설정 실패");
                                                    }
                                                }}
                                                className="flex-1 py-2 text-[11px] font-bold bg-amber-500/15 text-amber-500 rounded-xl border border-amber-500/25 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                            >
                                                저장
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(null); setTpSlError(""); }}
                                                className={`px-4 py-2 text-[11px] ${textTertiary} hover:${textSecondary} cursor-pointer transition-colors`}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] ${textTertiary} font-medium`}>TP</span>
                                                {pos.tp_price ? (
                                                    <span className="text-[11px] text-emerald-500 font-mono font-semibold">
                                                        {pos.tp_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className={`text-[11px] ${textTertiary}`}>미설정</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] ${textTertiary} font-medium`}>SL</span>
                                                {pos.sl_price ? (
                                                    <span className="text-[11px] text-red-500 font-mono font-semibold">
                                                        {pos.sl_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className={`text-[11px] ${textTertiary}`}>미설정</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingId(pos.id);
                                                setEditTp(pos.tp_price ? String(pos.tp_price) : "");
                                                setEditSl(pos.sl_price ? String(pos.sl_price) : "");
                                                setTpSlError("");
                                            }}
                                            className={`text-[10px] px-3 py-1.5 font-semibold border rounded-xl transition-all cursor-pointer ${btnTpSl}`}
                                        >
                                            TP/SL 설정
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
