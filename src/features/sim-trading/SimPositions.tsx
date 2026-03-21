"use client";

import { useState, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { simPricesAtom } from "@/shared/store/atoms";
import { calcRoe } from "@/shared/lib/sim-trading";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SimPosition } from "@/shared/types/sim-trading.types";

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

    // PnL 플래시
    const prevPnlRef = useRef<Record<string, number>>({});
    const [flashMap, setFlashMap] = useState<Record<string, "up" | "down" | null>>({});

    useEffect(() => {
        positions.forEach((pos) => {
            const prev = prevPnlRef.current[pos.id];
            if (prev !== undefined && Math.abs(pos.unrealized_pnl - prev) > 0.001) {
                const dir = pos.unrealized_pnl > prev ? "up" : "down";
                setFlashMap((f) => ({ ...f, [pos.id]: dir }));
                setTimeout(() => setFlashMap((f) => ({ ...f, [pos.id]: null })), 500);
            }
            prevPnlRef.current[pos.id] = pos.unrealized_pnl;
        });
    }, [positions]);

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
        const steps = [
            {
                num: "1",
                color: "text-amber-500",
                bg: isLight ? "bg-amber-50 border-amber-200/60" : "bg-amber-500/8 border-amber-500/20",
                icon: (
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: "코인 & 레버리지 선택",
                desc: "상단 드롭다운에서 거래할 코인을 고르고, 레버리지를 설정하세요.",
            },
            {
                num: "2",
                color: "text-blue-500",
                bg: isLight ? "bg-blue-50 border-blue-200/60" : "bg-blue-500/8 border-blue-500/20",
                icon: (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                ),
                title: "수량 입력 & 방향 선택",
                desc: "투자 금액과 수량을 입력한 후 롱(매수) 또는 숏(매도) 버튼을 누르세요.",
            },
            {
                num: "3",
                color: "text-emerald-500",
                bg: isLight ? "bg-emerald-50 border-emerald-200/60" : "bg-emerald-500/8 border-emerald-500/20",
                icon: (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                ),
                title: "포지션 관리",
                desc: "여기서 실시간 손익(PnL)을 확인하고 TP/SL 설정 후 원하는 타이밍에 청산하세요.",
            },
        ];

        return (
            <div className="space-y-3">
                <div className={`${cardBg} rounded-2xl border ${border} p-5`}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? "bg-amber-50" : "bg-amber-500/10"}`}>
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className={`text-[14px] font-bold ${textPrimary}`}>모의투자 시작하기</p>
                            <p className={`text-[11px] ${textTertiary}`}>실제 돈 없이 선물 거래를 연습해보세요</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {steps.map((step) => (
                        <div key={step.num} className={`${cardBg} rounded-2xl border ${border} p-4 flex items-start gap-3`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${step.bg}`}>
                                {step.icon}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`text-[9px] font-bold ${step.color} uppercase tracking-wider`}>Step {step.num}</span>
                                </div>
                                <p className={`text-[12px] font-semibold ${textPrimary} mb-0.5`}>{step.title}</p>
                                <p className={`text-[11px] ${textTertiary} leading-relaxed`}>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`rounded-xl px-4 py-3 border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-neutral-900/50 border-zinc-800/60"}`}>
                    <p className={`text-[11px] ${textTertiary} text-center`}>
                        💡 모든 거래는 가상 자산으로 진행되며 실제 손익이 발생하지 않습니다
                    </p>
                </div>
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
                    const flash = flashMap[pos.id];

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
                                            <div className="text-[11px] mt-0.5 font-mono flex items-center gap-1.5">
                                                <span className={isLight ? "text-neutral-700" : textSecondary}>
                                                    {pos.quantity.toFixed(pos.quantity >= 1 ? 4 : 6)} {pos.symbol.replace("USDT", "")}
                                                </span>
                                                <span className={textTertiary}>·</span>
                                                <span className={`${isLight ? "text-neutral-500" : "text-neutral-300"} font-semibold`}>
                                                    ${notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>
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

                                {/* PnL 히어로 — 플래시 */}
                                <div className={`rounded-xl px-4 py-3 mb-3 transition-colors duration-300 ${
                                    flash === "up"
                                        ? "bg-emerald-500/25"
                                        : flash === "down"
                                        ? "bg-red-500/25"
                                        : isProfit ? "bg-emerald-500/8" : "bg-red-500/8"
                                }`}>
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
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] font-medium uppercase tracking-wide ${textTertiary}`}>청산까지 안전거리</span>
                                            {liqDist < 5 && (
                                                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">위험</span>
                                            )}
                                            {liqDist >= 5 && liqDist < 15 && (
                                                <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md">주의</span>
                                            )}
                                        </div>
                                        <span className={`text-[12px] font-mono font-bold tabular-nums ${
                                            liqDist < 5 ? "text-red-500" : liqDist < 15 ? "text-orange-500" : "text-emerald-500"
                                        }`}>
                                            {liqDist.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? "bg-neutral-100" : "bg-neutral-800/80"}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                liqDist < 5
                                                    ? "bg-red-500"
                                                    : liqDist < 15
                                                    ? "bg-orange-500"
                                                    : "bg-emerald-500"
                                            }`}
                                            style={{ width: `${Math.max(2, Math.min(100, liqDist * 2))}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className={`text-[9px] ${textTertiary}`}>청산가 ${pos.liq_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        <span className={`text-[9px] ${textTertiary}`}>현재 ${cp.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
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
                                                className={`px-4 py-2 text-[11px] ${textTertiary} cursor-pointer transition-colors`}
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
