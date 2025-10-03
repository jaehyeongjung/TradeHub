"use client";

import { useEffect, useState } from "react";

const DEFAULT_SYMBOLS = [
    "btcusdt",
    "ethusdt",
    "xrpusdt",
    "solusdt",
    "dogeusdt",
    "adausdt",
    "avaxusdt",
    "linkusdt",
];

type Props = {
    open: boolean;
    initialSymbol: string;
    onClose: () => void;
    onSelect: (symbol: string) => void;
    symbols?: string[];
};

export default function SymbolPickerModal({
    open,
    initialSymbol,
    onClose,
    onSelect,
    symbols = DEFAULT_SYMBOLS,
}: Props) {
    const [value, setValue] = useState(initialSymbol);

    useEffect(() => {
        if (open) setValue(initialSymbol);
    }, [open, initialSymbol]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            {/* panel */}
            <div className="relative w-[320px] rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-xl">
                <h3 className="mb-3 text-base font-semibold text-white">
                    코인 선택
                </h3>
                <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                >
                    {symbols.map((s) => (
                        <option key={s} value={s}>
                            {s.toUpperCase()}
                        </option>
                    ))}
                </select>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-gray-200"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            onSelect(value);
                            onClose();
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
