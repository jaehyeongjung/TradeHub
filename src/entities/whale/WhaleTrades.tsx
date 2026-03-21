"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { treemapOpenAtom } from "@/shared/store/atoms";

type WhaleTrade = {
    id: string;
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
    usdValue: number;
    timestamp: number;
};

type BinanceAggTrade = {
    e: "aggTrade";
    E: number;
    s: string;
    a: number;
    p: string;
    q: string;
    T: number;
    m: boolean;
};

type CombinedStreamMessage = {
    stream: string;
    data: BinanceAggTrade;
};

const WATCH_SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt"];
const MIN_USD_VALUE = 50000;
const MAX_ITEMS = 15;

export default function WhaleTrades({ fadeDelay = 0 }: { fadeDelay?: number }) {
    const [trades, setTrades] = useState<WhaleTrade[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isTreemapOpen) return;
        (async () => {
            try {
                const results = await Promise.all(
                    WATCH_SYMBOLS.map(async (s) => {
                        const res = await fetch(
                            `https://api.binance.com/api/v3/aggTrades?symbol=${s.toUpperCase()}&limit=80`
                        );
                        return (await res.json()) as { a: number; p: string; q: string; T: number; m: boolean }[];
                    })
                );
                const all: WhaleTrade[] = [];
                results.forEach((rows, idx) => {
                    const sym = WATCH_SYMBOLS[idx].toUpperCase();
                    for (const r of rows) {
                        const price = parseFloat(r.p);
                        const qty = parseFloat(r.q);
                        const usd = price * qty;
                        if (usd < MIN_USD_VALUE) continue;
                        all.push({ id: `${sym}-${r.a}-init`, symbol: sym.replace("USDT", ""), side: r.m ? "SELL" : "BUY", price, quantity: qty, usdValue: usd, timestamp: r.T });
                    }
                });
                all.sort((a, b) => b.timestamp - a.timestamp);
                setTrades((prev) => prev.length === 0 ? all.slice(0, MAX_ITEMS) : prev);
            } catch {}
        })();
    }, [isTreemapOpen]);

    useEffect(() => {
        if (isTreemapOpen) return;
        let destroyed = false;
        function connect() {
            if (destroyed) return;
            const streams = WATCH_SYMBOLS.map((s) => `${s}@aggTrade`).join("/");
            const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
            wsRef.current = ws;
            ws.onopen = () => { if (!destroyed) setIsConnected(true); };
            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                try {
                    const msg = JSON.parse(ev.data) as CombinedStreamMessage;
                    const d = msg.data;
                    if (d.e !== "aggTrade") return;
                    const price = parseFloat(d.p);
                    const quantity = parseFloat(d.q);
                    const usdValue = price * quantity;
                    if (usdValue < MIN_USD_VALUE) return;
                    setTrades((prev) => [{ id: `${d.s}-${d.a}-${Date.now()}`, symbol: d.s.replace("USDT", ""), side: (d.m ? "SELL" : "BUY") as "BUY" | "SELL", price, quantity, usdValue, timestamp: d.T }, ...prev].slice(0, MAX_ITEMS));
                } catch {}
            };
            ws.onclose = () => { if (!destroyed) { setIsConnected(false); reconnectTimerRef.current = window.setTimeout(connect, 3000); } };
            ws.onerror = () => { try { ws.close(); } catch {} };
        }
        connect();
        return () => {
            destroyed = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) { try { wsRef.current.onmessage = null; wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.close(); } catch {} }
        };
    }, [isTreemapOpen]);

    const formatValue = (v: number) =>
        v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${(v / 1_000).toFixed(0)}K`;

    const formatTime = (ts: number) => {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return "방금";
        const m = Math.floor(s / 60);
        return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간`;
    };

    return (
        <div
            className="relative flex-1 min-w-0 h-30 2xl:h-45 max-h-30 2xl:max-h-45"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`absolute inset-0 border border-neutral-800 rounded-2xl p-2.5 2xl:p-3.5 bg-neutral-900 flex flex-col overflow-hidden transition-[opacity,transform] duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] 2xl:text-xs font-medium text-neutral-400 tracking-wide">
                            고래 거래
                        </span>
                        {isConnected && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                LIVE
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] 2xl:text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                        $50K+
                    </span>
                </div>

                {/* 리스트 */}
                <div className="flex-1 overflow-hidden">
                    {trades.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? "bg-emerald-500" : "bg-neutral-600"}`} />
                            <span className="text-[10px] text-neutral-500">
                                {isConnected ? "수신 대기 중" : "연결 중"}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-[3px] overflow-y-auto max-h-full scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {trades.map((trade) => {
                                    const isBuy = trade.side === "BUY";
                                    return (
                                        <motion.div
                                            key={trade.id}
                                            initial={{ opacity: 0, x: -12, height: 0 }}
                                            animate={{ opacity: 1, x: 0, height: "auto" }}
                                            exit={{ opacity: 0, x: 12, height: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="relative flex items-center gap-2 py-[5px] pl-3 pr-1.5 rounded-lg overflow-hidden"
                                        >
                                            {/* accent 바 */}
                                            <div className={`absolute left-0 inset-y-0 w-[2px] ${isBuy ? "bg-emerald-500" : "bg-red-500"}`} />
                                            {/* BUY/SELL pill */}
                                            <span className={`text-[9px] font-bold px-1.5 py-[2px] rounded-md ${isBuy ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                                                {isBuy ? "BUY" : "SELL"}
                                            </span>
                                            {/* 심볼 */}
                                            <span className="text-[11px] 2xl:text-xs text-neutral-200 font-medium flex-1 truncate">
                                                {trade.symbol}
                                            </span>
                                            {/* 금액 히어로 */}
                                            <span className={`text-[11px] 2xl:text-xs font-mono font-bold ${isBuy ? "text-emerald-400" : "text-red-400"}`}>
                                                {formatValue(trade.usdValue)}
                                            </span>
                                            {/* 시간 */}
                                            <span className="text-[9px] text-neutral-600 w-7 text-right shrink-0">
                                                {formatTime(trade.timestamp)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* 툴팁 */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[235px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl py-4 px-5 shadow-xl z-50 pointer-events-none"
                    >
                        <div className="font-semibold text-amber-400 mb-1.5">지표 설명</div>
                        <p className="leading-relaxed">
                            바이낸스 현물 대규모 체결 데이터입니다.<br /><br />
                            <span className="text-emerald-400 font-medium">• BUY</span>: 시장가 매수 체결<br />
                            <span className="text-red-400 font-medium">• SELL</span>: 시장가 매도 체결<br /><br />
                            고래의 움직임은 시장 방향의 중요한 신호가 될 수 있습니다.
                        </p>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-neutral-700" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-neutral-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
