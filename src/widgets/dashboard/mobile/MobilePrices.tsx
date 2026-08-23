"use client";

import { useLiveTickers } from "@/shared/hooks/useLiveTickers";
import { CoinIcon } from "./CoinIcon";
import { MobileSection, Skeleton } from "./MobileSection";
import { useMobileCopy } from "./copy";

const CORE = [
    { symbol: "btcusdt", base: "BTC", ko: "비트코인", en: "Bitcoin" },
    { symbol: "ethusdt", base: "ETH", ko: "이더리움", en: "Ethereum" },
    { symbol: "solusdt", base: "SOL", ko: "솔라나",   en: "Solana" },
    { symbol: "xrpusdt", base: "XRP", ko: "리플",     en: "XRP" },
];

const SYMBOLS = CORE.map((c) => c.symbol);

function fmtUsd(n: number) {
    if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (n >= 1) return `$${n.toFixed(2)}`;
    return `$${n.toPrecision(4)}`;
}

/**
 * 핵심 코인 시세. 데스크톱은 타일 4개를 가로로 붙이지만, 모바일은
 * 세로 목록이라 심볼·가격·등락이 같은 x축에 정렬돼 훑어 내리기 좋다.
 */
export function MobilePrices() {
    const tickers = useLiveTickers(SYMBOLS);
    const { t, isEn } = useMobileCopy();

    return (
        <MobileSection title={t.corePrices} live>
            <ul>
                {CORE.map((c, i) => {
                    const t = tickers[c.symbol];
                    const up = (t.pct ?? 0) >= 0;
                    return (
                        <li
                            key={c.symbol}
                            className={`flex items-center gap-3 px-4 py-3.5 ${
                                i > 0 ? "border-t border-border-subtle" : ""
                            }`}
                        >
                            <CoinIcon base={c.base} size={32} />

                            <div className="min-w-0">
                                <p className="text-body font-bold leading-tight text-text-primary">{c.base}</p>
                                <p className="text-caption text-text-muted">{isEn ? c.en : c.ko}</p>
                            </div>

                            <div className="ml-auto text-right">
                                {t.price == null ? (
                                    <>
                                        <Skeleton className="mb-1 h-5 w-24" />
                                        <Skeleton className="ml-auto h-3 w-12" />
                                    </>
                                ) : (
                                    <>
                                        <p
                                            className={`font-mono text-headline font-bold leading-tight transition-colors duration-300 ${
                                                t.dir === "up"
                                                    ? "text-[var(--color-up-text)]"
                                                    : t.dir === "down"
                                                        ? "text-[var(--color-down-text)]"
                                                        : "text-text-primary"
                                            }`}
                                        >
                                            {fmtUsd(t.price)}
                                        </p>
                                        <p
                                            className={`font-mono text-footnote font-bold ${
                                                up ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                                            }`}
                                        >
                                            {up ? "+" : ""}{(t.pct ?? 0).toFixed(2)}%
                                        </p>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </MobileSection>
    );
}
