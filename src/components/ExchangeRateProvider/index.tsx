"use client";

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";
import { exchangeRateAtom, upbitPricesAtom } from "@/store/atoms";

// 주요 코인 목록
const UPBIT_SYMBOLS = ["BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "AVAX", "DOT", "MATIC", "LINK", "ATOM", "UNI", "APT", "OP", "ARB", "SUI", "NEAR", "FTM", "SAND", "MANA"];

async function fetchExchangeRate(): Promise<number | null> {
    try {
        const res = await fetch("/api/kimchi?symbol=BTC", { cache: "no-store" });
        if (!res.ok) return null;
        const data = await res.json();
        return data.usdkrw ?? null;
    } catch {
        return null;
    }
}

async function fetchUpbitPrices(): Promise<Record<string, number>> {
    try {
        const markets = UPBIT_SYMBOLS.map(s => `KRW-${s}`).join(",");
        const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`, {
            cache: "no-store",
        });
        if (!res.ok) return {};
        const data = await res.json() as Array<{ market: string; trade_price: number }>;
        const prices: Record<string, number> = {};
        for (const item of data) {
            const symbol = item.market.replace("KRW-", "").toLowerCase();
            prices[symbol] = item.trade_price;
        }
        return prices;
    } catch {
        return {};
    }
}

export default function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
    const setExchangeRate = useSetAtom(exchangeRateAtom);
    const setUpbitPrices = useSetAtom(upbitPricesAtom);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // 초기 로드
        fetchExchangeRate().then(setExchangeRate);
        fetchUpbitPrices().then(setUpbitPrices);

        // 환율 1분마다 갱신
        const rateInterval = setInterval(() => {
            fetchExchangeRate().then(setExchangeRate);
        }, 60000);

        // 업비트 WebSocket 연결
        const connectWs = () => {
            const ws = new WebSocket("wss://api.upbit.com/websocket/v1");
            wsRef.current = ws;

            ws.onopen = () => {
                const markets = UPBIT_SYMBOLS.map(s => `KRW-${s}`);
                ws.send(JSON.stringify([
                    { ticket: "tradehub" },
                    { type: "ticker", codes: markets }
                ]));
            };

            ws.onmessage = async (event) => {
                try {
                    const blob = event.data as Blob;
                    const text = await blob.text();
                    const data = JSON.parse(text) as { code: string; trade_price: number };
                    const symbol = data.code.replace("KRW-", "").toLowerCase();
                    setUpbitPrices(prev => ({ ...prev, [symbol]: data.trade_price }));
                } catch {
                    // ignore
                }
            };

            ws.onclose = () => {
                setTimeout(connectWs, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connectWs();

        return () => {
            clearInterval(rateInterval);
            wsRef.current?.close();
        };
    }, [setExchangeRate, setUpbitPrices]);

    return <>{children}</>;
}
