"use client";

import { useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { stockPriceAtom } from "@/shared/store/atoms";
import { fmtUsd, fmtPrice, fmtCompactKrw, formatKrw } from "../format";
import { RollingNumber } from "../RollingNumber";

export type InitialStats = {
    price: number | null;
    changePercent: number | null;
    high: number | null;
    low: number | null;
    quoteVolume: number | null;
    openInterestUsd: number | null;
    /** 직전 정규장 마감 시점의 토큰 가격 */
    sessionClosePrice: number | null;
};

type Props = {
    symbol: string;
    /** null이면 원화 표기를 숨기고 달러만 보여준다 */
    usdKrw: number | null;
    initial: InitialStats;
    sessionCloseAt: number | null;
    marketIsOpen: boolean;
    marketName: string;
    /** 비상장(SPCX)은 정규장이 없어 "마감 이후" 개념이 성립하지 않는다 */
    isUnlisted: boolean;
};

type TickerMessage = {
    e: string;
    c: string; // 현재가
    P: string; // 24h 변동률(%)
    h: string; // 24h 고가
    l: string; // 24h 저가
    q: string; // 24h 거래대금(USDT)
};

const CARD = "rounded-card bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]";
const OI_HOSTS = ["https://fapi.binance.com", "https://www.binance.com"];

function num(v: string): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="px-5 py-4">
            <div className="text-caption font-medium text-[var(--text-tertiary)]">{label}</div>
            <div className="mt-1 text-body sm:text-base font-bold tabular-nums text-[var(--text-primary)]">
                {value}
            </div>
            {sub && (
                <div className="mt-0.5 text-caption tabular-nums text-[var(--text-muted)]">{sub}</div>
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
export function StockLiveData({
    symbol,
    usdKrw,
    initial,
    sessionCloseAt,
    marketIsOpen,
    marketName,
    isUnlisted,
}: Props) {
    const [price, setPrice] = useState(initial.price);
    const [changePercent, setChangePercent] = useState(initial.changePercent);
    const [high, setHigh] = useState(initial.high);
    const [low, setLow] = useState(initial.low);
    const [quoteVolume, setQuoteVolume] = useState(initial.quoteVolume);
    const [openInterestUsd, setOpenInterestUsd] = useState(initial.openInterestUsd);
    const [sessionClose, setSessionClose] = useState(initial.sessionClosePrice);
    const [isLive, setIsLive] = useState(false);
    const [flash, setFlash] = useState<"up" | "down" | null>(null);
    const prevPriceRef = useRef<number | null>(initial.price);
    // 같은 페이지의 층 단면도가 이 값을 읽는다 (소켓을 또 열지 않도록)
    const publishPrice = useSetAtom(stockPriceAtom);

    useEffect(() => {
        if (initial.price === null) return;
        publishPrice((prev) => ({ ...prev, [symbol]: initial.price! }));
    }, [symbol, initial.price, publishPrice]);

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
                        publishPrice((prev) => (prev[symbol] === next ? prev : { ...prev, [symbol]: next }));
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
    }, [symbol, publishPrice]);

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

    // 장 마감 기준가도 서버가 못 가져왔으면 브라우저에서 채운다
    useEffect(() => {
        if (initial.sessionClosePrice !== null || sessionCloseAt === null) return;
        let cancelled = false;

        async function load() {
            for (const host of OI_HOSTS) {
                try {
                    const res = await fetch(
                        `${host}/fapi/v1/klines?symbol=${symbol}USDT&interval=15m&startTime=${sessionCloseAt}&limit=1`,
                    );
                    if (!res.ok) continue;
                    const k = (await res.json()) as unknown[][];
                    const n = Number(k?.[0]?.[1]);
                    if (cancelled) return;
                    if (Number.isFinite(n)) {
                        setSessionClose(n);
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
    }, [symbol, sessionCloseAt, initial.sessionClosePrice]);

    const isUp = (changePercent ?? 0) >= 0;
    const krw = price !== null && usdKrw !== null ? price * usdKrw : null;

    const sinceClose =
        price !== null && sessionClose !== null && sessionClose > 0
            ? {
                  pct: ((price - sessionClose) / sessionClose) * 100,
                  diff: usdKrw !== null ? (price - sessionClose) * usdKrw : null,
              }
            : null;

    const closeLabel =
        sessionCloseAt === null
            ? ""
            : (() => {
                  // "7. 28. 오후 03:30" 같은 기본 포맷이 지저분해 직접 조립한다
                  const p = new Intl.DateTimeFormat("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Seoul",
                  }).formatToParts(new Date(sessionCloseAt));
                  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
                  return `${get("month")}월 ${get("day")}일 ${get("hour")}:${get("minute")}`;
              })();

    const flashColor =
        flash === "up"
            ? "text-[var(--color-up-text)]"
            : flash === "down"
              ? "text-[var(--color-down-text)]"
              : "text-[var(--text-primary)]";

    return (
        <>
            {/* 원화를 주가격으로 — 국내 유입의 검색 의도에 맞춘다 */}
            {/* 긴 원화 표기(예: 1,532,831원 10자)가 좁은 화면에서 잘리지 않게 폭을 독점시킨다.
                LIVE 배지는 아래 메타 행으로 내렸다. */}
            <RollingNumber
                value={krw !== null ? formatKrw(krw) : fmtUsd(price)}
                className={`block text-[2rem] min-[380px]:text-[2.5rem] sm:text-[3.25rem] font-extrabold tabular-nums tracking-[-0.03em] transition-colors duration-300 ${flashColor}`}
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {changePercent !== null && (
                    <span
                        className={`rounded-chip px-2 py-1 text-body font-bold tabular-nums ${
                            isUp
                                ? "bg-[var(--color-up-muted)] text-[var(--color-up-text)]"
                                : "bg-[var(--color-down-muted)] text-[var(--color-down-text)]"
                        }`}
                    >
                        {isUp ? "+" : "−"}{Math.abs(changePercent).toFixed(2)}%
                    </span>
                )}
                <span className="text-footnote text-[var(--text-muted)]">24시간 기준</span>

                <span
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-input)] px-2 py-1 text-caption font-bold text-[var(--text-tertiary)]"
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isLive
                                ? "animate-pulse bg-[var(--color-accent)]"
                                : "bg-[var(--text-disabled)]"
                        }`}
                    />
                    {isLive ? "실시간" : "연결 중"}
                </span>

                {krw !== null && price !== null && (
                    <span className="ml-auto text-label tabular-nums text-[var(--text-tertiary)]">
                        {fmtUsd(price)}
                    </span>
                )}
            </div>

            {/* 이 페이지만 답할 수 있는 숫자. 정규장이 닫힌 동안 얼마나 움직였나. */}
            {sinceClose !== null && !isUnlisted && !marketIsOpen && (
                <div className="mt-5 rounded-card bg-[var(--surface-input)] px-4 py-3.5">
                    <div className="text-caption font-medium text-[var(--text-tertiary)]">
                        {marketName} 마감({closeLabel}) 이후 변화
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span
                            className={`text-title3 font-extrabold tabular-nums tracking-[-0.02em] ${
                                sinceClose.pct >= 0
                                    ? "text-[var(--color-up-text)]"
                                    : "text-[var(--color-down-text)]"
                            }`}
                        >
                            {sinceClose.pct >= 0 ? "+" : "−"}
                            {Math.abs(sinceClose.pct).toFixed(2)}%
                        </span>
                        {sinceClose.diff !== null && (
                            <span className="text-label tabular-nums text-[var(--text-secondary)]">
                                {sinceClose.diff >= 0 ? "+" : "−"}
                                {formatKrw(Math.abs(sinceClose.diff))}
                            </span>
                        )}
                    </div>
                    {/* 위의 % 를 읽으려면 기준가를 알아야 한다. 문장 전체가 11px 흐린 글씨였을 땐
                        정작 그 숫자가 안 보였다. 색을 얹으면 위의 등락 색과 경쟁하니
                        밝기로만 끌어올린다 — text-primary는 다크에서 밝고 라이트에서 진하다. */}
                    <div className="mt-2 text-footnote leading-relaxed text-[var(--text-muted)]">
                        마감 시점 토큰 가격{" "}
                        <strong className="font-bold tabular-nums text-[var(--text-primary)]">
                            {fmtPrice(sessionClose, usdKrw)}
                        </strong>{" "}
                        기준입니다.
                        <span className="text-caption"> 해당 종목의 정규장 종가가 아닙니다.</span>
                    </div>
                </div>
            )}

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
