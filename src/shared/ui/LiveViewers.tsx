"use client";

/**
 * 실시간 접속자 표시. 숫자가 0이면 아무것도 그리지 않는다
 * (presence가 붙기 전 SSR·초기 렌더에서 "0명"이 스쳐 보이는 게 제일 나쁘다).
 */

import { isLateNightKst } from "@/shared/lib/kst";

export function LiveViewers({
    count,
    compact = false,
}: {
    count: number;
    /** 좁은 자리용 — 점 + 숫자만 */
    compact?: boolean;
}) {
    if (count <= 0) return null;

    // count > 0은 presence가 붙은 뒤(=클라이언트)에만 참이라 서버 렌더와 어긋나지 않는다
    const lateNight = isLateNightKst();

    return (
        <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
            <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </span>
            {compact ? (
                <span className="text-caption font-semibold text-[var(--text-secondary)]">
                    {count}명
                </span>
            ) : (
                <span className="text-footnote font-semibold text-[var(--text-secondary)]">
                    {lateNight ? `${count}명이 안 자고 있어요` : `지금 ${count}명 보는 중`}
                </span>
            )}
        </span>
    );
}
