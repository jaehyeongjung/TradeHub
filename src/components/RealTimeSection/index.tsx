import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex gap-15 h-40 mt-5 ml-5 items-center w-350 bg-amber-200 border-2 rounded-2xl">
            <div className="flex gap-5 h-25 ml-10">
                <CoinPriceBox symbol="btcusdt" />
                <CoinPriceBox symbol="ethusdt" />
                <CoinPriceBox symbol="xrpusdt" />
                <CoinPriceBox symbol="solusdt" />
            </div>
            <div className="w-100 border-1 h-30 rounded-2xl">
                <CoinChart />
            </div>
        </div>
    );
};
