"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLiquidations, useWhaleTrades, MIN_USD_LABEL } from "@/shared/hooks/useLiveFeeds";
import { fmtUsdCompact } from "@/shared/lib/formatting";
import { CoinIcon } from "@/widgets/mobile/CoinIcon";
import { LiveDot, Skeleton } from "@/widgets/mobile/MobileSection";
import { useMobileCopy, type MobileCopy } from "@/widgets/mobile/copy";

type Tab = "liq" | "whale";

const MAX_ROWS = 20;

function relTime(ts: number, t: MobileCopy): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return t.justNow;
    const m = Math.floor(s / 60);
    if (m < 60) return t.minsAgo(m);
    return t.hoursAgo(Math.floor(m / 60));
}

type Row = {
    id: string;
    symbol: string;
    label: string;
    isUp: boolean;
    usdValue: number;
    timestamp: number;
};

/**
 * 청산·고래를 세그먼트 하나로 묶는다. 모바일에서 두 피드를 세로로 쌓으면
 * 스크롤이 길어지는 데다 둘 다 계속 움직여서 눈이 어디를 봐야 할지 잃는다.
 * 소켓은 탭과 무관하게 둘 다 열어 둔다 — 전환할 때마다 다시 붙으면
 * 빈 목록부터 시작해서 방금 본 체결이 사라진다.
 */
export function MobileLiveFeed() {
    const [tab, setTab] = useState<Tab>("liq");
    const { t } = useMobileCopy();
    const liq = useLiquidations(MAX_ROWS);
    const whale = useWhaleTrades(MAX_ROWS);

    // 새 체결이 뜸한 구간에서도 "3분 전"이 멎어 있지 않게 주기적으로 다시 그린다.
    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((v) => v + 1), 30_000);
        return () => clearInterval(t);
    }, []);

    const active = tab === "liq" ? liq : whale;
    const rows: Row[] = tab === "liq"
        ? liq.items.map((l) => ({
            id: l.id,
            symbol: l.symbol,
            label: l.side === "LONG" ? t.longLiq : t.shortLiq,
            // 롱이 청산됐다 = 가격이 밀렸다 → 하락 색으로 읽는 게 맞다
            isUp: l.side === "SHORT",
            usdValue: l.usdValue,
            timestamp: l.timestamp,
        }))
        : whale.items.map((w) => ({
            id: w.id,
            symbol: w.symbol,
            label: w.side === "BUY" ? t.buy : t.sell,
            isUp: w.side === "BUY",
            usdValue: w.usdValue,
            timestamp: w.timestamp,
        }));

    return (
        <section className="px-4" aria-label={t.liveTrades}>
            <div className="flex items-center gap-2 px-1 pb-2.5">
                <div className="flex rounded-control bg-surface-input p-1">
                    {([["liq", t.liquidations], ["whale", t.whales]] as const).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            aria-pressed={tab === key}
                            className="relative rounded-chip px-3 py-1.5 text-footnote font-bold transition-colors"
                        >
                            {tab === key && (
                                <motion.span
                                    layoutId="mobile-feed-tab"
                                    className="absolute inset-0 rounded-chip bg-surface-card shadow-sm"
                                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                />
                            )}
                            <span className={`relative ${tab === key ? "text-text-primary" : "text-text-muted"}`}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
                {active.connected && <LiveDot />}
                <span className="ml-auto text-caption text-text-muted">{MIN_USD_LABEL}</span>
            </div>

            <div className="overflow-hidden rounded-card border border-border-subtle bg-surface-card">
                {rows.length === 0 && active.connected ? (
                    // 청산은 몇 분씩 없을 수 있다. 그때 스켈레톤을 계속 두면
                    // 로딩이 멎은 화면으로 보인다 — 소켓은 붙었다고 말해준다.
                    <p className="px-4 py-10 text-center text-footnote text-text-muted">
                        {t.waitingFeed}
                    </p>
                ) : rows.length === 0 ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-7 w-7 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="ml-auto h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <ul>
                        <AnimatePresence initial={false}>
                            {rows.map((r, i) => (
                                <motion.li
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                    className={`flex items-center gap-3 px-4 py-3 ${
                                        i > 0 ? "border-t border-border-subtle" : ""
                                    }`}
                                >
                                    <CoinIcon base={r.symbol} size={28} />

                                    <div className="min-w-0">
                                        <p className="text-label font-bold leading-tight text-text-primary">
                                            {r.symbol}
                                        </p>
                                        <p
                                            className={`text-caption font-bold ${
                                                r.isUp ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                                            }`}
                                        >
                                            {r.label}
                                        </p>
                                    </div>

                                    <div className="ml-auto text-right">
                                        <p
                                            className={`font-mono text-label font-bold leading-tight ${
                                                r.isUp ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                                            }`}
                                        >
                                            {fmtUsdCompact(r.usdValue)}
                                        </p>
                                        <p className="text-caption text-text-muted">{relTime(r.timestamp, t)}</p>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
        </section>
    );
}
