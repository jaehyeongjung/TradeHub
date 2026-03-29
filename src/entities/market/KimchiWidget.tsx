"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { treemapOpenAtom } from "@/shared/store/atoms";
import type { KimchiResponse } from "@/app/api/kimchi/route";

type Data = KimchiResponse;

async function fetchKimchiOnce(symbol: string, signal?: AbortSignal): Promise<Data> {
    const r = await fetch(`/api/kimchi?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
        signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as Data;
    if (typeof j.symbol !== "string") throw new Error("Invalid payload: symbol");
    return j;
}

async function fetchKimchiWithRetry(symbol: string, signal?: AbortSignal): Promise<Data> {
    const delays = [300, 800];
    let attempt = 0;
    while (attempt <= delays.length) {
        try {
            return await fetchKimchiOnce(symbol, signal);
        } catch (e) {
            if (signal?.aborted) throw e;
            if (attempt === delays.length) break;
            await new Promise((res) => setTimeout(res, delays[attempt]));
            attempt++;
        }
    }
    throw new Error("fetch failed");
}

export default function KimchiWidget({
    symbol = "BTC",
    pollMs = 5000,
    fadeDelay = 0,
    className = "",
}: {
    symbol?: string;
    pollMs?: number;
    fadeDelay?: number;
    className?: string;
}) {
    const [data, setData] = useState<Data | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const isLight = useTheme();
    const [flash, setFlash] = useState<"up" | "down" | null>(null);
    const prevPctRef = useRef<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    const load = useCallback(async () => {
        try {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            const d = await fetchKimchiWithRetry(symbol, ctrl.signal);
            if (ctrl.signal.aborted) return;
            const newPct = d.premium != null ? d.premium * 100 : null;
            if (newPct != null && prevPctRef.current != null && Math.abs(newPct - prevPctRef.current) > 0.001) {
                setFlash(newPct > prevPctRef.current ? "up" : "down");
                setTimeout(() => setFlash(null), 600);
            }
            if (newPct != null) prevPctRef.current = newPct;
            setData(d);
        } catch {
        }
    }, [symbol]);

    useVisibilityPolling({ interval: pollMs, onPoll: load, immediate: true, enabled: !isTreemapOpen });

    const pct = data?.premium != null ? data.premium * 100 : null;
    const isPositive = pct != null && pct >= 0;
    const isNeutral = pct == null;

    const heroColor = isNeutral
        ? "text-neutral-400"
        : isPositive
        ? isLight ? "text-emerald-600" : "text-emerald-400"
        : isLight ? "text-rose-600" : "text-rose-500";

    const accentBg = isNeutral
        ? isLight ? "bg-neutral-300" : "bg-neutral-600"
        : isPositive
        ? "bg-emerald-500"
        : "bg-rose-500";

    const cardBg = isLight
        ? "bg-white border-neutral-200"
        : "bg-surface-elevated border-border-subtle";

    const dividerColor = isLight ? "border-neutral-100" : "border-border-subtle";
    const symbolPill = isLight
        ? "bg-neutral-100 text-neutral-500"
        : "bg-surface-input text-text-tertiary";
    const labelColor = isLight ? "text-neutral-400" : "text-text-muted";
    const subLabelColor = isLight ? "text-neutral-500" : "text-text-tertiary";

    return (
        <div
            className={`relative rounded-2xl border overflow-hidden ${cardBg} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`absolute left-0 inset-y-0 w-[3px] rounded-l-2xl transition-colors duration-500 ${accentBg}`} />

            <div
                className={`pl-4 pr-4 pt-3 pb-3 2xl:pl-6 2xl:pr-6 2xl:pt-5 2xl:pb-5 transition-[opacity,transform] duration-700 ${
                    data == null ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                }`}
                style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] 2xl:text-xs font-medium tracking-wide ${subLabelColor}`}>
                        김치프리미엄
                    </span>
                    <span className={`text-[10px] 2xl:text-[11px] font-medium px-2 py-0.5 rounded-full ${symbolPill}`}>
                        {data?.symbol ?? symbol}
                    </span>
                </div>

                <div className={`inline-block text-3xl 2xl:text-4xl font-bold tabular-nums leading-none rounded-lg px-1 transition-all duration-300 ${heroColor} ${
                    flash === "up" ? "bg-emerald-500/20 scale-105" : flash === "down" ? "bg-rose-500/20 scale-105" : "scale-100"
                }`}>
                    {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                </div>
                <div className={`mt-1.5 text-[11px] 2xl:text-xs font-medium ${heroColor} opacity-80`}>
                    {isNeutral ? "데이터 로딩 중" : isPositive ? "▲ 한국이 해외보다 비쌈" : "▼ 해외가 한국보다 비쌈"}
                </div>

                <div className={`mt-3 mb-2 2xl:mt-4 2xl:mb-3 border-t ${dividerColor}`} />

                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <div className={`text-[9px] 2xl:text-[10px] mb-0.5 ${labelColor}`}>업비트</div>
                        <div className={`text-[11px] 2xl:text-xs font-mono font-semibold tabular-nums ${isLight ? "text-emerald-600" : "text-emerald-400"}`}>
                            {data?.upbitKrw != null
                                ? `${Math.round(data.upbitKrw).toLocaleString()}`
                                : "—"}
                        </div>
                    </div>
                    <div className="ml-2">
                        <div className={`text-[9px] 2xl:text-[10px] mb-0.5 ${labelColor}`}>바이낸스</div>
                        <div className="text-[11px] 2xl:text-xs font-mono font-semibold text-amber-400 tabular-nums">
                            {data?.binanceUsdt != null
                                ? `${data.binanceUsdt.toLocaleString(undefined, { maximumFractionDigits: 1 })}`
                                : "—"}
                        </div>
                    </div>
                    <div>
                        <div className={`text-[9px] 2xl:text-[10px] mb-0.5 ${labelColor}`}>환율</div>
                        <div className={`text-[11px] 2xl:text-xs font-mono font-semibold tabular-nums ${isLight ? "text-neutral-600" : "text-text-secondary"}`}>
                            {data?.usdkrw != null
                                ? `${Math.round(data.usdkrw).toLocaleString()}원`
                                : "—"}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className={`absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[235px] text-[11px] rounded-xl py-4 px-5 shadow-xl z-50 pointer-events-none border ${
                            isLight
                                ? "bg-white border-neutral-200 text-neutral-500"
                                : "bg-surface-elevated border-border-default text-text-secondary"
                        }`}
                    >
                        <div className="font-semibold text-amber-400 mb-1.5">지표 설명</div>
                        <p className="leading-relaxed">
                            업비트 원화 가격과 바이낸스 달러 가격,
                            환율(USD/KRW)을 비교해 계산한 프리미엄입니다.
                            <br /><br />
                            <span className="text-emerald-400 font-medium">• 양수</span>: 한국이 해외보다 비쌈<br />
                            <span className="text-rose-400 font-medium">• 음수</span>: 해외가 한국보다 비쌈
                        </p>
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent ${isLight ? "border-b-neutral-200" : "border-b-border-default"}`} />
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent ${isLight ? "border-b-white" : "border-b-surface-elevated"}`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
