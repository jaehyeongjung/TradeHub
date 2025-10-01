import { CoinPriceBox } from "@/components/CoinPriceBox";
import CoinChart from "@/components/CoinChart";
import LongShortRatioBox from "@/components/LongShortRatioBox";

export const RealTimeSection = () => {
    return (
        <div className="font-sans flex gap-5 h-35 mt-5 ml-5 items-center w-350 bg-gray-100 border-2 rounded-2xl">
            <div className="flex gap-3 h-25 ml-6">
                <CoinPriceBox symbol="btcusdt" />
                <CoinPriceBox symbol="ethusdt" />
                <CoinPriceBox symbol="xrpusdt" />
                <CoinPriceBox symbol="solusdt" />
            </div>
            <CoinChart />
            <div className="flex gap-4">
                {/* 전체 계정 비율 (5m) */}
                <LongShortRatioBox
                    symbol="BTCUSDT"
                    source="global"
                    period="5m"
                />

                {/* 상위 트레이더 포지션 비율 (15m) */}
                <LongShortRatioBox
                    symbol="BTCUSDT"
                    source="top-trader"
                    period="5m"
                />
            </div>
        </div>
    );
};
