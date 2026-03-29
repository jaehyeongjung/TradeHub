"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { treemapOpenAtom } from "@/shared/store/atoms";
import { fmtUsdCompact, fmtRelativeTime } from "@/shared/lib/formatting";

type Liquidation = {
    id: string;
    symbol: string;
    side: "LONG" | "SHORT";
    quantity: number;
    price: number;
    usdValue: number;
    timestamp: number;
};

type BinanceForceOrder = {
    e: "forceOrder";
    E: number;
    o: {
        s: string;
        S: "BUY" | "SELL";
        q: string;
        p: string;
        ap: string;
        X: string;
        T: number;
    };
};

const MIN_USD_VALUE = 5000;
const MAX_ITEMS = 15;

export default function LiquidationFeed({ fadeDelay = 0 }: { fadeDelay?: number }) {
    const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isTreemapOpen) return;
        let destroyed = false;
        function connect() {
            if (destroyed) return;
            const ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
            wsRef.current = ws;
            ws.onopen = () => { if (!destroyed) setIsConnected(true); };
            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                try {
                    const data = JSON.parse(ev.data) as BinanceForceOrder;
                    if (data.e !== "forceOrder") return;
                    const { o } = data;
                    const quantity = parseFloat(o.q);
                    const price = parseFloat(o.ap) || parseFloat(o.p);
                    const usdValue = quantity * price;
                    if (usdValue < MIN_USD_VALUE) return;
                    setLiquidations((prev) => [{
                        id: `${o.s}-${o.T}-${Math.random()}`,
                        symbol: o.s.replace("USDT", ""),
                        side: (o.S === "SELL" ? "LONG" : "SHORT") as "LONG" | "SHORT",
                        quantity, price, usdValue, timestamp: o.T,
                    }, ...prev].slice(0, MAX_ITEMS));
                } catch (e) { console.error("[LiquidationFeed] ws message parse error:", e); }
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


    return (
        <div
            className="relative flex-1 min-w-0 h-30 2xl:h-45 max-h-30 2xl:max-h-45"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`absolute inset-0 border border-border-subtle rounded-2xl p-2.5 2xl:p-3.5 bg-surface-elevated flex flex-col overflow-hidden transition-[opacity,transform] duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] 2xl:text-xs font-medium text-text-tertiary tracking-wide">
                            실시간 청산
                        </span>
                        {isConnected && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                LIVE
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] 2xl:text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-input text-text-muted">
                        $5K+
                    </span>
                </div>

                <div className="flex-1 overflow-hidden">
                    {liquidations.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? "bg-emerald-500" : "bg-neutral-600"}`} />
                            <span className="text-[10px] text-neutral-500">
                                {isConnected ? "수신 대기 중" : "연결 중"}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-[3px] overflow-y-auto max-h-full scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {liquidations.map((liq) => {
                                    const isLong = liq.side === "LONG";
                                    return (
                                        <motion.div
                                            key={liq.id}
                                            initial={{ opacity: 0, x: -12, height: 0 }}
                                            animate={{ opacity: 1, x: 0, height: "auto" }}
                                            exit={{ opacity: 0, x: 12, height: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="relative flex items-center gap-2 py-[5px] pl-3 pr-1.5 rounded-lg overflow-hidden"
                                        >
                                            <div className={`absolute left-0 inset-y-0 w-[2px] ${isLong ? "bg-red-500" : "bg-emerald-500"}`} />
                                            <span className={`text-[9px] font-bold px-1.5 py-[2px] rounded-md ${isLong ? "text-red-400 bg-red-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>
                                                {isLong ? "LONG" : "SHORT"}
                                            </span>
                                            <span className="text-[11px] 2xl:text-xs text-text-primary font-medium flex-1 truncate">
                                                {liq.symbol}
                                            </span>
                                            <span className={`text-[11px] 2xl:text-xs font-mono font-bold ${isLong ? "text-red-400" : "text-emerald-400"}`}>
                                                {fmtUsdCompact(liq.usdValue)}
                                            </span>
                                            <span className="text-[9px] text-text-muted w-7 text-right shrink-0">
                                                {fmtRelativeTime(liq.timestamp)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[235px] text-[11px] bg-surface-elevated border border-border-default text-text-secondary rounded-xl py-4 px-5 shadow-xl z-50 pointer-events-none"
                    >
                        <div className="font-semibold text-amber-400 mb-1.5">지표 설명</div>
                        <p className="leading-relaxed">
                            바이낸스 선물 실시간 강제 청산 데이터입니다.<br /><br />
                            <span className="text-red-400 font-medium">• LONG</span>: 롱 포지션 청산<br />
                            <span className="text-emerald-400 font-medium">• SHORT</span>: 숏 포지션 청산<br /><br />
                            대규모 청산은 급격한 가격 변동의 신호가 될 수 있습니다.
                        </p>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-border-default" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-surface-elevated" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
