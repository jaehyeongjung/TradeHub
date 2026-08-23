"use client";

import { useEffect, useRef, useState } from "react";

export type Liquidation = {
    id: string;
    symbol: string;
    side: "LONG" | "SHORT";
    price: number;
    quantity: number;
    usdValue: number;
    timestamp: number;
};

export type WhaleTrade = {
    id: string;
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
    usdValue: number;
    timestamp: number;
};

type ForceOrder = {
    e: "forceOrder";
    o: { s: string; S: "BUY" | "SELL"; q: string; p: string; ap: string; T: number };
};

type AggTradeMsg = {
    stream: string;
    data: { e: "aggTrade"; s: string; a: number; p: string; q: string; T: number; m: boolean };
};

const WHALE_SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt"];
const MIN_USD = 50_000;

export const MIN_USD_LABEL = `$${MIN_USD / 1000}K+`;

/**
 * 실시간 청산 피드. forceOrder는 선물 /market 라우트 전용이라
 * 레거시 URL로 붙으면 연결은 되는데 데이터가 오지 않는다.
 */
export function useLiquidations(max = 20) {
    const [items, setItems] = useState<Liquidation[]>([]);
    const [connected, setConnected] = useState(false);
    const maxRef = useRef(max);
    maxRef.current = max;

    useEffect(() => {
        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnect: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            if (destroyed) return;
            ws = new WebSocket("wss://fstream.binance.com/market/ws/!forceOrder@arr");

            ws.onopen = () => { if (!destroyed) setConnected(true); };
            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                let data: ForceOrder;
                try {
                    data = JSON.parse(ev.data) as ForceOrder;
                } catch {
                    return;
                }
                if (data.e !== "forceOrder") return;
                const { o } = data;
                const quantity = parseFloat(o.q);
                const price = parseFloat(o.ap) || parseFloat(o.p);
                const usdValue = quantity * price;
                if (!Number.isFinite(usdValue) || usdValue < MIN_USD) return;

                // 매도 강제청산 = 롱 포지션이 털린 것
                const side: Liquidation["side"] = o.S === "SELL" ? "LONG" : "SHORT";
                setItems((prev) => [{
                    id: `${o.s}-${o.T}-${prev.length}-${usdValue}`,
                    symbol: o.s.replace("USDT", ""),
                    side, price, quantity, usdValue, timestamp: o.T,
                }, ...prev].slice(0, maxRef.current));
            };
            ws.onclose = () => {
                if (destroyed) return;
                setConnected(false);
                reconnect = setTimeout(connect, 3000);
            };
            ws.onerror = () => {
                try { ws?.close(); } catch { /* 이미 닫힘 */ }
            };
        };

        connect();
        return () => {
            destroyed = true;
            if (reconnect) clearTimeout(reconnect);
            if (ws) {
                ws.onmessage = null; ws.onclose = null; ws.onerror = null;
                try { ws.close(); } catch { /* 이미 닫힘 */ }
            }
        };
    }, []);

    return { items, connected };
}

/** 고래 거래. 초기 목록은 REST로 채우고 이후 aggTrade 스트림으로 이어붙인다. */
export function useWhaleTrades(max = 20) {
    const [items, setItems] = useState<WhaleTrade[]>([]);
    const [connected, setConnected] = useState(false);
    const maxRef = useRef(max);
    maxRef.current = max;

    useEffect(() => {
        let destroyed = false;

        (async () => {
            try {
                const results = await Promise.all(
                    WHALE_SYMBOLS.map(async (s) => {
                        const res = await fetch(
                            `https://api.binance.com/api/v3/aggTrades?symbol=${s.toUpperCase()}&limit=80`,
                        );
                        if (!res.ok) return [];
                        return (await res.json()) as { a: number; p: string; q: string; T: number; m: boolean }[];
                    }),
                );
                if (destroyed) return;
                const all: WhaleTrade[] = [];
                results.forEach((rows, idx) => {
                    const sym = WHALE_SYMBOLS[idx].toUpperCase();
                    for (const r of rows) {
                        const price = parseFloat(r.p);
                        const quantity = parseFloat(r.q);
                        const usdValue = price * quantity;
                        if (!Number.isFinite(usdValue) || usdValue < MIN_USD) continue;
                        all.push({
                            id: `${sym}-${r.a}-init`,
                            symbol: sym.replace("USDT", ""),
                            side: r.m ? "SELL" : "BUY",
                            price, quantity, usdValue, timestamp: r.T,
                        });
                    }
                });
                all.sort((a, b) => b.timestamp - a.timestamp);
                setItems((prev) => (prev.length === 0 ? all.slice(0, maxRef.current) : prev));
            } catch {
                // 초기 목록이 비어도 스트림이 곧 채운다.
            }
        })();

        let ws: WebSocket | null = null;
        let reconnect: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            if (destroyed) return;
            const streams = WHALE_SYMBOLS.map((s) => `${s}@aggTrade`).join("/");
            ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

            ws.onopen = () => { if (!destroyed) setConnected(true); };
            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                let msg: AggTradeMsg;
                try {
                    msg = JSON.parse(ev.data) as AggTradeMsg;
                } catch {
                    return;
                }
                const d = msg?.data;
                if (d?.e !== "aggTrade") return;
                const price = parseFloat(d.p);
                const quantity = parseFloat(d.q);
                const usdValue = price * quantity;
                if (!Number.isFinite(usdValue) || usdValue < MIN_USD) return;

                const side: WhaleTrade["side"] = d.m ? "SELL" : "BUY";
                setItems((prev) => [{
                    id: `${d.s}-${d.a}`,
                    symbol: d.s.replace("USDT", ""),
                    side, price, quantity, usdValue, timestamp: d.T,
                }, ...prev].slice(0, maxRef.current));
            };
            ws.onclose = () => {
                if (destroyed) return;
                setConnected(false);
                reconnect = setTimeout(connect, 3000);
            };
            ws.onerror = () => {
                try { ws?.close(); } catch { /* 이미 닫힘 */ }
            };
        };

        connect();
        return () => {
            destroyed = true;
            if (reconnect) clearTimeout(reconnect);
            if (ws) {
                ws.onmessage = null; ws.onclose = null; ws.onerror = null;
                try { ws.close(); } catch { /* 이미 닫힘 */ }
            }
        };
    }, []);

    return { items, connected };
}
