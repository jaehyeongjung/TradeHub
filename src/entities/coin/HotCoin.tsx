"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { treemapOpenAtom } from "@/shared/store/atoms";

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
    if (vol < 3000000) return 0;
    return Math.sqrt(vol) * Math.pow(pct, 2) * 1000000;
}

function prettySym(sym: string) {
    return sym.replace(/USDT$/, "");
}

function formatPrice(p: number) {
    if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (p >= 1) return p.toFixed(2);
    return p.toPrecision(3);
}

export default function HotSymbolsTicker({ fadeDelay = 0 }: { fadeDelay?: number } = {}) {
    const [list, setList] = useState<Ticker24h[]>([]);
    const [idx, setIdx] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showListTooltip, setShowListTooltip] = useState(false);
    const [isLight, setIsLight] = useState(false);
    const timerRef = useRef<number | null>(null);
    const listTooltipRef = useRef<HTMLDivElement>(null);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!showListTooltip) return;
        const handleClick = (e: MouseEvent) => {
            if (listTooltipRef.current && !listTooltipRef.current.contains(e.target as Node)) {
                setShowListTooltip(false);
            }
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [showListTooltip]);

    useEffect(() => {
        if (isTreemapOpen) return;
        let aborted = false;
        const load = async () => {
            try {
                const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", { cache: "no-store" });
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
        return () => { aborted = true; clearInterval(intv); };
    }, [isTreemapOpen]);

    useEffect(() => {
        if (isTreemapOpen) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = null;
            return;
        }
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setIdx((i) => list.length ? (i + 1) % Math.min(list.length, 15) : 0);
        }, 2000);
        return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }, [list, isTreemapOpen]);

    const current = list.length ? list[idx] : null;

    const badgeClass = isLight
        ? "bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200"
        : "bg-surface-input/80 text-text-tertiary border border-border-default/60 hover:bg-surface-input";
    const tickerBaseColor = isLight ? "text-neutral-800" : "text-text-primary";
    const tooltipBg = isLight
        ? "bg-white border-neutral-200 text-neutral-700 shadow-lg"
        : "bg-surface-elevated border-border-default text-text-secondary shadow-xl";
    const dividerColor = isLight ? "border-neutral-200" : "border-border-subtle";
    const colLabelColor = isLight ? "text-neutral-500" : "text-neutral-600";
    const rankColor = isLight ? "text-neutral-500" : "text-neutral-600";
    const symColor = isLight ? "text-neutral-800" : "text-text-primary";
    const priceColor = isLight ? "text-neutral-600" : "text-text-tertiary";
    const arrowBorder = isLight ? "border-b-neutral-200" : "border-b-border-default";
    const arrowFill = isLight ? "border-b-white" : "border-b-surface-elevated";

    return (
        <div
            className={`relative flex items-center gap-3 2xl:gap-4 ml-10 transition-[opacity,transform] duration-700 ${current ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            {/* Hot Coin 배지 */}
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <p className={`flex items-center gap-1.5 text-[11px] 2xl:text-xs font-bold px-3 py-1.5 rounded-full select-none cursor-pointer transition-colors whitespace-nowrap tracking-wide ${badgeClass}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    HOT
                </p>

                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[200px] text-[11px] rounded-xl px-4 py-3 z-[100] border pointer-events-none ${tooltipBg}`}
                        >
                            <div className="font-semibold text-amber-500 mb-1">기준 설명</div>
                            <p className="leading-relaxed text-[10px]">24h 거래대금(USDT) + 등락률 가중 점수</p>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent ${arrowBorder}`} />
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent ${arrowFill}`} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 실시간 회전 코인 */}
            <div
                ref={listTooltipRef}
                className="relative w-[280px] 2xl:w-[360px] cursor-pointer"
                onClick={() => setShowListTooltip(!showListTooltip)}
            >
                <div className="overflow-hidden">
                    <AnimatePresence mode="popLayout">
                        {current && (
                            <motion.div
                                key={current.symbol + idx}
                                initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className={`flex items-center gap-2 whitespace-nowrap ${tickerBaseColor}`}
                            >
                                <span className={`text-[10px] tabular-nums w-6 text-right shrink-0 ${rankColor}`}>
                                    {idx + 1}
                                </span>
                                <span className={`font-semibold font-mono text-[13px] 2xl:text-sm ${symColor}`}>
                                    {prettySym(current.symbol)}
                                </span>
                                <span className={`text-[10px] ${isLight ? "text-neutral-400" : "text-text-muted"}`}>/USDT</span>
                                <span className={`text-[10px] 2xl:text-[11px] font-bold px-1.5 py-[2px] rounded font-mono tabular-nums ${
                                    Number(current.priceChangePercent) >= 0
                                        ? "text-emerald-400 bg-emerald-500/10"
                                        : "text-red-400 bg-red-500/10"
                                }`}>
                                    {Number(current.priceChangePercent) >= 0 ? "▲" : "▼"}{" "}
                                    {Math.abs(Number(current.priceChangePercent)).toFixed(2)}%
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Top 15 전체 리스트 패널 */}
                <AnimatePresence>
                    {showListTooltip && list.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className={`absolute left-0 top-[calc(100%+16px)] w-[320px] 2xl:w-[380px] text-[11px] rounded-2xl overflow-hidden z-[100] border ${tooltipBg}`}
                        >
                            {/* 패널 헤더 */}
                            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: isLight ? "#f0f0f0" : "#262626" }}>
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-bold text-xs tracking-wide ${isLight ? "text-neutral-700" : "text-text-primary"}`}>HOT</span>
                                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${isLight ? "bg-neutral-100 text-neutral-500" : "bg-surface-input text-text-muted"}`}>TOP 15</span>
                                </div>
                                <span className={`text-[9px] ${colLabelColor}`}>30초 갱신</span>
                            </div>

                            {/* 컬럼 헤더 */}
                            <div className={`flex items-center px-4 py-2 border-b ${dividerColor}`}>
                                <span className={`text-[9px] font-medium w-5 mr-3 shrink-0 text-right ${colLabelColor}`}>#</span>
                                <span className={`text-[9px] font-medium flex-1 ${colLabelColor}`}>코인</span>
                                <span className={`text-[9px] font-medium w-20 text-right ${colLabelColor}`}>가격</span>
                                <span className={`text-[9px] font-medium w-16 text-right ${colLabelColor}`}>24h</span>
                            </div>

                            {/* 리스트 */}
                            <div
                                className="overflow-y-auto scrollbar-hide max-h-[calc(100vh-550px)] lg:max-h-[calc(100vh-350px)] 2xl:max-h-[calc(100vh-450px)]"
                                style={{
                                    maskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
                                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
                                }}
                            >
                                {list.slice(0, 15).map((item, i) => {
                                    const pct = Number(item.priceChangePercent);
                                    const isPos = pct >= 0;
                                    const isActive = i === idx;
                                    return (
                                        <motion.div
                                            key={item.symbol}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                                            className={`relative flex items-center px-4 py-[6px] transition-colors ${
                                                isActive
                                                    ? isLight ? "bg-amber-50" : "bg-amber-500/5"
                                                    : isLight ? "hover:bg-neutral-50" : "hover:bg-neutral-800/50"
                                            }`}
                                        >
                                            {isActive && <div className="absolute left-0 inset-y-0 w-[2px] bg-amber-500 rounded-r" />}
                                            <span className={`text-[10px] tabular-nums w-5 mr-3 shrink-0 font-medium text-right ${
                                                isActive ? "text-amber-500" : rankColor
                                            }`}>
                                                {i + 1}
                                            </span>
                                            <span className={`flex-1 font-mono font-semibold text-[11px] 2xl:text-xs ${
                                                isActive
                                                    ? isLight ? "text-amber-700" : "text-amber-300"
                                                    : symColor
                                            }`}>
                                                {prettySym(item.symbol)}
                                            </span>
                                            <span className={`text-[10px] font-mono w-20 text-right tabular-nums ${priceColor}`}>
                                                ${formatPrice(Number(item.lastPrice))}
                                            </span>
                                            <span className={`text-[10px] font-mono font-bold w-16 text-right tabular-nums ${
                                                isPos ? "text-emerald-400" : "text-red-400"
                                            }`}>
                                                {isPos ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* 화살표 */}
                            <div className={`absolute top-0 left-8 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent ${arrowBorder}`} />
                            <div className={`absolute top-0 left-8 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent ${arrowFill}`} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
