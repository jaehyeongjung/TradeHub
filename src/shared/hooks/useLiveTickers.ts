"use client";

import { useEffect, useRef, useState } from "react";

export type TickerState = {
    price: number | null;
    pct: number | null;
    /** 직전 틱 대비 방향. 가격 플래시 연출에만 쓴다. */
    dir: "up" | "down" | null;
};

type Rest24h = { symbol: string; lastPrice: string; priceChangePercent: string };
type StreamMsg = { stream: string; data: { c: string; P: string; s: string } };

const EMPTY: TickerState = { price: null, pct: null, dir: null };

/**
 * 심볼 여러 개를 바이낸스 combined stream 하나로 묶어 구독한다.
 * 데스크톱 CoinPriceBox는 박스마다 소켓을 따로 여는데, 모바일은 목록형이라
 * 소켓 하나로 충분하고 모바일 회선에서 연결 수를 늘릴 이유가 없다.
 */
export function useLiveTickers(symbols: string[]): Record<string, TickerState> {
    const key = symbols.join(",");
    const [map, setMap] = useState<Record<string, TickerState>>({});
    const prevRef = useRef<Record<string, number>>({});
    const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const list = key.split(",").filter(Boolean).map((s) => s.toLowerCase());
        if (list.length === 0) return;

        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnect: ReturnType<typeof setTimeout> | null = null;
        const timers = flashTimers.current;

        // 소켓 첫 틱이 오기 전 화면이 비지 않도록 24h 티커로 초기값을 채운다.
        (async () => {
            try {
                const param = JSON.stringify(list.map((s) => s.toUpperCase()));
                const res = await fetch(
                    `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(param)}`,
                    { cache: "no-store" },
                );
                if (!res.ok) return;
                const rows = (await res.json()) as Rest24h[];
                if (destroyed) return;
                const next: Record<string, TickerState> = {};
                for (const r of rows) {
                    const sym = r.symbol.toLowerCase();
                    const price = parseFloat(r.lastPrice);
                    const pct = parseFloat(r.priceChangePercent);
                    prevRef.current[sym] = price;
                    next[sym] = {
                        price: Number.isNaN(price) ? null : price,
                        pct: Number.isNaN(pct) ? null : pct,
                        dir: null,
                    };
                }
                setMap((cur) => ({ ...next, ...cur }));
            } catch {
                // 초기값은 없어도 소켓이 곧 채운다.
            }
        })();

        const connect = () => {
            if (destroyed) return;
            const streams = list.map((s) => `${s}@ticker`).join("/");
            ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                let msg: StreamMsg;
                try {
                    msg = JSON.parse(ev.data) as StreamMsg;
                } catch {
                    return;
                }
                const d = msg?.data;
                if (!d?.s) return;
                const sym = d.s.toLowerCase();
                const price = parseFloat(d.c);
                const pct = parseFloat(d.P);
                if (Number.isNaN(price)) return;

                const prev = prevRef.current[sym];
                const dir = prev != null && price !== prev ? (price > prev ? "up" : "down") : null;
                prevRef.current[sym] = price;

                setMap((cur) => ({
                    ...cur,
                    [sym]: { price, pct: Number.isNaN(pct) ? cur[sym]?.pct ?? null : pct, dir },
                }));

                if (dir) {
                    clearTimeout(timers[sym]);
                    timers[sym] = setTimeout(() => {
                        setMap((cur) => (cur[sym] ? { ...cur, [sym]: { ...cur[sym], dir: null } } : cur));
                    }, 600);
                }
            };

            ws.onclose = () => {
                if (!destroyed) reconnect = setTimeout(connect, 3000);
            };
            ws.onerror = () => {
                try { ws?.close(); } catch { /* 이미 닫힘 */ }
            };
        };

        connect();

        return () => {
            destroyed = true;
            if (reconnect) clearTimeout(reconnect);
            Object.values(timers).forEach(clearTimeout);
            if (ws) {
                ws.onmessage = null;
                ws.onclose = null;
                ws.onerror = null;
                try { ws.close(); } catch { /* 이미 닫힘 */ }
            }
        };
    }, [key]);

    const out: Record<string, TickerState> = {};
    for (const s of symbols) out[s.toLowerCase()] = map[s.toLowerCase()] ?? EMPTY;
    return out;
}
