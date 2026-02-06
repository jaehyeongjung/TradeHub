"use client";

import { useAtomValue } from "jotai";
import { simPricesAtom } from "@/store/atoms";
import { calcRoe } from "@/lib/sim-trading";
import type { SimPosition } from "@/types/sim-trading";

interface Props {
    positions: SimPosition[];
    onClose: (positionId: string, closePrice: number) => Promise<unknown>;
}

export default function SimPositions({ positions, onClose }: Props) {
    const prices = useAtomValue(simPricesAtom);

    if (positions.length === 0) {
        return (
            <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-5">
                <h3 className="text-xs font-semibold text-neutral-500 mb-2">Positions</h3>
                <div className="text-[11px] text-neutral-700 text-center py-6">
                    활성 포지션이 없습니다
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-4">
            <h3 className="text-xs font-semibold text-neutral-500 mb-3">
                Positions <span className="text-amber-400/80 ml-1">{positions.length}</span>
            </h3>
            <div className="space-y-2">
                {positions.map((pos) => {
                    const cp = prices[pos.symbol] ?? pos.entry_price;
                    const pnl = pos.unrealized_pnl;
                    const roe = calcRoe(pnl, pos.margin);
                    const isProfit = pnl >= 0;
                    const isLong = pos.side === "LONG";

                    // 청산까지 남은 %
                    const liqDist = pos.entry_price > 0
                        ? Math.abs(cp - pos.liq_price) / cp * 100
                        : 0;

                    return (
                        <div
                            key={pos.id}
                            className={`relative rounded-xl overflow-hidden border transition-colors ${
                                isProfit
                                    ? "border-emerald-500/10 bg-emerald-500/[0.02]"
                                    : "border-red-500/10 bg-red-500/[0.02]"
                            }`}
                        >
                            {/* 상단: 심볼 + 방향 + PnL + 닫기 */}
                            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                        isLong
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-red-500/15 text-red-400"
                                    }`}>
                                        {pos.side}
                                    </span>
                                    <span className="text-[13px] font-bold text-white">
                                        {pos.symbol.replace("USDT", "")}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 font-mono">{pos.leverage}x</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* PnL 크게 */}
                                    <div className="text-right">
                                        <div className={`text-[15px] font-bold font-mono tabular-nums ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                                            {isProfit ? "+" : ""}{pnl.toFixed(2)}
                                            <span className="text-[10px] ml-0.5 opacity-60">USDT</span>
                                        </div>
                                        <div className={`text-[11px] font-mono tabular-nums ${isProfit ? "text-emerald-400/70" : "text-red-400/70"}`}>
                                            {isProfit ? "+" : ""}{roe.toFixed(2)}%
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onClose(pos.id, cp)}
                                        className="text-[10px] px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-zinc-700/50 transition-colors cursor-pointer"
                                    >
                                        청산
                                    </button>
                                </div>
                            </div>

                            {/* 하단: 상세 정보 */}
                            <div className="grid grid-cols-5 gap-3 px-4 pb-3 pt-1">
                                <div>
                                    <div className="text-[9px] text-neutral-600 mb-0.5">진입가</div>
                                    <div className="text-[11px] text-neutral-200 font-mono tabular-nums">
                                        {pos.entry_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-neutral-600 mb-0.5">현재가</div>
                                    <div className="text-[11px] text-white font-mono tabular-nums">
                                        {cp.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-neutral-600 mb-0.5">청산가</div>
                                    <div className="text-[11px] text-orange-400 font-mono tabular-nums">
                                        {pos.liq_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-neutral-600 mb-0.5">증거금</div>
                                    <div className="text-[11px] text-neutral-300 font-mono tabular-nums">
                                        {pos.margin.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-neutral-600 mb-0.5">청산거리</div>
                                    <div className={`text-[11px] font-mono tabular-nums ${liqDist < 5 ? "text-orange-400" : "text-neutral-400"}`}>
                                        {liqDist.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* TP/SL 표시 */}
                            {(pos.tp_price || pos.sl_price) && (
                                <div className="flex gap-4 px-4 pb-2.5 text-[10px]">
                                    {pos.tp_price && (
                                        <span>
                                            <span className="text-neutral-600">TP </span>
                                            <span className="text-emerald-400/80 font-mono">${pos.tp_price.toFixed(2)}</span>
                                        </span>
                                    )}
                                    {pos.sl_price && (
                                        <span>
                                            <span className="text-neutral-600">SL </span>
                                            <span className="text-red-400/80 font-mono">${pos.sl_price.toFixed(2)}</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
