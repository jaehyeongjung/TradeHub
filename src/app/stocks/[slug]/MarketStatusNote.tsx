"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { roomViewerCountAtom } from "@/shared/store/atoms";
import { isLateNightKst } from "@/shared/lib/kst";

type Props = {
    roomId: string;
    isOpen: boolean;
    marketName: string;
    hours: string;
};

/**
 * 장 상태 안내 문구.
 *
 * 새벽(KST 0~6시)에는 정적인 안내 대신 지금 같이 보고 있는 사람 수를 말한다.
 * 이 페이지가 검색으로 데려오는 사람의 절반은 그 시간에 온다.
 *
 * 접속자 수는 아래 대화방의 presence 채널이 atom에 넣어준 값을 읽는다 —
 * 여기서 채널을 또 열면 같은 방을 두 번 구독하게 된다.
 * 시간·접속자 판단은 마운트 뒤에만 해서 서버 렌더 HTML과 어긋나지 않게 한다.
 */
/** 실시간 값이라는 걸 숫자 자체로 알리는 표시. 색 + 깜빡이는 점 두 겹. */
function LiveCount({ n }: { n: number }) {
    return (
        <strong className="inline-flex items-baseline gap-1 font-bold tabular-nums text-[var(--color-accent-text)]">
            <span className="relative inline-flex h-1.5 w-1.5 self-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </span>
            {n}
        </strong>
    );
}

export function MarketStatusNote({ roomId, isOpen, marketName, hours }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const viewers = useAtomValue(roomViewerCountAtom)[roomId] ?? 0;
    const lateNight = mounted && isLateNightKst();

    if (lateNight && viewers > 0) {
        return (
            <p className="mt-2 text-label leading-relaxed text-[var(--text-secondary)]">
                {isOpen ? (
                    <>
                        지금은 {marketName} 정규장({hours}) 시간이고,{" "}
                        <LiveCount n={viewers} />
                        {"명이 같이 보고 있습니다. "}
                        토큰 가격과 실제 주가가 가깝게 움직이는 시간대예요.
                    </>
                ) : (
                    <>
                        <strong className="font-bold text-[var(--text-primary)]">
                            {marketName}는 닫혔지만{" "}
                        </strong>
                        <LiveCount n={viewers} />
                        <strong className="font-bold text-[var(--text-primary)]">
                            명이 아직 안 자고 있습니다.
                        </strong>
                    </>
                )}
            </p>
        );
    }

    return (
        <p className="mt-2 text-label leading-relaxed text-[var(--text-secondary)]">
            {isOpen ? (
                <>
                    지금은 {marketName} 정규장({hours})입니다. 토큰 가격과 실제 주가가 가깝게
                    움직이는 시간대예요.
                </>
            ) : (
                <>
                    {marketName}는 닫혔지만{" "}
                    <strong className="font-bold text-[var(--text-primary)]">
                        토큰은 계속 거래 중
                    </strong>
                    이에요.
                </>
            )}
        </p>
    );
}
