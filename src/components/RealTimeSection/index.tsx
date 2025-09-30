import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex  min-h-screen gap-30  ">
            <div className="flex gap-5 h-25 mt-5 ml-5">
                <CoinPriceBox symbol="btcusdt" />
                <CoinPriceBox symbol="ethusdt" />
                <CoinPriceBox symbol="xrpusdt" />
                <CoinPriceBox symbol="solusdt" />
            </div>
            <div className="w-150">
                <CoinChart />
            </div>
        </div>
    );
};
