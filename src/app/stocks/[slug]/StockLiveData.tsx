"use client";

import { useEffect, useRef, useState } from "react";
import { fmtUsd, fmtPrice, fmtCompactKrw, formatKrw } from "../format";

export type InitialStats = {
    price: number | null;
    changePercent: number | null;
    high: number | null;
    low: number | null;
    quoteVolume: number | null;
    openInterestUsd: number | null;
};

type Props = {
    symbol: string;
    /** null이면 원화 표기를 숨기고 달러만 보여준다 */
    usdKrw: number | null;
    initial: InitialStats;
};

type TickerMessage = {
    e: string;
    c: string; // 현재가
    P: string; // 24h 변동률(%)
    h: string; // 24h 고가
    l: string; // 24h 저가
    q: string; // 24h 거래대금(USDT)
};

const CARD = "rounded-3xl bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]";
const OI_HOSTS = ["https://fapi.binance.com", "https://www.binance.com"];

function num(v: string): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="px-5 py-4">
            <div className="text-[11px] font-medium text-[var(--text-tertiary)]">{label}</div>
            <div className="mt-1 text-[15px] sm:text-base font-bold tabular-nums text-[var(--text-primary)]">
                {value}
            </div>
            {sub && (
                <div className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">{sub}</div>
            )}
        </div>
    );
}

/**
 * 가격과 24시간 통계를 함께 담당한다.
 *
 * 배포 서버가 바이낸스에 막히면 서버 값이 전부 null로 오는데, @ticker 스트림 하나에
 * 현재가·변동률·고가·저가·거래대금이 모두 들어 있어 브라우저에서 그대로 채울 수 있다.
 * 그래서 WebSocket을 한 개만 열고 가격 블록과 통계 카드를 같이 렌더한다.
 * (미결제약정만 스트림에 없어 REST로 따로 가져온다)
 */
export function StockLiveData({ symbol, usdKrw, initial }: Props) {
    const [price, setPrice] = useState(initial.price);
    const [changePercent, setChangePercent] = useState(initial.changePercent);
    const [high, setHigh] = useState(initial.high);
    const [low, setLow] = useState(initial.low);
    const [quoteVolume, setQuoteVolume] = useState(initial.quoteVolume);
    const [openInterestUsd, setOpenInterestUsd] = useState(initial.openInterestUsd);
    const [isLive, setIsLive] = useState(false);
    const [flash, setFlash] = useState<"up" | "down" | null>(null);
    const prevPriceRef = useRef<number | null>(initial.price);

    useEffect(() => {
        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let lastMessageAt = Date.now();

        function connect() {
            if (destroyed) return;
            // @ticker는 /market 라우트 소속. 라우트 없는 레거시 URL은 조용히 데이터가 끊긴다.
            ws = new WebSocket(
                `wss://fstream.binance.com/market/ws/${symbol.toLowerCase()}usdt@ticker`,
            );

            ws.onopen = () => {
                if (!destroyed) lastMessageAt = Date.now();
            };

            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                lastMessageAt = Date.now();
                setIsLive(true);
                try {
                    const data = JSON.parse(ev.data) as TickerMessage;
                    if (data.e !== "24hrTicker") return;

                    const next = num(data.c);
                    if (next !== null) {
                        const prev = prevPriceRef.current;
                        if (prev !== null && next !== prev) {
                            setFlash(next > prev ? "up" : "down");
                            window.setTimeout(() => setFlash(null), 400);
                        }
                        prevPriceRef.current = next;
                        setPrice(next);
                    }
                    setChangePercent(num(data.P));
                    setHigh(num(data.h));
                    setLow(num(data.l));
                    setQuoteVolume(num(data.q));
                } catch {
                    // 파싱 실패는 조용히 무시 — 다음 틱에 복구된다
                }
            };

            ws.onclose = () => {
                if (destroyed) return;
                setIsLive(false);
                reconnectTimer = window.setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                try { ws?.close(); } catch { /* noop */ }
            };
        }

        // 소켓은 열려 있는데 데이터만 끊기는 경우를 잡는다 (onclose가 안 불려 재연결이 안 도는 상황)
        const watchdog = window.setInterval(() => {
            if (Date.now() - lastMessageAt > 60_000) {
                setIsLive(false);
                try { ws?.close(); } catch { /* noop */ }
            }
        }, 15_000);

        connect();

        return () => {
            destroyed = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            clearInterval(watchdog);
            if (ws) {
                ws.onmessage = null;
                ws.onclose = null;
                ws.onerror = null;
                try { ws.close(); } catch { /* noop */ }
            }
        };
    }, [symbol]);

    // 미결제약정은 스트림에 없다. 서버가 못 가져왔을 때만 브라우저에서 채운다.
    useEffect(() => {
        if (initial.openInterestUsd !== null) return;
        let cancelled = false;

        async function load() {
            const pair = `${symbol}USDT`;
            for (const host of OI_HOSTS) {
                try {
                    const [oiRes, mkRes] = await Promise.all([
                        fetch(`${host}/fapi/v1/openInterest?symbol=${pair}`),
                        fetch(`${host}/fapi/v1/premiumIndex?symbol=${pair}`),
                    ]);
                    if (!oiRes.ok || !mkRes.ok) continue;
                    const oi = (await oiRes.json()) as { openInterest: string };
                    const mk = (await mkRes.json()) as { markPrice: string };
                    const contracts = Number(oi.openInterest);
                    const mark = Number(mk.markPrice);
                    if (cancelled) return;
                    if (Number.isFinite(contracts) && Number.isFinite(mark)) {
                        setOpenInterestUsd(contracts * mark);
                        return;
                    }
                } catch {
                    // 다음 호스트로 폴백
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [symbol, initial.openInterestUsd]);

    const isUp = (changePercent ?? 0) >= 0;
    const krw = price !== null && usdKrw !== null ? price * usdKrw : null;

    const flashColor =
        flash === "up"
            ? "text-[var(--color-up)]"
            : flash === "down"
              ? "text-[var(--color-down)]"
              : "text-[var(--text-primary)]";

    return (
        <>
            {/* 원화를 주가격으로 — 국내 유입의 검색 의도에 맞춘다 */}
            <div className="flex items-center gap-2.5">
                <span
                    className={`text-[2.5rem] sm:text-[3.25rem] leading-[1.05] font-extrabold tabular-nums tracking-[-0.03em] transition-colors duration-300 ${flashColor}`}
                >
                    {krw !== null ? formatKrw(krw) : fmtUsd(price)}
                </span>
                <span
                    className={`mt-1 flex shrink-0 items-center gap-1 self-start rounded-full px-2 py-1 text-[10px] font-bold ${
                        isLive
                            ? "bg-[var(--color-up-muted)] text-[var(--color-up)]"
                            : "bg-[var(--surface-input)] text-[var(--text-tertiary)]"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isLive ? "animate-pulse bg-[var(--color-accent)]" : "bg-[var(--text-disabled)]"
                        }`}
                    />
                    {isLive ? "실시간" : "연결 중"}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {changePercent !== null && (
                    <span
                        className={`rounded-lg px-2 py-1 text-[14px] font-bold tabular-nums ${
                            isUp
                                ? "bg-[var(--color-up-muted)] text-[var(--color-up)]"
                                : "bg-[var(--color-down-muted)] text-[var(--color-down)]"
                        }`}
                    >
                        {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
                    </span>
                )}
                <span className="text-[12px] text-[var(--text-muted)]">24시간 기준</span>

                {krw !== null && price !== null && (
                    <span className="ml-auto text-[13px] tabular-nums text-[var(--text-tertiary)]">
                        {fmtUsd(price)}
                    </span>
                )}
            </div>

            {/* 통계도 같은 스트림에서 나온다 — 서버가 막혀도 함께 채워진다 */}
            <div className={`${CARD} mt-6 overflow-hidden`}>
                <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border-subtle)]">
                    <Cell
                        label="24시간 고가"
                        value={fmtPrice(high, usdKrw)}
                        sub={usdKrw !== null && high !== null ? fmtUsd(high) : undefined}
                    />
                    <Cell
                        label="24시간 저가"
                        value={fmtPrice(low, usdKrw)}
                        sub={usdKrw !== null && low !== null ? fmtUsd(low) : undefined}
                    />
                    <Cell label="24시간 거래대금" value={fmtCompactKrw(quoteVolume, usdKrw)} />
                    <Cell
                        label="미결제약정"
                        value={fmtCompactKrw(openInterestUsd, usdKrw)}
                        sub="열려 있는 계약 규모"
                    />
                </div>
            </div>
        </>
    );
}
