"use client";

import { motion } from "framer-motion";
import { SimOrderBook } from "@/features/sim-trading/SimOrderBook";
import { SimPositions } from "@/features/sim-trading/SimPositions";
import { SimOrders } from "@/features/sim-trading/SimOrders";
import { SimTradeHistory } from "@/features/sim-trading/SimTradeHistory";
import { SimLeaderboard } from "@/features/sim-trading/SimLeaderboard";
import type { SimPosition, SimOrder, SimTrade } from "@/shared/types/sim-trading.types";
import { useMobileCopy } from "@/widgets/mobile/copy";

export type TradingTab = "book" | "positions" | "orders" | "history" | "ranking";

type Props = {
    tab: TradingTab;
    onTabChange: (t: TradingTab) => void;
    positions: SimPosition[];
    orders: SimOrder[];
    trades: SimTrade[];
    userId: string | null;
    isEn: boolean;
    onClosePosition: (positionId: string, closePrice: number) => Promise<unknown>;
    onUpdateTpSl: (positionId: string, tp: number | null, sl: number | null) => Promise<void>;
    onCancelOrder: (orderId: string) => Promise<void>;
    onPriceClick: (price: number) => void;
};

/**
 * 데스크톱은 호가·주문패널을 차트 옆에 나란히 두지만, 모바일은 폭이 없어
 * 하나씩 갈아끼운다. 호가를 첫 탭으로 두는 건 주문 직전에 보는 화면이라서다.
 */
export function MobileTradingTabs({
    tab, onTabChange, positions, orders, trades, userId, isEn,
    onClosePosition, onUpdateTpSl, onCancelOrder, onPriceClick,
}: Props) {
    const { t } = useMobileCopy();

    const TABS: { key: TradingTab; label: string; count: number | null }[] = [
        { key: "book", label: t.orderBook, count: null },
        { key: "positions", label: t.positions, count: positions.length },
        { key: "orders", label: t.openOrders, count: orders.length },
        { key: "history", label: t.tradeHistory, count: null },
        { key: "ranking", label: t.ranking, count: null },
    ];

    return (
        <section className="px-4" aria-label={t.positions}>
            <div className="flex gap-1 overflow-x-auto pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map(({ key, label, count }) => {
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onTabChange(key)}
                            aria-pressed={active}
                            className="relative shrink-0 rounded-control px-3 py-2 text-footnote font-bold transition-colors"
                        >
                            {active && (
                                <motion.span
                                    layoutId="mobile-trading-tab"
                                    className="absolute inset-0 rounded-control bg-surface-input"
                                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                />
                            )}
                            <span className={`relative flex items-center gap-1.5 ${active ? "text-text-primary" : "text-text-muted"}`}>
                                {label}
                                {count !== null && count > 0 && (
                                    <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                                        active
                                            ? "bg-[var(--color-up-muted)] text-[var(--color-up-text)]"
                                            : "bg-surface-hover text-text-muted"
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="overflow-hidden rounded-card border border-border-subtle bg-surface-card">
                {/* 호가는 자체 스크롤이 필요해 높이를 고정한다. 나머지는 내용만큼 늘리고
                    페이지 스크롤에 맡긴다 — 중첩 스크롤은 손가락으로 잡기 어렵다. */}
                {tab === "book" && (
                    <div className="h-[420px] p-2">
                        <SimOrderBook onPriceClick={onPriceClick} />
                    </div>
                )}
                {tab === "positions" && (
                    <div className="p-2.5">
                        <SimPositions positions={positions} onClose={onClosePosition} onUpdateTpSl={onUpdateTpSl} isEn={isEn} mobile />
                    </div>
                )}
                {tab === "orders" && (
                    <div className="p-2.5">
                        <SimOrders orders={orders} onCancel={onCancelOrder} isEn={isEn} />
                    </div>
                )}
                {tab === "history" && (
                    <div className="max-h-[420px] overflow-y-auto p-2.5">
                        <SimTradeHistory trades={trades} isEn={isEn} mobile />
                    </div>
                )}
                {tab === "ranking" && (
                    <div className="max-h-[520px] overflow-y-auto p-2.5">
                        <SimLeaderboard userId={userId} isEn={isEn} />
                    </div>
                )}
            </div>
        </section>
    );
}
