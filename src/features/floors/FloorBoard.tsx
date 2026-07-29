"use client";

import { ChevronRight, Pencil } from "lucide-react";
import type { Currency, FloorWindow, ResidentKind } from "./floor";
import { formatNative, formatSignedPercent, pnlPercent } from "./floor";
import { Building, BuildingLegend } from "./Building";
import { nicknameFor } from "./nickname";
import type { Resident } from "./useResidents";

type Summary = {
    holderCount: number;
    watcherCount: number;
    stuckCount: number;
    stuckRatio: number;
    averageFloor: number | null;
};

type Props = {
    currency: Currency;
    unit: number;
    price: number;
    elevator: number;
    view: FloorWindow;
    me: Resident | null;
    myUserId: string | null;
    summary: Summary;
    onEdit: () => void;
};

function daysSince(iso: string): number {
    const started = new Date(iso).getTime();
    if (!Number.isFinite(started)) return 1;
    return Math.max(1, Math.floor((Date.now() - started) / 86_400_000) + 1);
}

function MyStatus({
    me,
    myUserId,
    price,
    currency,
    unit,
    onEdit,
}: {
    me: Resident;
    myUserId: string;
    price: number;
    currency: Currency;
    unit: number;
    onEdit: () => void;
}) {
    const floor = Math.floor(me.price / unit);
    const pnl = pnlPercent(price, me.price);
    const isHolder = me.kind === "holder";
    const color = pnl >= 0 ? "var(--color-up)" : "var(--color-down)";

    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <div className="text-[12px] font-medium text-[var(--text-tertiary)]">
                    {isHolder ? "내 층" : "내 매수 대기 층"}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-[var(--text-primary)]">
                        {floor}층
                    </span>
                    {isHolder ? (
                        <span
                            className="text-[15px] font-bold leading-none tabular-nums"
                            style={{ color }}
                        >
                            {formatSignedPercent(pnl)}
                        </span>
                    ) : (
                        <span
                            className="text-[13px] font-bold leading-none"
                            style={{ color: "var(--color-info)" }}
                        >
                            대기 중
                        </span>
                    )}
                </div>
                <div className="mt-2 truncate text-[12px] text-[var(--text-muted)]">
                    {nicknameFor(myUserId)} · {formatNative(me.price, currency)} ·{" "}
                    {isHolder ? "입주" : "대기"} {daysSince(me.createdAt)}일차
                </div>
            </div>

            <button
                type="button"
                onClick={onEdit}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-[var(--surface-input)] px-3 py-2 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
            >
                <Pencil size={13} strokeWidth={2.2} />
                수정
            </button>
        </div>
    );
}

function EmptyStatus({ onEdit, ready }: { onEdit: () => void; ready: boolean }) {
    return (
        <div>
            <div className="text-[15px] font-bold text-[var(--text-primary)]">
                이 종목에서 나는 몇 층일까
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                평균 매수가를 넣으면 층이 정해지고, 대화방에서 이름 옆에 층이 붙습니다. 아직 안
                샀다면 사고 싶은 가격으로 대기 등록도 할 수 있어요.
            </p>
            <button
                type="button"
                onClick={onEdit}
                disabled={!ready}
                className={`mt-4 flex w-full items-center justify-center gap-1 rounded-2xl py-3.5 text-[14px] font-bold transition-all ${
                    ready
                        ? "bg-[var(--color-accent)] text-black hover:opacity-90 cursor-pointer"
                        : "bg-[var(--surface-input)] text-[var(--text-disabled)] cursor-not-allowed"
                }`}
            >
                내 층 등록하기
                <ChevronRight size={16} strokeWidth={2.4} />
            </button>
        </div>
    );
}

export function FloorBoard({
    currency,
    unit,
    price,
    elevator,
    view,
    me,
    myUserId,
    summary,
    onEdit,
}: Props) {
    const myFloor = me ? Math.floor(me.price / unit) : null;
    const myKind: ResidentKind | null = me?.kind ?? null;

    const summaryText: string[] = [];
    if (summary.holderCount > 0) {
        summaryText.push(`입주민 ${summary.holderCount}명`);
        if (summary.averageFloor !== null)
            summaryText.push(`평균 ${summary.averageFloor.toFixed(1)}층`);
        summaryText.push(`${Math.round(summary.stuckRatio * 100)}% 물림`);
    }
    if (summary.watcherCount > 0) summaryText.push(`매수 대기 ${summary.watcherCount}명`);

    return (
        <div className="rounded-3xl bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]">
            <div className="p-5 sm:p-6">
                {me && myUserId ? (
                    <MyStatus
                        me={me}
                        myUserId={myUserId}
                        price={price}
                        currency={currency}
                        unit={unit}
                        onEdit={onEdit}
                    />
                ) : (
                    <EmptyStatus onEdit={onEdit} ready={myUserId !== null} />
                )}
            </div>

            <div className="border-t border-[var(--border-subtle)] px-3 py-5 sm:px-4">
                <Building
                    view={view}
                    elevator={elevator}
                    price={price}
                    currency={currency}
                    myFloor={myFloor}
                    myKind={myKind}
                />
                <div className="mt-4">
                    <BuildingLegend />
                </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] px-5 py-3.5 sm:px-6">
                <p className="text-[12px] text-[var(--text-tertiary)]">
                    {summaryText.length > 0
                        ? summaryText.join(" · ")
                        : "아직 등록한 사람이 없어요. 첫 입주민이 되면 이 단면도에 층이 그려집니다."}
                </p>
            </div>
        </div>
    );
}
