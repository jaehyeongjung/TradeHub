"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { treemapOpenAtom } from "@/shared/store/atoms";
import type { MarketIndicesResponse, MarketIndex } from "@/app/api/market-indices/route";

async function fetchIndices(signal?: AbortSignal): Promise<MarketIndicesResponse> {
    const res = await fetch("/api/market-indices", {
        cache: "no-store",
        signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<MarketIndicesResponse>;
}

function formatCompact(price: number, symbol: string): string {
    if (symbol === "GC=F") return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (symbol === "^KS11") return price.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function IndexItem({ index, isLight }: { index: MarketIndex; isLight: boolean }) {
    const isPositive = (index.changePercent ?? 0) >= 0;
    const isNeutral = index.changePercent === null;

    const pctColor = isNeutral
        ? isLight ? "text-neutral-400" : "text-neutral-400"
        : isPositive
        ? "text-emerald-400"
        : "text-red-400";

    const pctBg = isNeutral
        ? isLight ? "bg-neutral-100" : "bg-neutral-700/30"
        : isPositive
        ? isLight ? "bg-emerald-50" : "bg-emerald-500/10"
        : isLight ? "bg-red-50" : "bg-red-500/10";

    const accentColor = isNeutral
        ? isLight ? "border-l-neutral-300" : "border-l-neutral-600"
        : isPositive
        ? "border-l-emerald-500"
        : "border-l-red-500";

    const cardBg = isLight
        ? "bg-white border-neutral-200/80 hover:bg-neutral-50 shadow-sm"
        : "bg-neutral-800/40 border-neutral-700/20 hover:bg-neutral-800/60";

    const labelColor = isLight ? "text-neutral-500" : "text-text-tertiary";
    const priceColor = isLight ? "text-neutral-700" : "text-text-primary";

    return (
        <div className={`flex-1 min-w-0 flex flex-col gap-1 py-2.5 2xl:py-3 pl-3 2xl:pl-3.5 pr-2.5 rounded-xl 2xl:rounded-2xl border border-l-2 ${accentColor} ${cardBg} transition-colors`}>
            <span className={`text-[10px] 2xl:text-[11px] font-medium tracking-wide truncate ${labelColor}`}>
                {index.name}
            </span>
            <span className={`text-sm 2xl:text-[15px] font-bold font-mono tabular-nums leading-tight ${priceColor}`}>
                {index.price !== null ? formatCompact(index.price, index.symbol) : "—"}
            </span>
            <div className={`inline-flex items-center gap-0.5 self-start px-1.5 py-[2px] rounded text-[10px] 2xl:text-[11px] font-semibold font-mono ${pctColor} ${pctBg}`}>
                {!isNeutral && (
                    <span className="text-[8px] leading-none">{isPositive ? "▲" : "▼"}</span>
                )}
                <span>
                    {index.changePercent !== null
                        ? `${isPositive ? "+" : ""}${index.changePercent.toFixed(2)}%`
                        : "—"}
                </span>
            </div>
        </div>
    );
}

export default function MarketIndicesWidget({ pollMs = 30000, fadeDelay = 0 }: { pollMs?: number; fadeDelay?: number }) {
    const [data, setData] = useState<MarketIndicesResponse | null>(null);
    const [isLight, setIsLight] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const load = useCallback(async () => {
        try {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;

            const result = await fetchIndices(ctrl.signal);
            if (ctrl.signal.aborted) return;

            setData(result);
        } catch {
            // 에러 시 기존 데이터 유지
        }
    }, []);

    useVisibilityPolling({
        interval: pollMs,
        onPoll: load,
        immediate: true,
        enabled: !isTreemapOpen,
    });

    const skeletonAccent = isLight ? "border-l-neutral-300 bg-neutral-100" : "border-l-neutral-600 bg-neutral-800/40";

    return (
        <div
            className={`flex gap-2 2xl:gap-2.5 transition-[opacity,transform] duration-700 ${
                data ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
                transitionDelay: `${fadeDelay}ms`,
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            {data ? (
                data.indices.map((idx) => (
                    <IndexItem key={idx.symbol} index={idx} isLight={isLight} />
                ))
            ) : (
                [1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-[68px] 2xl:h-[80px] flex-1 rounded-xl 2xl:rounded-2xl border border-neutral-700/20 border-l-2 animate-pulse ${skeletonAccent}`}
                    />
                ))
            )}
        </div>
    );
}
