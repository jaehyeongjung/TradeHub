import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";
import LongShortRatioBox from "@/components/LongShortRatioBox";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex gap-5 min-h-35 mt-5 mx-auto items-center w-full min-w-305 bg-gray-100 border-2 rounded-2xl ">
            <div className="flex gap-3 ml-6 w-full  ">
                <CoinPriceBox symbol="btcusdt" />
                <CoinPriceBox symbol="ethusdt" />
                <CoinPriceBox symbol="xrpusdt" />
                <CoinPriceBox symbol="solusdt" />
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
