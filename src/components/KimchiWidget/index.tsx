"use client";

import { useEffect, useRef, useState } from "react";

type KimchiData = {
    symbol: string;
    upbitKrw: number;
    binanceUsdt: number;
    usdkrw: number;
    globalKrw: number;
    premium: number; // 0.031 = 3.1%
    updatedAt: string;
};

async function fetchKimchi(symbol: string): Promise<KimchiData> {
    const r = await fetch(`/api/kimchi?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
    });
    if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
    }
    const j = (await r.json()) as KimchiData;
    // 간단한 스키마 체크
    if (
        typeof j.symbol !== "string" ||
        typeof j.upbitKrw !== "number" ||
        typeof j.binanceUsdt !== "number" ||
        typeof j.usdkrw !== "number" ||
        typeof j.globalKrw !== "number" ||
        typeof j.premium !== "number"
    ) {
        throw new Error("Invalid payload");
    }
    return j;
}

export default function KimchiWidget({
    symbol = "BTC",
    pollMs = 5000,
}: {
    symbol?: string;
    pollMs?: number;
}) {
    const [data, setData] = useState<KimchiData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                abortRef.current?.abort();
                const ctrl = new AbortController();
                abortRef.current = ctrl;
                const d = await fetchKimchi(symbol);
                if (!ctrl.signal.aborted) {
                    setData(d);
                    setError(null);
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : "fetch error";
                setError(msg);
            }
        };

        load();
        timerRef.current = setInterval(load, pollMs);

        return () => {
            abortRef.current?.abort();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [symbol, pollMs]);

    const pct = data ? data.premium * 100 : null;
    const color =
        pct == null
            ? "text-zinc-400"
            : pct >= 0
            ? "text-emerald-500"
            : "text-rose-500";

    return (
        <div className="rounded-2xl border border-zinc-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                    김치 프리미엄
                </h3>
                <span className="text-xs text-zinc-400">
                    {data?.symbol ?? symbol}
                </span>
            </div>

            <div className={`mt-2 text-2xl font-bold ${color}`}>
                {pct == null ? "—" : `${pct.toFixed(2)}%`}
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <dt>업비트(KRW)</dt>
                <dd className="text-right text-emerald-300 whitespace-nowrap">
                    {data ? `${data.upbitKrw.toLocaleString()} KRW` : "—"}
                </dd>
                <dt>바이낸스(USDT)</dt>
                <dd className="text-right text-amber-300 whitespace-nowrap ">
                    {data ? `${data.binanceUsdt.toLocaleString()} USDT` : "—"}
                </dd>
                <dt>USD/KRW</dt>
                <dd className="text-right text-zinc-200">
                    {data
                        ? `${Math.round(data.usdkrw).toLocaleString()}원`
                        : "—"}
                </dd>
            </dl>

            {/* {error && (
                <p className="mt-2 text-xs text-rose-400">
                    업데이트 실패: {error}
                </p>
            )} */}
        </div>
    );
}
