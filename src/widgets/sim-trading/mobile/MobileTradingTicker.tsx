"use client";

import { useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, simChangesAtom } from "@/shared/store/atoms";
import { SimSymbolSelector } from "@/features/sim-trading/SimSymbolSelector";
import { SimMarketData, type MarketField } from "@/features/sim-trading/SimMarketData";
import { useTheme } from "@/shared/hooks/useTheme";

/**
 * 심볼·현재가·등락률. 헤더 바로 아래에 붙어 스크롤해도 따라온다 —
 * 아래 탭에서 포지션이나 내역을 보는 동안에도 지금 가격은 계속 보여야 한다.
 *
 * 시장 지표(SimMarketData)는 항목이 많아 한 줄에 안 들어가므로 가로 스크롤로 흘린다.
 */
/* 모바일에 남길 지표. 거래대금·미결제약정·롱숏은 좁은 화면에서 자리값을 못 한다.
   모듈 상수로 두는 건 렌더마다 새 배열을 넘기면 SimMarketData의 폴링이 재시작되기 때문. */
const MOBILE_FIELDS: MarketField[] = ["change", "high", "low", "funding"];

export function MobileTradingTicker() {
    const isLight = useTheme();
    const simSymbol = useAtomValue(simSymbolAtom);
    const prices = useAtomValue(simPricesAtom);
    const changes = useAtomValue(simChangesAtom);

    const currentPrice = prices[simSymbol] ?? 0;
    const priceChange = changes[simSymbol] ?? null;
    const isUp = (priceChange ?? 0) >= 0;

    return (
        <div className="sticky top-14 z-30 border-b border-border-subtle bg-surface-card/85 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-2.5">
                <SimSymbolSelector isLight={isLight} />

                <div className="ml-auto flex items-baseline gap-2">
                    <span
                        className={`font-mono text-title3 font-bold tabular-nums ${
                            isUp ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                        }`}
                    >
                        {currentPrice > 0
                            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "—"}
                    </span>
                    <span
                        className={`rounded-chip px-1.5 py-0.5 font-mono text-caption font-bold ${
                            priceChange === null
                                ? "bg-surface-input text-text-muted"
                                : isUp
                                    ? "bg-[var(--color-up-muted)] text-[var(--color-up-text)]"
                                    : "bg-[var(--color-down-muted)] text-[var(--color-down-text)]"
                        }`}
                    >
                        {priceChange === null ? "—" : `${isUp ? "+" : "−"}${Math.abs(priceChange).toFixed(2)}%`}
                    </span>
                </div>
            </div>

            {/* SimMarketData 항목은 flex-1 min-w-0라서 폭이 모자라면 콘텐츠보다 작게 눌리고,
                라벨이 whitespace-nowrap이라 옆 항목과 글자가 겹친다. w-max로 감싸 자연 폭을
                갖게 하고 바깥에서 스크롤시킨다 — 데스크톱 컴포넌트는 그대로 둔다. */}
            <div className="overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="w-max">
                    <SimMarketData fields={MOBILE_FIELDS} />
                </div>
            </div>
        </div>
    );
}
