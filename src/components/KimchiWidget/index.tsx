"use client";

import { useEffect, useRef, useState } from "react";
import type { KimchiResponse } from "@/app/api/kimchi/route";

type Data = KimchiResponse; // 클라에서 그대로 사용

async function fetchKimchiOnce(
    symbol: string,
    signal?: AbortSignal
): Promise<Data> {
    const r = await fetch(`/api/kimchi?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
        signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as Data;

    // 최소 스키마 검증
    if (typeof j.symbol !== "string")
        throw new Error("Invalid payload: symbol");
    return j;
}

// 가벼운 재시도(최대 2회, 300ms → 800ms 백오프)
async function fetchKimchiWithRetry(
    symbol: string,
    signal?: AbortSignal
): Promise<Data> {
    const delays = [300, 800];
    let attempt = 0;
    // 첫 시도 포함 총 3번
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
}: {
    symbol?: string;
    pollMs?: number;
}) {
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                // 이전 요청 중단
                abortRef.current?.abort();
                const ctrl = new AbortController();
                abortRef.current = ctrl;

                const d = await fetchKimchiWithRetry(symbol, ctrl.signal);
                if (!mounted || ctrl.signal.aborted) return;
                setData(d);
                setError(null);
            } catch (e) {
                if (!mounted || (abortRef.current?.signal?.aborted ?? false))
                    return;
                const msg = e instanceof Error ? e.message : "fetch error";
                setError(msg);
                // 실패해도 기존 data는 유지 → UX 안정
            }
        };

        load();
        timerRef.current = setInterval(load, pollMs);

        return () => {
            mounted = false;
            abortRef.current?.abort();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [symbol, pollMs]);

    const pct = data?.premium != null ? data.premium * 100 : null;
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
                    {data?.upbitKrw != null
                        ? `${data.upbitKrw.toLocaleString()} KRW`
                        : "—"}
                </dd>

                <dt>바이낸스(USDT)</dt>
                <dd className="text-right text-amber-300 whitespace-nowrap ">
                    {data?.binanceUsdt != null
                        ? `${data.binanceUsdt.toLocaleString()} USDT`
                        : "—"}
                </dd>

                <dt>USD/KRW</dt>
                <dd className="text-right text-zinc-200">
                    {data?.usdkrw != null
                        ? `${Math.round(data.usdkrw).toLocaleString()}원`
                        : "—"}
                </dd>
            </dl>

            {/* 상태 배지 (선택) */}
            {data?.degraded && (
                <p className="mt-1 text-[11px] text-zinc-500">
                    일부 데이터 폴백 적용
                </p>
            )}
            {data?.cached && (
                <p className="mt-1 text-[11px] text-amber-400">
                    최근 스냅샷 표시 중
                </p>
            )}
            {error && (
                <p className="mt-2 text-[11px] text-rose-400">
                    업데이트 실패: {error}
                </p>
            )}
        </div>
    );
}
