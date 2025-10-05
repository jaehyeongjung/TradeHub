"use client";

import { useEffect, useMemo, useState } from "react";

type Period = "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
type Source = "global" | "top-trader" | "taker";

type Props = {
    symbol?: string; // ex) "BTCUSDT"
    period?: Period;
    source?: Source;
    pollMs?: number; // 폴링 주기(ms) 기본 60초
};

type RatioRow = {
    symbol: string;
    longShortRatio: string; // global/top-trader에서 주로 사용
    longAccount?: string;
    shortAccount?: string;
    longShortRatioBuy?: string; // taker 전용
    longShortRatioSell?: string; // taker 전용
    timestamp: number; // ms 타임스탬프(바이낸스는 ms)
};

function toErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

function isRatioRowArray(x: unknown): x is RatioRow[] {
    return (
        Array.isArray(x) &&
        x.every(
            (r) =>
                r &&
                typeof r === "object" &&
                typeof (r as { timestamp?: unknown }).timestamp === "number"
        )
    );
}

// 툴팁에 표시될 설명 맵
const DESCRIPTION_MAP: Record<Source, string> = {
    global: "바이낸스 모든 계정의 롱/숏 비율,<br />시장 전체의 심리를 나타냅니다.",
    "top-trader":
        "바이낸스 상위 10% 트레이더들의 롱/숏 비율,<br /> 전문 투자자들의 심리를 반영합니다.",
    taker: "테이커(시장가 주문) 매수/매도 비율, 현재 시장의 즉각적인 공격적인 주문 심리를 나타냅니다.",
};

export default function LongShortRatioBox({
    symbol = "BTCUSDT",
    period = "5m",
    source = "global",
    pollMs = 60_000,
}: Props) {
    const [loading, setLoading] = useState<boolean>(true);
    const [err, setErr] = useState<string | null>(null);
    const [longPct, setLongPct] = useState<number | null>(null);
    const [shortPct, setShortPct] = useState<number | null>(null);
    const [ts, setTs] = useState<number | null>(null);

    //  툴팁 상태 추가
    const [isHovered, setIsHovered] = useState(false);

    const endpoint = useMemo<string>(() => {
        switch (source) {
            case "global":
                return "https://fapi.binance.com/futures/data/globalLongShortAccountRatio";
            case "top-trader":
                return "https://fapi.binance.com/futures/data/topLongShortPositionRatio";
            case "taker":
                return "https://fapi.binance.com/futures/data/takerlongshortRatio";
            default:
                return "";
        }
    }, [source]);

    // ... (fetchRatio 함수는 변경 없음) ...
    async function fetchRatio(): Promise<void> {
        try {
            setErr(null);
            const url = `${endpoint}?symbol=${symbol}&period=${period}&limit=30`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json: unknown = await res.json();
            if (!isRatioRowArray(json) || json.length === 0) {
                throw new Error("empty");
            }

            const rows = json;
            const latest = rows[rows.length - 1];
            setTs(latest.timestamp);

            if (source === "taker") {
                const buy = Number.parseFloat(latest.longShortRatioBuy ?? "0");
                // buy가 (매수/매도) ratio라고 가정 → long% = buy / (buy + 1) * 100
                const long = Number.isFinite(buy)
                    ? (buy / (buy + 1)) * 100
                    : NaN;
                const short = 100 - long;
                setLongPct(Number.isFinite(long) ? long : null);
                setShortPct(Number.isFinite(short) ? short : null);
            } else {
                const lsr = Number.parseFloat(latest.longShortRatio);
                if (!Number.isFinite(lsr))
                    throw new Error("invalid longShortRatio");
                const long = (lsr / (1 + lsr)) * 100;
                const short = 100 - long;
                setLongPct(long);
                setShortPct(short);
            }

            setLoading(false);
        } catch (e: unknown) {
            setErr(toErrorMessage(e));
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        void fetchRatio();
        if (pollMs > 0) {
            const t = setInterval(() => {
                void fetchRatio();
            }, pollMs);
            return () => clearInterval(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, period, source, pollMs]);

    const description = DESCRIPTION_MAP[source];

    return (
        <div
            className="relative min-w-45 w-full min-h-30 border rounded-lg shadow-sm p-3 cursor-pointer bg-neutral-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm text-gray-100">
                    {symbol}
                </div>
                <div className="text-[11px] text-gray-100">
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

                    <div className="mt-1 text-[11px] text-gray-400">
                        {ts ? new Date(ts).toLocaleString() : ""}
                    </div>
                </>
            )}

            {isHovered && (
                <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-64 -translate-x-1/2 rounded-lg bg-gray-700 p-3 text-xs text-white shadow-xl pointer-events-none">
                    <p className="font-bold mb-1">지표 설명 ({source})</p>

                    {/*  dangerouslySetInnerHTML을 사용하여 <br />이 작동하도록 수정 */}
                    <p dangerouslySetInnerHTML={{ __html: description }} />

                    {/* 툴팁 위쪽 꼬리 (Tail) */}
                    <div className="absolute left-1/2 translate-x-[-50%] top-[-5px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-gray-700" />
                </div>
            )}
        </div>
    );
}
