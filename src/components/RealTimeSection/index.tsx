import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";
import LongShortRatioBox from "@/components/LongShortRatioBox";

export const RealTimeSection = () => {
    return (
        <section
            aria-label="실시간 코인 가격 및 차트"
            className="font-sans flex gap-3 2xl:gap-5 min-h-35 2xl:min-h-50 mt-4 mx-auto bg-neutral-950 items-center w-full min-w-[1320px] border border-zinc-800 rounded-2xl px-4 2xl:px-6"
        >
            {/* 코인 가격 박스들 - 비율 3 */}
            <div className="flex gap-2 2xl:gap-3 flex-[3] min-w-0">
                <CoinPriceBox boxId="tile-1" defaultSymbol="btcusdt" />
                <CoinPriceBox boxId="tile-2" defaultSymbol="ethusdt" />
                <CoinPriceBox boxId="tile-3" defaultSymbol="xrpusdt" />
                <CoinPriceBox boxId="tile-4" defaultSymbol="solusdt" />
            </div>

            {/* 차트 - 비율 2 */}
            <div className="flex-[2] min-w-0">
                <CoinChart />
            </div>

            {/* 롱숏 비율 박스들 - 비율 2 */}
            <div className="flex gap-2 2xl:gap-4 flex-[2] min-w-0">
                <LongShortRatioBox
                    symbol="BTCUSDT"
                    source="global"
                    period="5m"
                />
                <LongShortRatioBox
                    symbol="BTCUSDT"
                    source="top-trader"
                    period="5m"
                />
            </div>
        </section>
    );
};
