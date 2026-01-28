"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { KimchiResponse } from "@/app/api/kimchi/route";

type Data = KimchiResponse;

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
    if (typeof j.symbol !== "string")
        throw new Error("Invalid payload: symbol");
    return j;
}

async function fetchKimchiWithRetry(
    symbol: string,
    signal?: AbortSignal
): Promise<Data> {
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
}: {
    symbol?: string;
    pollMs?: number;
}) {
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
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
        <div
            className="relative rounded-2xl border border-zinc-800 bg-neutral-950 p-4 2xl:p-5 text-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm 2xl:text-base font-semibold">김치 프리미엄</h3>
                <span className="text-xs 2xl:text-sm text-zinc-400">
                    {data?.symbol ?? symbol}
                </span>
            </div>

            <div className={`mt-2 2xl:mt-3 text-2xl 2xl:text-3xl font-bold ${color}`}>
                {pct == null ? "—" : `${pct.toFixed(2)}%`}
            </div>

            <dl className="mt-2 2xl:mt-3 grid grid-cols-2 gap-2 2xl:gap-3 text-xs 2xl:text-sm text-zinc-400">
                <dt>업비트(KRW)</dt>
                <dd className="text-right text-emerald-300 whitespace-nowrap">
                    {data?.upbitKrw != null
                        ? `${data.upbitKrw.toLocaleString()} KRW`
                        : "—"}
                </dd>

                <dt>바이낸스(USDT)</dt>
                <dd className="text-right text-amber-300 whitespace-nowrap">
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
            {/* {error && (
        <p className="mt-2 text-[11px] text-rose-400">업데이트 실패: {error}</p>
      )} */}

            {/*  동일 스타일 툴팁 */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[235px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg py-4 px-5 shadow-lg z-50 pointer-events-none"
                    >
                        <div className="font-semibold text-amber-300 mb-1">
                            지표 설명
                        </div>
                        <p className="leading-snug">
                            업비트 원화 가격과 바이낸스 달러 가격,
                            <br /> 그리고 환율(USD/KRW)을 비교해 계산한 <br />
                            프리미엄 비율입니다.
                            <br />
                            <br />• 양수: 한국 시장이 해외보다{" "}
                            <b>비싸다는 뜻</b>,
                            <br />• 음수: 반대로 해외가 더 비쌉니다.
                            <br />
                            <br />
                            실시간으로 업데이트되며, <b>환율 변동</b>과
                            <br />
                            거래소 가격 차이를 함께 반영합니다.
                        </p>
                        {/* 테두리가 있는 삼각형 화살표 */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-neutral-700" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-neutral-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
