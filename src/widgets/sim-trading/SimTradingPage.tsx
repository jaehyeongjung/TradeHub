"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, simChangesAtom } from "@/shared/store/atoms";
import { useSimPriceStream } from "@/features/sim-trading/useSimPriceStream";
import { useSimAccount } from "@/features/sim-trading/useSimAccount";
import SimOrderPanel from "@/features/sim-trading/SimOrderPanel";
import SimPositions from "@/features/sim-trading/SimPositions";
import SimOrders from "@/features/sim-trading/SimOrders";
import SimTradeHistory from "@/features/sim-trading/SimTradeHistory";
import SimOrderBook from "@/features/sim-trading/SimOrderBook";
import SimMarketData from "@/features/sim-trading/SimMarketData";
import SimLeaderboard from "@/features/sim-trading/SimLeaderboard";
import SimSymbolSelector from "@/features/sim-trading/SimSymbolSelector";
import { useTheme } from "@/shared/hooks/useTheme";

const CoinChart = dynamic(() => import("@/entities/coin/CoinChart"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[300px] bg-neutral-900 rounded-xl animate-pulse" />
    ),
});


const TABS = [
    { key: "positions", label: "포지션" },
    { key: "orders", label: "주문" },
    { key: "history", label: "거래내역" },
    { key: "ranking", label: "랭킹" },
] as const;

type TabKey = typeof TABS[number]["key"];

const ORDER_BOOK_NATURAL_H = 770;

export default function SimTradingPage() {
    const isLight = useTheme();
    const simSymbol = useAtomValue(simSymbolAtom);
    const prices = useAtomValue(simPricesAtom);
    const changes = useAtomValue(simChangesAtom);
    const [clickedPrice, setClickedPrice] = useState<number | null>(null);
    const [bottomTab, setBottomTab] = useState<TabKey>("positions");
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useSimPriceStream();

    const currentPrice = prices[simSymbol] ?? 0;
    const priceChange = changes[simSymbol] ?? null;

    useEffect(() => {
        const el = tabRefs.current[bottomTab];
        if (el) setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }, [bottomTab]);

    const {
        userId,
        account,
        positions,
        orders,
        trades,
        loading,
        totalUnrealizedPnl,
        totalPositionMargin,
        openPosition,
        closePosition,
        cancelOrder,
        resetAccount,
        updateTpSl,
    } = useSimAccount();

    const lockedMarginMode = positions.find(p => p.symbol === simSymbol)?.margin_mode ?? null;

    const handleOrderBookClick = (price: number) => {
        setClickedPrice(price);
        setTimeout(() => setClickedPrice(null), 50);
    };

    const isUp = (priceChange ?? 0) >= 0;

    const headerBg = isLight ? "bg-white border-neutral-200" : "bg-neutral-950 border-zinc-800/60";
    const tabBg = isLight ? "bg-white border-neutral-200" : "bg-neutral-950 border-zinc-800/60";
    const tabBorder = isLight ? "border-neutral-100" : "border-zinc-800/60";
    const tabActive = isLight ? "text-amber-600" : "text-amber-400";
    const tabInactive = isLight ? "text-neutral-500 hover:text-neutral-700" : "text-neutral-500 hover:text-neutral-300";
    const badgeActive = isLight ? "bg-amber-500/10 text-amber-600" : "bg-amber-500/10 text-amber-400";
    const badgeInactive = isLight ? "bg-neutral-100 text-neutral-500" : "bg-neutral-800 text-neutral-500";
    const contentBg = isLight ? "bg-neutral-50" : "";

    return (
        <div className="flex flex-col gap-3 w-full min-w-[1320px] mx-auto">

            <div className={`flex items-center gap-4 px-4 py-2.5 rounded-xl border overflow-x-auto scrollbar-none ${headerBg}`}>
                <SimSymbolSelector isLight={isLight} />
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[20px] font-bold font-mono tabular-nums ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                        {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </span>
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono min-w-[60px] ${
                        priceChange === null
                            ? "bg-neutral-800/40 text-neutral-600"
                            : isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    }`}>
                        {priceChange === null ? (
                            <span className="w-full text-center">—</span>
                        ) : (
                            <>
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d={isUp ? "M7 14l5-5 5 5H7z" : "M7 10l5 5 5-5H7z"} />
                                </svg>
                                {Math.abs(priceChange).toFixed(2)}%
                            </>
                        )}
                    </div>
                </div>
                <SimMarketData />
            </div>

            <div className="flex gap-3 h-[calc(100vh-200px)] min-h-[480px]">
                <div className="flex-1 min-w-0">
                    <CoinChart
                        boxId="sim-chart"
                        symbol={simSymbol}
                        interval="1m"
                        className="h-full"
                        hideControls
                        enableIndicators
                        positions={positions}
                        onUpdateTpSl={updateTpSl}
                    />
                </div>
                <div className="w-[280px] flex-shrink-0">
                    <SimOrderBook onPriceClick={handleOrderBookClick} />
                </div>
                <div className="w-[300px] flex-shrink-0">
                    <SimOrderPanel
                        account={account}
                        totalUnrealizedPnl={totalUnrealizedPnl}
                        totalPositionMargin={totalPositionMargin}
                        loading={loading}
                        onSubmit={async (input) => { await openPosition(input); }}
                        onReset={resetAccount}
                        clickedPrice={clickedPrice}
                        lockedMarginMode={lockedMarginMode}
                    />
                </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden flex-shrink-0 ${tabBg}`}>
                <div className={`relative flex border-b ${tabBorder}`}>
                    <div
                        className="absolute bottom-0 h-[2px] bg-amber-500 rounded-full transition-all duration-200 ease-out"
                        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                    />
                    {TABS.map(({ key, label }) => {
                        const count =
                            key === "positions" ? positions.length :
                            key === "orders" ? orders.length : null;
                        const active = bottomTab === key;

                        return (
                            <button
                                key={key}
                                ref={(el) => { tabRefs.current[key] = el; }}
                                onClick={() => setBottomTab(key)}
                                className={`relative flex-1 py-3 text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                    active ? tabActive : tabInactive
                                }`}
                            >
                                {key === "ranking" && <span className="text-[13px]">🏆</span>}
                                {label}
                                {count !== null && count > 0 && (
                                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full ${
                                        active ? badgeActive : badgeInactive
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className={`p-4 ${contentBg}`}>
                    {bottomTab === "positions" && (
                        <SimPositions positions={positions} onClose={closePosition} onUpdateTpSl={updateTpSl} />
                    )}
                    {bottomTab === "orders" && (
                        <SimOrders orders={orders} onCancel={cancelOrder} />
                    )}
                    {bottomTab === "history" && (
                        <SimTradeHistory trades={trades} />
                    )}
                    {bottomTab === "ranking" && (
                        <SimLeaderboard userId={userId} />
                    )}
                </div>
            </div>
        </div>
    );
}
