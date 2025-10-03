import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";
import LongShortRatioBox from "@/components/LongShortRatioBox";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex gap-5 min-h-35 mt-5 mx-auto bg-neutral-950 items-center w-full min-w-305  border-2 rounded-2xl ">
            <div className="flex gap-3 ml-6 w-full  ">
                <CoinPriceBox boxId="tile-1" defaultSymbol="btcusdt" />
                <CoinPriceBox boxId="tile-2" defaultSymbol="ethusdt" />
                <CoinPriceBox boxId="tile-3" defaultSymbol="xrpusdt" />
                <CoinPriceBox boxId="tile-4" defaultSymbol="solusdt" />
            </div>
            <CoinChart />
            <div className="flex gap-4 w-full mr-5">
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
        </div>
    );
};
