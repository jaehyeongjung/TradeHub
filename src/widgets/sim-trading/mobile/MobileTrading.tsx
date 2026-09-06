"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAtomValue } from "jotai";
import { simSymbolAtom } from "@/shared/store/atoms";
import { useSimPriceStream } from "@/features/sim-trading/useSimPriceStream";
import { useSimAccount } from "@/features/sim-trading/useSimAccount";
import type { PositionSide } from "@/shared/types/sim-trading.types";
import { MobileHeader } from "@/widgets/mobile/MobileHeader";
import { MobileTradingTicker } from "./MobileTradingTicker";
import { MobileTradingTabs, type TradingTab } from "./MobileTradingTabs";
import { MobileOrderBar } from "./MobileOrderBar";

const CoinChart = dynamic(
    () => import("@/entities/coin/CoinChart").then((m) => ({ default: m.CoinChart })),
    {
        ssr: false,
        loading: () => <div className="h-full w-full animate-pulse rounded-card bg-surface-input" />,
    },
);

/**
 * 모바일 전용 모의투자 화면.
 *
 * 데스크톱은 차트·호가·주문패널을 가로로 三분할하지만, 모바일에는 그 폭이 없다.
 * 대신 세로 한 줄로 세우고 — 시세 → 차트 → (호가/포지션/주문/내역/랭킹) —
 * 주문만 하단 고정 바와 시트로 빼냈다. 주문은 스크롤 위치와 무관하게
 * 항상 한 번에 닿아야 하는 유일한 동작이라서다.
 */
export function MobileTrading() {
    const simSymbol = useAtomValue(simSymbolAtom);

    const [tab, setTab] = useState<TradingTab>("book");
    const [clickedPrice, setClickedPrice] = useState<number | null>(null);
    const [orderSide, setOrderSide] = useState<PositionSide | null>(null);

    useSimPriceStream();

    const {
        userId, account, positions, orders, trades, loading,
        totalUnrealizedPnl, totalPositionMargin,
        openPosition, closePosition, cancelOrder, resetAccount, updateTpSl,
    } = useSimAccount();

    const lockedMarginMode = positions.find((p) => p.symbol === simSymbol)?.margin_mode ?? null;

    // 호가에서 가격을 탭하면 그 값을 들고 주문 시트를 연다. 데스크톱은 옆에 뜬
    // 주문 패널의 지정가 칸이 채워지지만, 모바일은 패널이 시트 안에 있어서
    // 열어주지 않으면 탭한 결과가 아무 데도 보이지 않는다.
    const handlePriceClick = (price: number) => {
        setClickedPrice(price);
        setOrderSide((cur) => cur ?? "LONG");
        setTimeout(() => setClickedPrice(null), 50);
    };

    return (
        <div data-mobile-shell className="flex min-h-screen flex-col bg-surface-page">
            <MobileHeader />
            <MobileTradingTicker />

            <div className="flex flex-1 flex-col gap-5 py-4">
                <section className="px-4" aria-label="차트">
                    <div className="h-[300px] overflow-hidden rounded-card border border-border-subtle bg-surface-card">
                        <CoinChart
                            boxId="sim-chart-mobile"
                            symbol={simSymbol}
                            interval="1m"
                            className="h-full"
                            hideControls
                            positions={positions}
                            onUpdateTpSl={updateTpSl}
                            locale="ko"
                        />
                    </div>
                </section>

                <MobileTradingTabs
                    tab={tab}
                    onTabChange={setTab}
                    positions={positions}
                    orders={orders}
                    trades={trades}
                    userId={userId}
                    onClosePosition={closePosition}
                    onUpdateTpSl={updateTpSl}
                    onCancelOrder={cancelOrder}
                    onPriceClick={handlePriceClick}
                />
            </div>

            <MobileOrderBar
                account={account}
                totalUnrealizedPnl={totalUnrealizedPnl}
                totalPositionMargin={totalPositionMargin}
                loading={loading}
                onSubmit={async (input) => { await openPosition(input); }}
                onReset={resetAccount}
                clickedPrice={clickedPrice}
                lockedMarginMode={lockedMarginMode}
                positionCount={positions.length}
                orderCount={orders.length}
                openSide={orderSide}
                onOpenChange={setOrderSide}
            />
        </div>
    );
}
