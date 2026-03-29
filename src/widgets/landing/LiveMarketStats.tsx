"use client";

import { useState, useEffect } from "react";

export function LiveMarketStats() {
    const [btcPrice, setBtcPrice] = useState<number>(0);
    const [volume, setVolume] = useState<string>("---,---");
    const [isRising, setIsRising] = useState<boolean>(false);

    useEffect(() => {
        let prev = 0;

        const fetchMarketData = async () => {
            try {
                const res = await fetch(
                    "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
                );
                const data = await res.json();

                const currentPrice = parseFloat(data.lastPrice);

                if (currentPrice > prev && prev !== 0) {
                    setIsRising(true);
                    setTimeout(() => setIsRising(false), 500);
                }
                prev = currentPrice;

                setBtcPrice(currentPrice);
                setVolume(
                    parseFloat(data.volume).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                    }),
                );
            } catch (e) {
                console.error("Data fetch error", e);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-black tracking-[0.5em] text-zinc-500 mb-4 uppercase">
                Live Market Status
            </span>
            <div className="flex gap-12">
                <HeroStat
                    label="BTC/USDT"
                    value={btcPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                    })}
                    color={
                        isRising
                            ? "text-white scale-105"
                            : "text-[#02C076]"
                    }
                    isRising={isRising}
                />
                <HeroStat
                    label="24H VOL (BTC)"
                    value={volume}
                    color="text-white"
                />
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes flash {
                    0% { opacity: 1; filter: brightness(1); }
                    50% { opacity: 0.7; filter: brightness(2) drop-shadow(0 0 10px #02C076); }
                    100% { opacity: 1; filter: brightness(1); }
                }
                .animate-flash { animation: flash 0.4s ease-out; }
            `,
                }}
            />
        </div>
    );
}

function HeroStat({
    label,
    value,
    color,
    isRising,
}: {
    label: string;
    value: string;
    color: string;
    isRising?: boolean;
}) {
    return (
        <div className="flex flex-col items-end min-w-[120px]">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 mb-2 uppercase italic">
                {label}
            </span>
            <span
                className={`text-4xl md:text-6xl font-[1000] tracking-tighter ${color} transition-all duration-300 tabular-nums ${isRising ? "animate-flash" : ""}`}
            >
                {value}
            </span>
        </div>
    );
}
