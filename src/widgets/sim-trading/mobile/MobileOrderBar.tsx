"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SimOrderPanel } from "@/features/sim-trading/SimOrderPanel";
import type {
    SimAccount, OpenPositionInput, PositionSide, MarginMode,
} from "@/shared/types/sim-trading.types";
import { useMobileCopy } from "@/widgets/mobile/copy";

type Props = {
    account: SimAccount | null;
    totalUnrealizedPnl: number;
    totalPositionMargin: number;
    loading: boolean;
    onSubmit: (input: OpenPositionInput) => Promise<void>;
    onReset: () => Promise<void> | void;
    clickedPrice: number | null;
    lockedMarginMode: MarginMode | null;
    positionCount: number;
    orderCount: number;
    isEn: boolean;
    /** 호가에서 가격을 탭했을 때 열리는 방향. null이면 닫힘. */
    openSide: PositionSide | null;
    onOpenChange: (side: PositionSide | null) => void;
};

/* 가격 스트림 때문에 이 컴포넌트는 초당 수십 번 다시 그려진다. 애니메이션 설정을
   인라인 객체로 주면 렌더마다 참조가 바뀌어 framer-motion이 전환을 매번 처음부터
   다시 시작하고, 결과적으로 시트가 initial 위치에 얼어붙는다. 모듈 상수로 고정한다. */
const FADE_INITIAL = { opacity: 0 } as const;
const FADE_ANIMATE = { opacity: 1 } as const;
const FADE_TRANSITION = { duration: 0.2 } as const;

const SHEET_INITIAL = { y: "100%" } as const;
const SHEET_ANIMATE = { y: 0 } as const;
const SHEET_TRANSITION = { type: "spring", damping: 34, stiffness: 340 } as const;

function fmtUsd(n: number) {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 하단 고정 주문 바 + 주문 시트.
 *
 * 데스크톱은 주문 패널이 늘 오른쪽에 떠 있지만 모바일엔 그럴 폭이 없다.
 * 대신 잔고·손익과 롱/숏만 항상 보이게 깔아두고, 실제 입력은 시트로 올린다.
 *
 * 바는 sticky, 시트는 portal이다 — template.tsx의 전환 래퍼가 애니메이션 후
 * filter: blur(0px)를 남기는데, filter가 none이 아닌 조상은 fixed의 기준 블록이
 * 되어 버려서 시트가 뷰포트가 아닌 엉뚱한 위치에 붙는다.
 */
export function MobileOrderBar({
    account, totalUnrealizedPnl, totalPositionMargin, loading,
    onSubmit, onReset, clickedPrice, lockedMarginMode,
    positionCount, orderCount, isEn, openSide, onOpenChange,
}: Props) {
    const { t } = useMobileCopy();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const open = openSide !== null;

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const pnlUp = totalUnrealizedPnl >= 0;

    return (
        <>
            <div className="sticky bottom-0 z-30 border-t border-border-subtle bg-surface-card/95 px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.625rem)] backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 text-caption">
                    <span className="text-text-muted">
                        {t.balance}{" "}
                        <span className="font-mono font-bold text-text-secondary">
                            {account ? fmtUsd(account.balance) : "—"}
                        </span>
                    </span>
                    <span className="text-text-muted">
                        {t.unrealizedPnl}{" "}
                        <span className={`font-mono font-bold ${pnlUp ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"}`}>
                            {pnlUp ? "+" : "−"}{fmtUsd(Math.abs(totalUnrealizedPnl))}
                        </span>
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange("LONG")}
                        /* text-white를 쓰면 안 된다 — globals.css의
                           `html.light .text-white { color:#191F28 !important }`가 예외 목록에 없는
                           배경에서 글자를 검정으로 뒤집는다. 배경도 --color-up(#02C076)이 아니라
                           --color-accent-strong이다: 흰 글씨 기준 전자는 2.4:1, 후자는 4.55:1. */
                        className="flex-1 rounded-control bg-[var(--color-accent-strong)] py-3.5 text-headline font-bold text-[var(--text-on-fill)] transition-transform active:scale-[0.97]"
                    >
                        {t.long}
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange("SHORT")}
                        className="flex-1 rounded-control bg-[var(--color-down)] py-3.5 text-headline font-bold text-[var(--text-on-fill)] transition-transform active:scale-[0.97]"
                    >
                        {t.short}
                    </button>
                </div>
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {open && (
                        <>
                            <motion.div
                                className="fixed inset-0 z-[70] bg-black/50"
                                initial={FADE_INITIAL}
                                animate={FADE_ANIMATE}
                                exit={FADE_INITIAL}
                                transition={FADE_TRANSITION}
                                onClick={() => onOpenChange(null)}
                            />
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-label={openSide === "LONG" ? t.longOrder : t.shortOrder}
                                className="fixed inset-x-0 bottom-0 z-[71] flex h-[88vh] flex-col overflow-hidden rounded-t-[24px] border-t border-border-subtle bg-surface-elevated"
                                initial={SHEET_INITIAL}
                                animate={SHEET_ANIMATE}
                                exit={SHEET_INITIAL}
                                transition={SHEET_TRANSITION}
                            >
                                <div
                                    className="flex shrink-0 justify-center py-3"
                                    onClick={() => onOpenChange(null)}
                                >
                                    <span className="h-1 w-9 rounded-full bg-border-strong" aria-hidden="true" />
                                </div>

                                <div className="min-h-0 flex-1 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
                                    {/* key로 매번 새로 마운트한다 — 롱을 눌렀다 숏을 눌러도
                                        방향이 확실히 갈아끼워지고, 시트를 열 때마다 빈 주문서로 시작한다. */}
                                    <SimOrderPanel
                                        key={openSide ?? "none"}
                                        defaultSide={openSide ?? "LONG"}
                                        account={account}
                                        totalUnrealizedPnl={totalUnrealizedPnl}
                                        totalPositionMargin={totalPositionMargin}
                                        loading={loading}
                                        onSubmit={async (input) => {
                                            await onSubmit(input);
                                            onOpenChange(null);
                                        }}
                                        onReset={onReset}
                                        clickedPrice={clickedPrice}
                                        lockedMarginMode={lockedMarginMode}
                                        positionCount={positionCount}
                                        orderCount={orderCount}
                                        isEn={isEn}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
}
