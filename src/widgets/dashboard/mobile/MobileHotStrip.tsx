"use client";

import { useHotCoins } from "@/shared/hooks/useMarketData";
import { useMobileCopy } from "./copy";
import { CoinIcon } from "./CoinIcon";
import { Skeleton } from "./MobileSection";

function fmtPct(pct: number) {
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

/**
 * 헤더 바로 아래 얇은 띠. 뉴스가 화면 첫 콘텐츠라는 자리는 유지하면서
 * "지금 뛰는 코인"만 한 줄로 스쳐 보이게 한다.
 */
export function MobileHotStrip() {
    const coins = useHotCoins(15);
    const { t } = useMobileCopy();

    return (
        <div
            className="flex gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t.hotCoins}
        >
            <span className="flex shrink-0 items-center gap-1.5 rounded-chip bg-[var(--color-up-muted)] px-2.5 text-caption font-bold tracking-wide text-[var(--color-up-text)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-up)]" aria-hidden="true" />
                HOT
            </span>

            {coins.length === 0
                ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8 w-24 shrink-0" />)
                : coins.map((c) => {
                    const up = c.pct >= 0;
                    return (
                        <div
                            key={c.symbol}
                            className="flex shrink-0 items-center gap-1.5 rounded-chip bg-surface-input px-2.5 py-1.5"
                        >
                            <CoinIcon base={c.base} size={16} />
                            <span className="text-footnote font-bold text-text-primary">{c.base}</span>
                            <span
                                className={`font-mono text-footnote font-bold ${
                                    up ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                                }`}
                            >
                                {fmtPct(c.pct)}
                            </span>
                        </div>
                    );
                })}
        </div>
    );
}
