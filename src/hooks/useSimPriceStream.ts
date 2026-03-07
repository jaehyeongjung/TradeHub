"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { activePageAtom, simPricesAtom, simChangesAtom, simSymbolAtom } from "@/store/atoms";
import { SUPPORTED_SYMBOLS } from "@/constants/sim-trading";

/**
 * 모의투자 페이지 활성 시 Binance WebSocket으로 실시간 가격을 스트리밍.
 * simPricesAtom에 가격 캐시를 업데이트.
 */
export function useSimPriceStream() {
    const activePage = useAtomValue(activePageAtom);
    const [prices, setPrices] = useAtom(simPricesAtom);
    const [, setChanges] = useAtom(simChangesAtom);
    const simSymbol = useAtomValue(simSymbolAtom);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<number | null>(null);

    useEffect(() => {
        if (activePage !== "sim") {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        function connect() {
            const streams = SUPPORTED_SYMBOLS.map(
                (s) => `${s.toLowerCase()}@ticker`
            ).join("/");
            const ws = new WebSocket(
                `wss://stream.binance.com:9443/stream?streams=${streams}`
            );

            ws.onmessage = (ev: MessageEvent<string>) => {
                try {
                    const msg = JSON.parse(ev.data);
                    const data = msg.data as { s: string; c: string; P: string };
                    if (data?.s && data?.c) {
                        const symbol = data.s;
                        const price = parseFloat(data.c);
                        const change = parseFloat(data.P ?? "0");
                        setPrices((prev) => {
                            if (prev[symbol] === price) return prev;
                            return { ...prev, [symbol]: price };
                        });
                        setChanges((prev) => {
                            if (prev[symbol] === change) return prev;
                            return { ...prev, [symbol]: change };
                        });
                    }
                } catch {}
            };

            ws.onclose = () => {
                if (activePage === "sim") {
                    reconnectRef.current = window.setTimeout(connect, 3000);
                }
            };

            ws.onerror = () => {
                try { ws.close(); } catch {}
            };

            wsRef.current = ws;
        }

        connect();

        return () => {
            if (reconnectRef.current) {
                clearTimeout(reconnectRef.current);
                reconnectRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.onmessage = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [activePage, setPrices]);

    return { prices, currentPrice: prices[simSymbol] ?? 0 };
}

