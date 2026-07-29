"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { stockTokens } from "@/shared/lib/stock-tokens";
import { formatKrw } from "./format";

/**
 * 서버가 바이낸스에서 시세를 못 가져왔을 때(배포 리전 지역 차단 등) 브라우저에서 직접 받아온다.
 * 사용자 브라우저는 차단되지 않으므로 이 경로는 거의 항상 성공한다.
 *
 * 선물 /ticker/24hr은 symbols 파라미터를 지원하지 않아 전체(약 270KB)를 받은 뒤 걸러낸다.
 * exchangeInfo(1MB)는 받지 않는다 — 개별 페이지가 있는 종목 목록은 이미 번들에 있다.
 */

type Row = {
    slug: string;
    base: string;
    koreanName: string;
    isKorean: boolean;
    price: number;
    changePercent: number;
};

type RawTicker = { symbol: string; lastPrice: string; priceChangePercent: string };

const HOSTS = ["https://fapi.binance.com", "https://www.binance.com"];

export function StocksFallbackGrid({ usdKrw }: { usdKrw: number | null }) {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            for (const host of HOSTS) {
                try {
                    const res = await fetch(`${host}/fapi/v1/ticker/24hr`);
                    if (!res.ok) continue;
                    const all = (await res.json()) as RawTicker[];
                    if (cancelled) return;

                    const bySymbol = new Map(all.map((t) => [t.symbol, t]));
                    const next = stockTokens
                        .map((t) => {
                            const raw = bySymbol.get(`${t.symbol}USDT`);
                            if (!raw) return null;
                            return {
                                slug: t.slug,
                                base: t.symbol,
                                koreanName: t.koreanName,
                                isKorean: t.market === "KR",
                                price: Number(raw.lastPrice),
                                changePercent: Number(raw.priceChangePercent),
                            } satisfies Row;
                        })
                        .filter((r): r is Row => r !== null);

                    setRows(next);
                    return;
                } catch {
                    // 다음 호스트로 폴백
                }
            }
            if (!cancelled) setFailed(true);
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (failed) {
        return (
            <div className="mt-10 rounded-card bg-[var(--surface-card)] p-6 text-center ring-1 ring-[var(--border-subtle)]">
                <p className="text-body font-bold text-[var(--text-primary)]">
                    시세를 불러오지 못했어요
                </p>
                <p className="mt-2 text-label leading-relaxed text-[var(--text-tertiary)]">
                    네트워크 상태를 확인한 뒤 새로고침해 주세요.
                </p>
            </div>
        );
    }

    if (rows === null) {
        // 스켈레톤 — 레이아웃이 튀지 않게 카드와 같은 높이를 유지한다
        return (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
                {stockTokens.slice(0, 6).map((t) => (
                    <div
                        key={t.slug}
                        className="h-[104px] animate-pulse rounded-card bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]"
                    />
                ))}
            </div>
        );
    }

    const korean = rows.filter((r) => r.isKorean);
    const overseas = rows.filter((r) => !r.isKorean);

    return (
        <>
            {korean.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight">한국 주식 토큰</h2>
                    <Grid rows={korean} usdKrw={usdKrw} />
                </section>
            )}
            {overseas.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight">주요 해외 종목</h2>
                    <Grid rows={overseas} usdKrw={usdKrw} />
                </section>
            )}
        </>
    );
}

function Grid({ rows, usdKrw }: { rows: Row[]; usdKrw: number | null }) {
    return (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {rows.map((r) => {
                const isUp = r.changePercent >= 0;
                const price =
                    usdKrw === null
                        ? `$${r.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : formatKrw(r.price * usdKrw);
                return (
                    <Link
                        key={r.slug}
                        href={`/stocks/${r.slug}`}
                        className="block rounded-card bg-[var(--surface-card)] p-4 ring-1 ring-[var(--border-subtle)] transition-colors hover:ring-[var(--border-strong)]"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate text-body font-bold text-[var(--text-primary)]">
                                    {r.koreanName}
                                </div>
                                <div className="mt-0.5 text-caption text-[var(--text-muted)]">
                                    {r.base}
                                </div>
                            </div>
                            <span
                                className={`shrink-0 rounded-chip px-1.5 py-0.5 text-caption font-bold tabular-nums ${
                                    isUp
                                        ? "bg-[var(--color-up-muted)] text-[var(--color-up-text)]"
                                        : "bg-[var(--color-down-muted)] text-[var(--color-down-text)]"
                                }`}
                            >
                                {Math.abs(r.changePercent).toFixed(2)}%
                            </span>
                        </div>
                        <div className="mt-3 text-title3 font-extrabold tabular-nums tracking-[-0.02em] text-[var(--text-primary)]">
                            {price}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
