"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { activePageAtom, simPricesAtom, simChangesAtom, simSymbolAtom } from "@/shared/store/atoms";
import { SUPPORTED_SYMBOLS } from "@/shared/constants/sim-trading.constants";
import { FUTURES_ONLY, getBinanceCombinedStreamUrl } from "@/shared/lib/binance";

/**
 * 현물에 없는 심볼은 현물 combined stream이 조용히 버린다 — 소켓은 멀쩡히 열리고
 * 나머지 심볼은 정상으로 오는데 그 심볼만 영영 안 온다. HYPE가 그랬다.
 * 그래서 거래소별로 소켓을 나눠 연다.
 */
const SPOT_SYMBOLS    = SUPPORTED_SYMBOLS.filter((s) => !FUTURES_ONLY.has(s));
const FUTURES_SYMBOLS = SUPPORTED_SYMBOLS.filter((s) =>  FUTURES_ONLY.has(s));

export function useSimPriceStream() {
    const activePage = useAtomValue(activePageAtom);
    const [prices, setPrices] = useAtom(simPricesAtom);
    const [, setChanges] = useAtom(simChangesAtom);
    const simSymbol = useAtomValue(simSymbolAtom);
    const socketsRef = useRef<WebSocket[]>([]);
    const reconnectRef = useRef<number[]>([]);

    useEffect(() => {
        function closeAll() {
            for (const id of reconnectRef.current) clearTimeout(id);
            reconnectRef.current = [];
            for (const ws of socketsRef.current) {
                ws.onmessage = null;
                ws.onclose = null;
                ws.onerror = null;
                try { ws.close(); } catch {}
            }
            socketsRef.current = [];
        }

        if (activePage !== "sim") {
            closeAll();
            return;
        }

        function connect(symbols: readonly string[], futures: boolean) {
            if (!symbols.length) return;

            const ws = new WebSocket(getBinanceCombinedStreamUrl(symbols, futures));

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
                socketsRef.current = socketsRef.current.filter((s) => s !== ws);
                if (activePage === "sim") {
                    reconnectRef.current.push(
                        window.setTimeout(() => connect(symbols, futures), 3000),
                    );
                }
            };

            ws.onerror = () => {
                try { ws.close(); } catch {}
            };

            socketsRef.current.push(ws);
        }

        connect(SPOT_SYMBOLS, false);
        connect(FUTURES_SYMBOLS, true);

        return closeAll;
    }, [activePage, setPrices, setChanges]);

    return { prices, currentPrice: prices[simSymbol] ?? 0 };
}
