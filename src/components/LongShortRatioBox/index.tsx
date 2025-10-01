"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Binance Futures Long/Short ratio 컴포넌트
 * - source:
 *    - "global": 전체 계정 비율 (globalLongShortAccountRatio)
 *    - "top-trader": 상위 트레이더 포지션 비율 (topLongShortPositionRatio)
 *    - "taker": 선물 테이커 매수/매도 비율 (takerlongshortRatio)
 * - period: 5m | 15m | 30m | 1h | 2h | 4h | 6h | 12h | 1d (엔드포인트 공통 지원)
 */
type Props = {
    symbol?: string; // ex) "BTCUSDT"
    period?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
    source?: "global" | "top-trader" | "taker";
    pollMs?: number; // 폴링 주기(ms) 기본 60초
};

type RatioRow = {
    symbol: string;
    longShortRatio: string; // 대부분 이 필드 (global/top-trader)
    longAccount?: string; // 일부 응답에서 제공되는 케이스
    shortAccount?: string; // 일부 응답에서 제공되는 케이스
    longShortRatioBuy?: string; // taker용(매수측)
    longShortRatioSell?: string; // taker용(매도측)
    timestamp: number;
};

export default function LongShortRatioBox({
    symbol = "BTCUSDT",
    period = "5m",
    source = "global",
    pollMs = 60_000,
}: Props) {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [longPct, setLongPct] = useState<number | null>(null);
    const [shortPct, setShortPct] = useState<number | null>(null);
    const [ts, setTs] = useState<number | null>(null);

    const endpoint = useMemo(() => {
        switch (source) {
            case "global":
                // 전체 계정 Long/Short 비율
                return "https://fapi.binance.com/futures/data/globalLongShortAccountRatio";
            case "top-trader":
                // 상위 트레이더 포지션 비율
                return "https://fapi.binance.com/futures/data/topLongShortPositionRatio";
            case "taker":
                // 테이커 매수/매도 비율
                return "https://fapi.binance.com/futures/data/takerlongshortRatio";
            default:
                return "";
        }
    }, [source]);

    async function fetchRatio() {
        try {
            setErr(null);
            const url = `${endpoint}?symbol=${symbol}&period=${period}&limit=30`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = (await res.json()) as RatioRow[];
            if (!rows?.length) throw new Error("empty");

            // 최신 데이터(가장 마지막 요소) 사용
            const latest = rows[rows.length - 1];
            setTs(latest.timestamp);

            if (source === "taker") {
                // taker는 매수/매도 비율이 별도 제공 → 비율로 환산
                const buy = parseFloat(latest.longShortRatioBuy ?? "0"); // 예: 1.2 (매수/매도 비)
                const sell = parseFloat(latest.longShortRatioSell ?? "0");
                // 일부 응답은 buy/sell이 직접 퍼센트값이 아닌 ratio일 수 있음 → 정규화
                // buy = 매수/매도 비 → long% = buy/(buy+1) * 100 (대략적 정규화)
                // sell도 동일 개념이지만, 일관성을 위해 buy 기준으로 계산
                const long = Number.isFinite(buy)
                    ? (buy / (buy + 1)) * 100
                    : NaN;
                const short = 100 - long;
                setLongPct(Number.isFinite(long) ? long : null);
                setShortPct(Number.isFinite(short) ? short : null);
            } else {
                // global/top-trader는 longShortRatio = (long / short) 값
                const lsr = parseFloat(latest.longShortRatio);
                if (!Number.isFinite(lsr))
                    throw new Error("invalid longShortRatio");
                // long / short = r  → long% = r / (1 + r) × 100
                const long = (lsr / (1 + lsr)) * 100;
                const short = 100 - long;
                setLongPct(long);
                setShortPct(short);
            }

            setLoading(false);
        } catch (e: any) {
            setErr(e?.message ?? "failed");
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        fetchRatio();
        if (pollMs > 0) {
            const t = setInterval(fetchRatio, pollMs);
            return () => clearInterval(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, period, source]);

    return (
        <div className="w-[240px] h-[120px] border rounded-lg shadow-sm p-3 bg-white">
            <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm">{symbol}</div>
                <div className="text-[11px] text-gray-500">
                    {source === "global" && "Global"}
                    {source === "top-trader" && "Top Trader"}
                    {source === "taker" && "Taker"}
                    {" · "}
                    {period}
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse h-[72px] bg-gray-100 rounded-md" />
            ) : err ? (
                <div className="text-sm text-amber-600">⚠ {err}</div>
            ) : (
                <>
                    {/* 바 차트 느낌의 막대 */}
                    <div className="mt-1">
                        <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500"
                                style={{
                                    width: `${Math.max(
                                        0,
                                        Math.min(100, longPct ?? 0)
                                    )}%`,
                                }}
                                title={`Long ${longPct?.toFixed(2)}%`}
                            />
                        </div>
                        <div className="flex justify-between text-[12px] mt-1">
                            <span className="text-emerald-600 font-medium">
                                Long {longPct?.toFixed(2)}%
                            </span>
                            <span className="text-red-500 font-medium">
                                Short {shortPct?.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* 타임스탬프 */}
                    <div className="mt-1 text-[11px] text-gray-400">
                        {ts ? new Date(ts).toLocaleString() : ""}
                    </div>
                </>
            )}
        </div>
    );
}
