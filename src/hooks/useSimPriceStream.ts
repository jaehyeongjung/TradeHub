"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { activePageAtom, simPricesAtom, simChangesAtom, simSymbolAtom } from "@/store/atoms";

const SUPPORTED_SYMBOLS = [
    // Tier 1 — 최상위 유동성
    "BTCUSDT",  "ETHUSDT",  "BNBUSDT",  "SOLUSDT",  "XRPUSDT",
    "DOGEUSDT", "ADAUSDT",  "AVAXUSDT", "LINKUSDT", "DOTUSDT",
    // Tier 2 — 주요 알트
    "MATICUSDT","LTCUSDT",  "ATOMUSDT", "UNIUSDT",  "NEARUSDT",
    "APTUSDT",  "ARBUSDT",  "OPUSDT",   "INJUSDT",  "SUIUSDT",
    // Tier 3 — 레이어1 / 인프라
    "TRXUSDT",  "BCHUSDT",  "ETCUSDT",  "FILUSDT",  "ALGOUSDT",
    "VETUSDT",  "EOSUSDT",  "HBARUSDT", "QTUMUSDT", "FLOWUSDT",
    // Tier 4 — DeFi
    "AAVEUSDT", "LDOUSDT",  "CRVUSDT",  "MKRUSDT",  "SNXUSDT",
    "RUNEUSDT", "GRTUSDT",  "PENDLEUSDT","KAVAUSDT", "IMXUSDT",
    // Tier 5 — 메타버스 / 게임
    "SANDUSDT", "MANAUSDT", "GALAUSDT", "AXSUSDT",  "ENJUSDT",
    // Tier 6 — 신규 / 트렌드
    "TONUSDT",  "SEIUSDT",  "TIAUSDT",  "WLDUSDT",  "ORDIUSDT",
    "JUPUSDT",  "FETUSDT",  "STXUSDT",  "FTMUSDT",  "WIFUSDT",
];

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

export { SUPPORTED_SYMBOLS };
