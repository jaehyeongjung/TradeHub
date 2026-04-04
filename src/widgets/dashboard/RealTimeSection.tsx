"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { CoinPriceBox } from "@/entities/coin/CoinPriceBox";
import { LiquidationFeed } from "@/entities/whale/LiquidationFeed";
import { WhaleTrades } from "@/entities/whale/WhaleTrades";

const CoinChart = dynamic(() => import("@/entities/coin/CoinChart").then(m => ({ default: m.CoinChart })), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-35 2xl:min-h-50 bg-surface-elevated rounded-xl animate-pulse" />
    ),
});

export const RealTimeSection = () => {
    const pathname = usePathname();
    const isEn = pathname.startsWith("/en/");

    return (
        <section
            aria-label="실시간 코인 가격 및 차트"
            className="realtime-section font-sans flex gap-3 2xl:gap-5 min-h-35 2xl:min-h-50 mt-3 2xl:mt-4 mx-auto bg-surface-card items-center w-full min-w-[1320px] border border-border-subtle rounded-2xl px-4 2xl:px-6"
        >
            <div className="flex gap-2 2xl:gap-3 flex-[3] min-w-0">
                <CoinPriceBox boxId="tile-1" defaultSymbol="btcusdt" fadeDelay={0} />
                <CoinPriceBox boxId="tile-2" defaultSymbol="ethusdt" fadeDelay={80} />
                <CoinPriceBox boxId="tile-3" defaultSymbol="xrpusdt" fadeDelay={160} />
                <CoinPriceBox boxId="tile-4" defaultSymbol="solusdt" fadeDelay={240} />
            </div>

            <div className="flex-[2] min-w-0">
                <CoinChart fadeDelay={300} locale={isEn ? "en" : "ko"} />
            </div>

            <div className="flex gap-2 2xl:gap-4 flex-[2] min-w-0">
                <WhaleTrades fadeDelay={380} />
                <LiquidationFeed fadeDelay={460} />
            </div>
        </section>
    );
};
