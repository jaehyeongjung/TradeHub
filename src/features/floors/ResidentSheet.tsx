"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Currency, ResidentKind } from "./floor";
import { floorOf, formatNative, formatSignedPercent, pnlPercent } from "./floor";
import type { Resident } from "./useResidents";

type Props = {
    open: boolean;
    onClose: () => void;
    koreanName: string;
    currency: Currency;
    unit: number;
    /** 표시 통화 기준 현재가 */
    price: number;
    current: Resident | null;
    onSave: (kind: ResidentKind, price: number) => Promise<boolean>;
    onRemove: () => Promise<boolean>;
};

/** 오타 방어. 현재가와 자릿수가 다르게 들어간 값만 걸러낸다. */
const MIN_RATIO = 0.05;
const MAX_RATIO = 20;

function groupDigits(raw: string): string {
    const [int, ...rest] = raw.split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return rest.length ? `${grouped}.${rest.join("")}` : grouped;
}

export function ResidentSheet({
    open,
    onClose,
    koreanName,
    currency,
    unit,
    price,
    current,
    onSave,
    onRemove,
}: Props) {
    const [kind, setKind] = useState<ResidentKind>("holder");
    const [raw, setRaw] = useState("");
    const [busy, setBusy] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 열 때마다 현재 상태를 초기값으로 되돌린다
    useEffect(() => {
        if (!open) return;
        setKind(current?.kind ?? "holder");
        setRaw(current ? String(current.price) : "");
        setBusy(false);
        const t = setTimeout(() => inputRef.current?.focus(), 260);
        return () => clearTimeout(t);
    }, [open, current]);

    useEffect(() => {
        if (!open) return;
        document.body.classList.add("overflow-hidden");
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.classList.remove("overflow-hidden");
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const value = Number(raw);
    const filled = raw.length > 0 && Number.isFinite(value) && value > 0;
    const tooFar = filled && (value < price * MIN_RATIO || value > price * MAX_RATIO);
    const valid = filled && !tooFar;

    const floor = filled ? floorOf(value, unit) : null;
    const pnl = filled ? pnlPercent(price, value) : 0;
    const buyableNow = kind === "watcher" && filled && value >= price;

    const submit = async () => {
        if (!valid || busy) return;
        setBusy(true);
        const ok = await onSave(kind, value);
        setBusy(false);
        if (ok) onClose();
    };

    const priceLabel = kind === "holder" ? "평균 매수가" : "매수하고 싶은 가격";

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
                    <motion.div
                        className="absolute inset-0 bg-black/55"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${koreanName} 층 등록`}
                        className="relative w-full max-w-[440px] rounded-t-[28px] bg-[var(--surface-card)] px-5 pb-7 pt-3 shadow-2xl sm:rounded-[28px] sm:px-6 sm:pb-6"
                        initial={{ y: "100%", opacity: 0.6 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0.6 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    >
                        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--border-strong)] sm:hidden" />

                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-[17px] font-bold tracking-tight text-[var(--text-primary)]">
                                    {current ? "내 층 수정" : `${koreanName} 입주하기`}
                                </h2>
                                <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                                    수량은 받지 않아요. 가격 하나로 층이 정해집니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="닫기"
                                className="-mr-2 -mt-1 rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-input)] hover:text-[var(--text-secondary)] cursor-pointer"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        {/* 보유자 / 예비 입주민 */}
                        <div className="mt-5 grid grid-cols-2 gap-2">
                            {(
                                [
                                    { k: "holder", title: "보유 중", desc: "이미 들어왔어요" },
                                    { k: "watcher", title: "매수 대기", desc: "아직 안 샀어요" },
                                ] as const
                            ).map((opt) => {
                                const on = kind === opt.k;
                                return (
                                    <button
                                        key={opt.k}
                                        type="button"
                                        onClick={() => setKind(opt.k)}
                                        aria-pressed={on}
                                        className={`rounded-2xl px-4 py-3 text-left transition-all cursor-pointer ${
                                            on
                                                ? "bg-[var(--surface-input)] ring-2 ring-[var(--color-accent)]"
                                                : "bg-[var(--surface-input)] ring-1 ring-transparent hover:ring-[var(--border-default)]"
                                        }`}
                                    >
                                        <div
                                            className={`text-[14px] font-bold ${
                                                on
                                                    ? "text-[var(--text-primary)]"
                                                    : "text-[var(--text-tertiary)]"
                                            }`}
                                        >
                                            {opt.title}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                                            {opt.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 가격 입력 */}
                        <div className="mt-6">
                            <label
                                htmlFor="resident-price"
                                className="text-[12px] font-medium text-[var(--text-tertiary)]"
                            >
                                {priceLabel}
                            </label>
                            <div
                                className={`mt-2 flex items-baseline gap-2 border-b-2 pb-2 transition-colors ${
                                    tooFar
                                        ? "border-[var(--color-down)]"
                                        : filled
                                          ? "border-[var(--color-accent)]"
                                          : "border-[var(--border-default)]"
                                }`}
                            >
                                {currency === "USD" && (
                                    <span className="text-[24px] font-bold text-[var(--text-tertiary)]">
                                        $
                                    </span>
                                )}
                                <input
                                    id="resident-price"
                                    ref={inputRef}
                                    value={currency === "KRW" ? groupDigits(raw) : raw}
                                    onChange={(e) => {
                                        const cleaned = e.target.value
                                            .replace(/,/g, "")
                                            .replace(currency === "KRW" ? /[^0-9]/g : /[^0-9.]/g, "");
                                        setRaw(cleaned);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void submit();
                                    }}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    className="min-w-0 flex-1 bg-transparent text-[28px] font-bold tabular-nums text-[var(--text-primary)] placeholder-[var(--text-disabled)] outline-none"
                                />
                                {currency === "KRW" && (
                                    <span className="text-[18px] font-bold text-[var(--text-tertiary)]">
                                        원
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 min-h-[20px] text-[12px]">
                                {tooFar ? (
                                    <span className="text-[var(--color-down)]">
                                        현재가 {formatNative(price, currency)}와 차이가 너무 커요.
                                        자릿수를 확인해주세요.
                                    </span>
                                ) : filled && floor !== null ? (
                                    <span className="text-[var(--text-secondary)]">
                                        <strong className="font-bold text-[var(--text-primary)]">
                                            {floor}층
                                        </strong>
                                        {kind === "holder" ? (
                                            <>
                                                {" · 평가손익 "}
                                                <strong
                                                    className="font-bold"
                                                    style={{
                                                        color:
                                                            pnl >= 0
                                                                ? "var(--color-up)"
                                                                : "var(--color-down)",
                                                    }}
                                                >
                                                    {formatSignedPercent(pnl)}
                                                </strong>
                                            </>
                                        ) : buyableNow ? (
                                            " · 지금 바로 살 수 있는 가격이에요"
                                        ) : (
                                            ` · 현재가보다 ${Math.abs(pnl).toFixed(1)}% 아래`
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-[var(--text-muted)]">
                                        현재가 {formatNative(price, currency)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={submit}
                            disabled={!valid || busy}
                            className={`mt-5 w-full rounded-2xl py-4 text-[15px] font-bold transition-all ${
                                valid && !busy
                                    ? "bg-[var(--color-accent-strong)] text-white hover:opacity-90 cursor-pointer"
                                    : "bg-[var(--surface-input)] text-[var(--text-disabled)] cursor-not-allowed"
                            }`}
                        >
                            {busy ? "저장 중" : current ? "수정하기" : kind === "holder" ? "입주하기" : "대기 등록"}
                        </button>

                        {current && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (busy) return;
                                    setBusy(true);
                                    const ok = await onRemove();
                                    setBusy(false);
                                    if (ok) onClose();
                                }}
                                className="mt-3 w-full py-2 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] cursor-pointer"
                            >
                                {current.kind === "holder" ? "팔았어요 (퇴거)" : "대기 취소"}
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
