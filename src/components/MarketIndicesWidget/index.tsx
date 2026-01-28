"use client";

import { useCallback, useRef, useState } from "react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
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

function IndexItem({ index }: { index: MarketIndex }) {
    const isPositive = (index.changePercent ?? 0) >= 0;
    const color = index.changePercent === null
        ? "text-zinc-400"
        : isPositive
        ? "text-emerald-400"
        : "text-rose-400";

    return (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-2 2xl:py-3 px-3 2xl:px-4 bg-neutral-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] 2xl:text-xs text-zinc-500 font-medium mb-1">
                {index.name}
            </span>
            <span className="text-xs 2xl:text-sm text-zinc-100 font-mono font-semibold">
                {index.price !== null ? formatCompact(index.price, index.symbol) : "—"}
            </span>
            <span className={`text-[10px] 2xl:text-xs font-mono mt-0.5 ${color}`}>
                {index.changePercent !== null ? (
                    `${isPositive ? "+" : ""}${index.changePercent.toFixed(2)}%`
                ) : "—"}
            </span>
        </div>
    );
}

export default function MarketIndicesWidget({ pollMs = 30000 }: { pollMs?: number }) {
    const [data, setData] = useState<MarketIndicesResponse | null>(null);
    const abortRef = useRef<AbortController | null>(null);

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

    // 탭 비활성화 시 폴링 중단
    useVisibilityPolling({
        interval: pollMs,
        onPoll: load,
        immediate: true,
    });

    return (
        <div className="rounded-2xl border border-zinc-800 bg-neutral-950 p-3 2xl:p-4">
            {!data ? (
                <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 2xl:h-14 flex-1 bg-neutral-900 border border-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex gap-3">
                    {data.indices.map((idx) => (
                        <IndexItem key={idx.symbol} index={idx} />
                    ))}
                </div>
            )}
        </div>
    );
}
