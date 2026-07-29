"use client";

import { Pencil } from "lucide-react";
import { tintOf } from "@/shared/lib/color";
import { LiveViewers } from "@/shared/ui/LiveViewers";
import { Button } from "@/shared/ui/Button";
import { formatSignedPercent, pnlPercent } from "./floor";
import { nicknameFor } from "@/shared/lib/nickname";
import type { Resident } from "./useResidents";

type Props = {
    me: Resident | null;
    myUserId: string | null;
    unit: number;
    price: number;
    elevatorFloor: number;
    averageFloor: number | null;
    stuckRatio: number;
    holderCount: number;
    viewerCount: number;
    onEdit: () => void;
};

/**
 * 대화방 헤더. 단면도는 위 섹션에 있으니 여기서는 "내가 누구로 보이는가" 한 줄만
 * 책임진다. 채팅 영역의 세로 공간을 최대한 남겨야 한다.
 */
export function FloorChatHeader({
    me,
    myUserId,
    unit,
    price,
    elevatorFloor,
    averageFloor,
    stuckRatio,
    holderCount,
    viewerCount,
    onEdit,
}: Props) {
    if (!me || !myUserId) {
        return (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-card bg-[var(--surface-input)] px-3.5 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <LiveViewers count={viewerCount} compact />
                    <span className="min-w-0 truncate text-footnote text-[var(--text-tertiary)]">
                        층을 등록하면 이름 옆에 층수가 붙어요
                    </span>
                </div>
                {/* 익명 로그인이 끝날 때까지 disabled로 두면 죽은 버튼처럼 보인다.
                    색을 유지한 채 스피너만 돌려서 "곧 됩니다"로 읽히게 한다. */}
                <Button size="sm" onClick={onEdit} loading={myUserId === null}>
                    층 등록
                </Button>
            </div>
        );
    }

    const floor = Math.floor(me.price / unit);
    const pnl = pnlPercent(price, me.price);
    const isHolder = me.kind === "holder";
    const badgeColor = !isHolder
        ? "var(--color-info)"
        : floor > elevatorFloor
          ? "var(--color-down-text)"
          : floor < elevatorFloor
            ? "var(--color-up-text)"
            : "var(--text-tertiary)";

    return (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-card bg-[var(--surface-input)] px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
                <span
                    className="shrink-0 rounded-md px-1.5 py-[2px] text-caption font-bold leading-tight tabular-nums"
                    style={{ background: tintOf(badgeColor), color: badgeColor }}
                >
                    {floor}층
                </span>
                <span className="truncate text-footnote font-semibold text-[var(--text-secondary)]">
                    {nicknameFor(myUserId)}
                </span>
                {isHolder && (
                    <span
                        className="shrink-0 text-caption font-bold tabular-nums"
                        style={{ color: pnl >= 0 ? "var(--color-up-text)" : "var(--color-down-text)" }}
                    >
                        {formatSignedPercent(pnl)}
                    </span>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {holderCount > 1 && averageFloor !== null && (
                    <span className="hidden text-caption tabular-nums text-[var(--text-muted)] sm:inline">
                        평균 {averageFloor.toFixed(1)}층 · {Math.round(stuckRatio * 100)}% 물림
                    </span>
                )}
                <LiveViewers count={viewerCount} compact />
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label="내 층 수정"
                    className="rounded-chip p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] cursor-pointer"
                >
                    <Pencil size={13} strokeWidth={2.2} />
                </button>
            </div>
        </div>
    );
}
