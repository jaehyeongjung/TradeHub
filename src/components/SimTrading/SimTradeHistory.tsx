"use client";

import type { SimTrade } from "@/types/sim-trading";

interface Props {
    trades: SimTrade[];
}

export default function SimTradeHistory({ trades }: Props) {
    return (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <h3 className="text-xs font-semibold text-neutral-400 mb-3">
                거래 이력
            </h3>
            {trades.length === 0 ? (
                <div className="text-xs text-neutral-600 text-center py-4">
                    거래 이력이 없습니다
                </div>
            ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {trades.map((t) => {
                        const isLiq = t.type === "LIQUIDATION";
                        const isOpen = t.type === "OPEN";
                        const isProfit = t.pnl >= 0;
                        const date = new Date(t.created_at);
                        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

                        return (
                            <div
                                key={t.id}
                                className="flex items-center justify-between py-1.5 border-b border-neutral-800 last:border-0"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                            isLiq
                                                ? "bg-orange-500/20 text-orange-400"
                                                : t.side === "LONG"
                                                  ? "bg-emerald-500/20 text-emerald-400"
                                                  : "bg-red-500/20 text-red-400"
                                        }`}
                                    >
                                        {isLiq
                                            ? "청산"
                                            : isOpen
                                              ? "진입"
                                              : "종료"}
                                    </span>
                                    <span className="text-[10px] text-white">
                                        {t.symbol.replace("USDT", "")}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        ${t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[9px] text-neutral-600">
                                        ${(t.quantity * t.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isOpen && (
                                        <span
                                            className={`text-[10px] font-medium ${
                                                isLiq
                                                    ? "text-orange-400"
                                                    : isProfit
                                                      ? "text-emerald-400"
                                                      : "text-red-400"
                                            }`}
                                        >
                                            {isProfit && !isLiq ? "+" : ""}
                                            {t.pnl.toFixed(2)}
                                        </span>
                                    )}
                                    <span className="text-[9px] text-neutral-600">
                                        {timeStr}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
