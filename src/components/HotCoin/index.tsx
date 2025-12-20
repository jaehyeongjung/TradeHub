"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Ticker24h = {
    symbol: string;
    priceChangePercent: string;
    quoteVolume: string;
    lastPrice: string;
};

const EXCLUDE_PATTERNS = /(UP|DOWN|BULL|BEAR|1000)/;

function isHotCandidate(sym: string) {
    return (
        sym.endsWith("USDT") &&
        !EXCLUDE_PATTERNS.test(sym) &&
        sym !== "USDCUSDT" &&
        sym !== "FDUSDUSDT"
    );
}

function scoreOf(t: Ticker24h) {
    const vol = Number(t.quoteVolume) || 0;
    const pct = Math.abs(Number(t.priceChangePercent) || 0) / 100;

    // 거래량 최소 필터 (300만 달러 미만 제외)
    if (vol < 3000000) return 0;

    // √거래량 × 등락률² (거래량 있으면서 변동성 큰 코인 우선)
    return Math.sqrt(vol) * Math.pow(pct, 2) * 1000000;
}

export default function HotSymbolsTicker() {
    const [list, setList] = useState<Ticker24h[]>([]);
    const [idx, setIdx] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<number | null>(null);

    // 30초마다 전체 리스트 갱신
    useEffect(() => {
        let aborted = false;
        const load = async () => {
            try {
                const res = await fetch(
                    "https://api.binance.com/api/v3/ticker/24hr",
                    {
                        cache: "no-store",
                    }
                );
                if (!res.ok) return;
                const all = (await res.json()) as Ticker24h[];

                const filtered = all
                    .filter((t) => isHotCandidate(t.symbol))
                    .sort((a, b) => scoreOf(b) - scoreOf(a))
                    .slice(0, 30);

                if (!aborted) setList(filtered);
            } catch {}
        };

        load();
        const intv = window.setInterval(load, 30_000);
        return () => {
            aborted = true;
            clearInterval(intv);
        };
    }, []);

    // 2초마다 다음 항목으로 (Top 15만 회전)
    useEffect(() => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setIdx((i) =>
                list.length ? (i + 1) % Math.min(list.length, 15) : 0
            );
        }, 2000);
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [list]);

    const current = list.length ? list[idx] : null;

    return (
        <div className="relative flex items-center gap-3 text-sm ml-10 text-neutral-200">
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <p className="text-[12px] px-3 py-[3px] rounded-full bg-neutral-800 text-amber-300 select-none cursor-pointer shadow-sm">
                    <span className="whitespace-nowrap">🔥 Hot Coin</span>
                </p>

                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-1/2 -translate-x-1/2 top-[130%] w-[210px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg px-4 py-3 shadow-lg z-50"
                        >
                            <div className="font-semibold text-amber-300 mb-1">
                                기준 설명
                            </div>
                            <ul className="space-y-[2px] leading-tight">
                                <li>24h 거래대금(USDT) + 등락률 보너스</li>
                            </ul>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-neutral-900"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 실시간 회전 코인 */}
            <div className="w-[300px] overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {current ? (
                        <motion.div
                            key={current.symbol + idx}
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -16, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="whitespace-nowrap"
                            title={`${current.symbol} · ${Number(
                                current.priceChangePercent
                            ).toFixed(2)}% · $${Number(
                                current.lastPrice
                            ).toLocaleString()}`}
                        >
                            <b className="text-emerald-400 mr-1">
                                Top {idx + 1}
                            </b>
                            <span className="font-mono">
                                {prettySym(current.symbol)}
                            </span>
                            <span className="mx-2 text-neutral-500">·</span>
                            <span
                                className={
                                    Number(current.priceChangePercent) >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                }
                            >
                                {Number(current.priceChangePercent) >= 0
                                    ? "▲"
                                    : "▼"}{" "}
                                {Number(current.priceChangePercent).toFixed(2)}%
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-neutral-400"
                        >
                            인기 코인 로딩중…
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function prettySym(sym: string) {
    return sym.replace(/USDT$/, "") + "/USDT";
}
