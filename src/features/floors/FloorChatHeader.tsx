"use client";

import { Pencil } from "lucide-react";
import { tintOf } from "@/shared/lib/color";
import { formatSignedPercent, pnlPercent } from "./floor";
import { nicknameFor } from "./nickname";
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
    onEdit,
}: Props) {
    if (!me || !myUserId) {
        return (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-input)] px-3.5 py-2.5">
                <span className="min-w-0 truncate text-[12px] text-[var(--text-tertiary)]">
                    층을 등록하면 이름 옆에 층수가 붙어요
                </span>
                <button
                    type="button"
                    onClick={onEdit}
                    disabled={myUserId === null}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        myUserId === null
                            ? "bg-[var(--surface-hover)] text-[var(--text-disabled)] cursor-not-allowed"
                            : "bg-[var(--color-accent)] text-black hover:opacity-90 cursor-pointer"
                    }`}
                >
                    등록
                </button>
            </div>
        );
    }

    const floor = Math.floor(me.price / unit);
    const pnl = pnlPercent(price, me.price);
    const isHolder = me.kind === "holder";
    const badgeColor = !isHolder
        ? "var(--color-info)"
        : floor > elevatorFloor
          ? "var(--color-down)"
          : floor < elevatorFloor
            ? "var(--color-up)"
            : "var(--text-tertiary)";

    return (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-[var(--surface-input)] px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
                <span
                    className="shrink-0 rounded-md px-1.5 py-[2px] text-[10px] font-bold leading-tight tabular-nums"
                    style={{ background: tintOf(badgeColor), color: badgeColor }}
                >
                    {floor}층
                </span>
                <span className="truncate text-[12px] font-semibold text-[var(--text-secondary)]">
                    {nicknameFor(myUserId)}
                </span>
                {isHolder && (
                    <span
                        className="shrink-0 text-[11px] font-bold tabular-nums"
                        style={{ color: pnl >= 0 ? "var(--color-up)" : "var(--color-down)" }}
                    >
                        {formatSignedPercent(pnl)}
                    </span>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {holderCount > 1 && averageFloor !== null && (
                    <span className="hidden text-[11px] tabular-nums text-[var(--text-muted)] sm:inline">
                        평균 {averageFloor.toFixed(1)}층 · {Math.round(stuckRatio * 100)}% 물림
                    </span>
                )}
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label="내 층 수정"
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] cursor-pointer"
                >
                    <Pencil size={13} strokeWidth={2.2} />
                </button>
            </div>
        </div>
    );
}
