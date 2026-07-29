"use client";

import { useCallback, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { stockPriceAtom } from "@/shared/store/atoms";
import { useAnonUserId } from "@/shared/hooks/useAnonUserId";
import { useRoomPresence } from "@/shared/hooks/useRoomPresence";
import { nicknameFor } from "@/shared/lib/nickname";
import { Chat, type ChatIdentity } from "@/features/chat/Chat";
import { currencyOf, floorUnitFor, summarize, type StockMarketLike } from "./floor";
import { useResidents } from "./useResidents";
import { FloorChatHeader } from "./FloorChatHeader";
import { ResidentSheet } from "./ResidentSheet";

const CARD = "rounded-card bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]";

type Props = {
    slug: string;
    symbol: string;
    koreanName: string;
    market: StockMarketLike;
    floorUnit?: number;
    usdKrw: number | null;
    /** 서버가 렌더한 기준가 (USDT). 층 단위를 고정하는 데도 쓴다. */
    initialPrice: number | null;
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{children}</h2>
            {hint && (
                <p className="mt-1.5 text-label leading-relaxed text-[var(--text-tertiary)]">{hint}</p>
            )}
        </div>
    );
}

/**
 * 종목 대화방. 층은 별도 섹션 없이 이름 옆 배지와 헤더 한 줄로만 드러난다.
 *
 * 가격은 StockLiveData가 여는 WebSocket 하나를 stockPriceAtom으로 받아 쓴다.
 * 소켓을 또 열면 같은 스트림이 두 개가 된다.
 */
export function StockRoom({
    slug,
    symbol,
    koreanName,
    market,
    floorUnit,
    usdKrw,
    initialPrice,
}: Props) {
    const roomId = `stock:${slug}`;
    const userId = useAnonUserId();
    const [sheetOpen, setSheetOpen] = useState(false);

    const livePrices = useAtomValue(stockPriceAtom);
    const currency = currencyOf(market);

    // 사용자가 아는 숫자로 맞춘다. 한국 종목의 평단가는 원화다.
    const toNative = useCallback(
        (usdt: number | null): number | null => {
            if (usdt === null || usdt <= 0) return null;
            if (currency === "USD") return usdt;
            return usdKrw === null ? null : usdt * usdKrw;
        },
        [currency, usdKrw],
    );

    const price = toNative(livePrices[symbol] ?? initialPrice);
    // 층 단위는 실시간 가격이 아니라 기준가로 정한다 — 세션 중에 층수가 바뀌면 안 된다
    const unit = floorUnitFor(market, floorUnit, toNative(initialPrice));

    const { residents, byUser, me, save, remove } = useResidents(roomId, userId);
    const viewerCount = useRoomPresence(roomId, userId);

    /** 현재가가 걸쳐 있는 층. 이 위는 물린 사람, 아래는 수익 구간. */
    const elevatorFloor = price !== null ? Math.floor(price / unit) : 0;

    const summary = useMemo(() => summarize(residents, price ?? 0, unit), [residents, price, unit]);

    const identityFor = useCallback(
        (uid: string): ChatIdentity => {
            const name = nicknameFor(uid);
            const resident = byUser[uid];
            if (!resident || price === null) return { name };
            const f = Math.floor(resident.price / unit);
            if (resident.kind === "watcher") return { name, badge: { label: `${f}층`, tone: "info" } };
            return {
                name,
                badge: {
                    label: `${f}층`,
                    tone: f > elevatorFloor ? "down" : f < elevatorFloor ? "up" : "neutral",
                },
            };
        },
        [byUser, price, unit, elevatorFloor],
    );

    const openSheet = useCallback(() => setSheetOpen(true), []);

    return (
        <>
            <section id="chat" className="mt-12 scroll-mt-16">
                <SectionTitle
                    hint={`${koreanName}를 보고 있는 사람들과 지금 바로 이야기해보세요. 이름 옆 층수로 서로가 어디쯤 물려 있는지 보입니다.`}
                >
                    {koreanName} 투자자 대화방
                </SectionTitle>
                <div className={`${CARD} h-[72dvh] min-h-[420px] sm:h-[620px] p-3 sm:p-4`}>
                    <Chat
                        roomId={roomId}
                        identityFor={price !== null ? identityFor : undefined}
                        header={
                            price !== null ? (
                                <FloorChatHeader
                                    me={me}
                                    myUserId={userId}
                                    unit={unit}
                                    price={price}
                                    elevatorFloor={elevatorFloor}
                                    averageFloor={summary.averageFloor}
                                    stuckRatio={summary.stuckRatio}
                                    holderCount={summary.holderCount}
                                    viewerCount={viewerCount}
                                    onEdit={openSheet}
                                />
                            ) : undefined
                        }
                    />
                </div>
            </section>

            {price !== null && (
                <ResidentSheet
                    open={sheetOpen}
                    onClose={() => setSheetOpen(false)}
                    koreanName={koreanName}
                    currency={currency}
                    unit={unit}
                    price={price}
                    current={me}
                    onSave={save}
                    onRemove={remove}
                />
            )}
        </>
    );
}
