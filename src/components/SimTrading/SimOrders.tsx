"use client";

import type { SimOrder } from "@/types/sim-trading";

interface Props {
    orders: SimOrder[];
    onCancel: (orderId: string) => Promise<void>;
}

export default function SimOrders({ orders, onCancel }: Props) {
    if (orders.length === 0) {
        return (
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
                <h3 className="text-xs font-semibold text-neutral-400 mb-2">
                    미체결 주문
                </h3>
                <div className="text-xs text-neutral-600 text-center py-4">
                    미체결 주문이 없습니다
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <h3 className="text-xs font-semibold text-neutral-400 mb-3">
                미체결 주문 ({orders.length})
            </h3>
            <div className="space-y-2">
                {orders.map((ord) => (
                    <div
                        key={ord.id}
                        className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50"
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    ord.side === "LONG"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                }`}
                            >
                                {ord.side} {ord.leverage}x
                            </span>
                            <span className="text-xs text-white font-medium">
                                {ord.symbol.replace("USDT", "/USDT")}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                                {ord.order_type === "LIMIT" ? "지정가" : "스탑"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-500">
                                    가격
                                </div>
                                <div className="text-xs text-white">
                                    ${ord.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-500">
                                    수량
                                </div>
                                <div className="text-xs text-neutral-300">
                                    {ord.quantity.toFixed(6)}
                                </div>
                            </div>
                            <button
                                onClick={() => onCancel(ord.id)}
                                className="text-[10px] px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors cursor-pointer"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
