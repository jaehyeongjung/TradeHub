"use client";

import { motion } from "framer-motion";
import type { Currency, FloorWindow, ResidentKind } from "./floor";
import { formatNative } from "./floor";

/** 층 높이. 엘리베이터 위치를 소수 층에 정확히 놓기 위해 행 높이를 고정한다. */
const ROW_H = 34;

type Props = {
    view: FloorWindow;
    /** 소수 층 (8.4 = 8층과 9층 사이) */
    elevator: number;
    price: number;
    currency: Currency;
    myFloor: number | null;
    myKind: ResidentKind | null;
};

function toneOf(floor: number, elevatorFloor: number): string {
    if (floor > elevatorFloor) return "var(--color-down)";
    if (floor < elevatorFloor) return "var(--color-up)";
    return "var(--text-tertiary)";
}

function OverflowRow({
    label,
    holders,
    watchers,
}: {
    label: string;
    holders: number;
    watchers: number;
}) {
    if (holders + watchers === 0) return null;
    return (
        <div className="flex h-6 items-center gap-2 pl-11 text-[11px] text-[var(--text-muted)]">
            <span className="h-px w-3 bg-[var(--border-default)]" />
            <span>
                {label} {holders + watchers}명
            </span>
        </div>
    );
}

export function Building({ view, elevator, price, currency, myFloor, myKind }: Props) {
    const elevatorFloor = Math.floor(elevator);
    // 층 f의 칸은 위에서 (top - f)번째. 칸 안에서의 소수 위치만큼 아래로 내린다.
    const lineTop = (view.top + 1 - elevator) * ROW_H;
    const clampedTop = Math.max(0, Math.min(view.rows.length * ROW_H, lineTop));

    return (
        <div>
            <OverflowRow
                label={`${view.top}층 위에`}
                holders={view.above.holders}
                watchers={view.above.watchers}
            />

            <div className="relative" style={{ height: view.rows.length * ROW_H }}>
                {view.rows.map((row) => {
                    const total = row.holders + row.watchers;
                    const isMine = myFloor === row.floor;
                    const color = toneOf(row.floor, elevatorFloor);

                    return (
                        <div
                            key={row.floor}
                            className="absolute inset-x-0 flex items-center"
                            style={{ top: (view.top - row.floor) * ROW_H, height: ROW_H }}
                        >
                            {isMine && (
                                <div
                                    className="absolute inset-y-[2px] inset-x-0 rounded-lg"
                                    style={{ background: "var(--surface-input)" }}
                                />
                            )}

                            <span
                                className={`relative z-10 w-11 shrink-0 pr-2.5 text-right text-[11px] tabular-nums ${
                                    isMine
                                        ? "font-bold text-[var(--text-primary)]"
                                        : total > 0
                                          ? "text-[var(--text-tertiary)]"
                                          : "text-[var(--text-disabled)]"
                                }`}
                            >
                                {row.floor}층
                            </span>

                            <span className="relative z-10 flex h-2.5 flex-1 items-center gap-[2px]">
                                {row.holders > 0 && (
                                    <motion.span
                                        className="h-full rounded-[3px]"
                                        style={{ background: color, opacity: isMine ? 1 : 0.72 }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(row.holders / view.max) * 100}%` }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                )}
                                {row.watchers > 0 && (
                                    <motion.span
                                        className="h-full rounded-[3px]"
                                        style={{
                                            background: "var(--color-info)",
                                            opacity: isMine ? 1 : 0.72,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(row.watchers / view.max) * 100}%` }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                )}
                            </span>

                            <span className="relative z-10 flex w-16 shrink-0 items-center justify-end gap-1 pr-1 text-[11px] tabular-nums">
                                {isMine && (
                                    <span className="rounded-md bg-[var(--color-accent)] px-1.5 py-[1px] text-[9px] font-bold leading-tight text-black">
                                        {myKind === "watcher" ? "대기" : "나"}
                                    </span>
                                )}
                                {row.holders > 0 && (
                                    <span className="text-[var(--text-secondary)]">{row.holders}</span>
                                )}
                                {row.watchers > 0 && (
                                    <span style={{ color: "var(--color-info)" }}>+{row.watchers}</span>
                                )}
                            </span>
                        </div>
                    );
                })}

                {/* 엘리베이터 = 현재가. 이모지 대신 1px 선과 가격 캡슐로 표시한다. */}
                <motion.div
                    className="pointer-events-none absolute inset-x-0 flex items-center"
                    style={{ marginTop: -9 }}
                    initial={false}
                    animate={{ top: clampedTop }}
                    transition={{ type: "spring", stiffness: 130, damping: 22 }}
                >
                    <span className="ml-11 h-px flex-1 bg-[var(--text-disabled)]" />
                    <span className="ml-1.5 rounded-full bg-[var(--surface-hover)] px-2 py-[3px] text-[10px] font-bold leading-none tabular-nums text-[var(--text-primary)]">
                        {formatNative(price, currency)}
                    </span>
                </motion.div>
            </div>

            <OverflowRow
                label={`${view.bottom}층 아래에`}
                holders={view.below.holders}
                watchers={view.below.watchers}
            />
        </div>
    );
}

export function BuildingLegend() {
    const items = [
        { color: "var(--color-down)", label: "물린 주주" },
        { color: "var(--color-up)", label: "수익 구간" },
        { color: "var(--color-info)", label: "매수 대기" },
    ];
    return (
        <div className="flex items-center gap-3.5 pl-11 text-[10px] text-[var(--text-muted)]">
            {items.map((i) => (
                <span key={i.label} className="flex items-center gap-1.5">
                    <span
                        className="h-[3px] w-3 rounded-full"
                        style={{ background: i.color, opacity: 0.8 }}
                    />
                    {i.label}
                </span>
            ))}
        </div>
    );
}
