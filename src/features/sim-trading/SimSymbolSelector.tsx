"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";
import { simSymbolAtom, simPricesAtom, simChangesAtom } from "@/shared/store/atoms";
import { SUPPORTED_SYMBOLS, SYMBOL_NAMES } from "@/shared/constants/sim-trading.constants";

function getCoinLogoUrl(symbol: string) {
    const base = symbol.toUpperCase().replace(/USDT$/, "").toLowerCase();
    return `https://assets.coincap.io/assets/icons/${base}@2x.png`;
}

interface DropdownPos { top: number; left: number; }

interface Props {
    isLight?: boolean;
}

export default function SimSymbolSelector({ isLight = false }: Props) {
    const [simSymbol, setSimSymbol] = useAtom(simSymbolAtom);
    const prices = useAtomValue(simPricesAtom);
    const changes = useAtomValue(simChangesAtom);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0 });
    const [query, setQuery] = useState("");
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const openDropdown = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 8, left: rect.left });
        setOpen(true);
    };

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    }, [open]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        function onClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                buttonRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) return;
            setOpen(false);
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            document.addEventListener("mousedown", onClickOutside);
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [open]);

    const filtered = SUPPORTED_SYMBOLS.filter((s) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            s.toLowerCase().includes(q) ||
            s.replace("USDT", "").toLowerCase().includes(q)
        );
    });

    const currentBase = simSymbol.replace("USDT", "");
    const triggerHover = isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-800/60";
    const dropdownBg = isLight
        ? "bg-white border-neutral-200 shadow-xl"
        : "bg-neutral-950 border-zinc-800 shadow-[0_16px_48px_rgba(0,0,0,0.95)]";
    const searchBg = isLight
        ? "bg-neutral-100 border-neutral-200"
        : "bg-neutral-900 border-zinc-800";
    const itemHover = isLight ? "hover:bg-neutral-50" : "hover:bg-neutral-800/50";
    const labelColor = isLight ? "text-neutral-900" : "text-neutral-100";
    const subColor = "text-neutral-500";

    const dropdown = open ? (
        <div
            ref={dropdownRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, width: 300 }}
            className={`border rounded-2xl overflow-hidden ${dropdownBg}`}
        >
            {/* 검색창 */}
            <div className={`p-3 border-b ${isLight ? "border-neutral-100" : "border-zinc-800/60"}`}>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${searchBg}`}>
                    <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="코인 검색 (예: BTC, ETH)"
                        className={`flex-1 bg-transparent text-[12px] outline-none placeholder-neutral-600 ${isLight ? "text-neutral-800" : "text-neutral-200"}`}
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-neutral-500 hover:text-neutral-300">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* 심볼 리스트 */}
            <div className="max-h-[340px] overflow-y-auto py-1.5 scrollbar-hide">
                {filtered.length === 0 ? (
                    <div className="text-center text-[11px] text-neutral-600 py-8">검색 결과가 없습니다</div>
                ) : (
                    filtered.map((sym) => {
                        const base = sym.replace("USDT", "");
                        const price = prices[sym] ?? 0;
                        const change = changes[sym] ?? 0;
                        const isPos = change >= 0;
                        const isActive = sym === simSymbol;
                        const decimals = price < 1 ? 5 : price < 100 ? 4 : 2;

                        return (
                            <button
                                key={sym}
                                onClick={() => { setSimSymbol(sym); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${itemHover} ${isActive ? (isLight ? "bg-amber-50" : "bg-amber-500/5") : ""}`}
                            >
                                <Image
                                    src={getCoinLogoUrl(sym)}
                                    alt={sym}
                                    width={30}
                                    height={30}
                                    className="rounded-full flex-shrink-0"
                                    unoptimized
                                />
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[13px] font-semibold ${isActive ? "text-amber-500" : labelColor}`}>
                                            {base}
                                        </span>
                                        <span className={`text-[10px] ${subColor}`}>/ USDT</span>
                                    </div>
                                    <div className={`text-[10px] ${subColor} mt-0.5 truncate`}>
                                        {SYMBOL_NAMES[sym] ?? "영구 선물"}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className={`text-[12px] font-mono font-medium ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                                        {price > 0
                                            ? price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                                            : "—"}
                                    </div>
                                    <div className={`text-[10px] font-mono font-semibold mt-0.5 ${change !== 0 ? (isPos ? "text-emerald-400" : "text-red-400") : "text-neutral-600"}`}>
                                        {change !== 0 ? `${isPos ? "+" : ""}${change.toFixed(2)}%` : "—"}
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 ml-1" />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={openDropdown}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0 ${triggerHover}`}
            >
                <Image
                    src={getCoinLogoUrl(simSymbol)}
                    alt={simSymbol}
                    width={26}
                    height={26}
                    className="rounded-full flex-shrink-0"
                    unoptimized
                />
                <div className="flex items-center gap-1.5">
                    <span className={`text-[15px] font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                        {currentBase}
                    </span>
                    <span className="text-[11px] text-neutral-400">/ USDT</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-md font-medium">
                        선물
                    </span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {typeof document !== "undefined" && createPortal(dropdown, document.body)}
        </>
    );
}
