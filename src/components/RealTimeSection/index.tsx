import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex gap-15 h-35 mt-5 ml-5 items-center w-350 bg-amber-100 border-2 rounded-2xl">
            <div className="flex gap-5 h-25 ml-10">
                <CoinPriceBox symbol="btcusdt" />
                <CoinPriceBox symbol="ethusdt" />
                <CoinPriceBox symbol="xrpusdt" />
                <CoinPriceBox symbol="solusdt" />
            </div>
                <CoinChart />
            <div className="flex flex-col gap-5 ">
                <button className="border rounded-2xl w-30 h-10 cursor-pointer">
                    <span className="text-sm">로그인</span>
                </button>
            </div>
        </div>
    );
};
