"use client";

import { useEffect, useRef, useState } from "react";
import { formatKrw } from "@/shared/lib/fx";

type Props = {
    symbol: string;
    initialPrice: number | null;
    initialChangePercent: number | null;
    /** null이면 원화 표기를 숨기고 달러만 보여준다 */
    usdKrw: number | null;
};

type TickerMessage = {
    e: string;
    c: string; // 현재가
    P: string; // 24h 변동률(%)
};

/**
 * SSR로 받은 가격을 그대로 그리다가 WS가 붙으면 실시간으로 갈아끼운다.
 * 초기 렌더가 서버 값과 같아야 크롤러가 가격을 읽을 수 있다.
 *
 * 국내 검색 유입("삼전 실시간주가")을 받는 페이지라 원화를 크게, 달러를 보조로 둔다.
 */
export function StockLivePrice({ symbol, initialPrice, initialChangePercent, usdKrw }: Props) {
    const [price, setPrice] = useState(initialPrice);
    const [changePercent, setChangePercent] = useState(initialChangePercent);
    const [isLive, setIsLive] = useState(false);
    const [flash, setFlash] = useState<"up" | "down" | null>(null);
    const prevPriceRef = useRef<number | null>(initialPrice);

    useEffect(() => {
        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let lastMessageAt = Date.now();

        function connect() {
            if (destroyed) return;
            // @ticker는 /market 라우트 소속. 라우트 없는 레거시 URL은 조용히 데이터가 끊긴다.
            ws = new WebSocket(
                `wss://fstream.binance.com/market/ws/${symbol.toLowerCase()}usdt@ticker`,
            );

            ws.onopen = () => {
                if (!destroyed) lastMessageAt = Date.now();
            };

            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                lastMessageAt = Date.now();
                setIsLive(true);
                try {
                    const data = JSON.parse(ev.data) as TickerMessage;
                    if (data.e !== "24hrTicker") return;
                    const next = Number(data.c);
                    if (!Number.isFinite(next)) return;

                    const prev = prevPriceRef.current;
                    if (prev !== null && next !== prev) {
                        setFlash(next > prev ? "up" : "down");
                        window.setTimeout(() => setFlash(null), 400);
                    }
                    prevPriceRef.current = next;
                    setPrice(next);
                    setChangePercent(Number(data.P));
                } catch {
                    // 파싱 실패는 조용히 무시 — 다음 틱에 복구된다
                }
            };

            ws.onclose = () => {
                if (destroyed) return;
                setIsLive(false);
                reconnectTimer = window.setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                try { ws?.close(); } catch { /* noop */ }
            };
        }

        // 소켓은 열려 있는데 데이터만 끊기는 경우를 잡는다 (onclose가 안 불려 재연결이 안 도는 상황)
        const watchdog = window.setInterval(() => {
            if (Date.now() - lastMessageAt > 60_000) {
                setIsLive(false);
                try { ws?.close(); } catch { /* noop */ }
            }
        }, 15_000);

        connect();

        return () => {
            destroyed = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            clearInterval(watchdog);
            if (ws) {
                ws.onmessage = null;
                ws.onclose = null;
                ws.onerror = null;
                try { ws.close(); } catch { /* noop */ }
            }
        };
    }, [symbol]);

    const isUp = (changePercent ?? 0) >= 0;
    const krw = price !== null && usdKrw !== null ? price * usdKrw : null;

    const flashColor =
        flash === "up" ? "text-[#02C076]" : flash === "down" ? "text-[#F6465D]" : "text-white";

    return (
        <div>
            {/* 원화를 주가격으로 — 국내 유입의 검색 의도에 맞춘다 */}
            <div
                className={`text-[2.25rem] leading-none sm:text-5xl font-extrabold tabular-nums tracking-tight transition-colors duration-300 ${flashColor}`}
            >
                {krw !== null
                    ? formatKrw(krw)
                    : price !== null
                      ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                {changePercent !== null && (
                    <span
                        className={`text-base sm:text-lg font-bold tabular-nums ${
                            isUp ? "text-[#02C076]" : "text-[#F6465D]"
                        }`}
                    >
                        {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
                    </span>
                )}

                {krw !== null && price !== null && (
                    <span className="text-sm text-zinc-500 tabular-nums">
                        ${price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                )}

                <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full ${
                        isLive ? "text-[#02C076] bg-[#02C076]/10" : "text-zinc-500 bg-zinc-800"
                    }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isLive ? "bg-[#02C076] animate-pulse" : "bg-zinc-600"
                        }`}
                    />
                    {isLive ? "실시간" : "연결 중"}
                </span>
            </div>
        </div>
    );
}
