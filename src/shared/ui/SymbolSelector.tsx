"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

function getCoinLogoUrl(symbol: string) {
    // 바이낸스 자체 로고 CDN — 상장 코인 커버리지가 넓음. 없는 심볼은 403 반환.
    const base = symbol.toUpperCase().replace(/USDT$/, "");
    // 바이낸스 CDN에 로고가 없는 선물 전용 코인 오버라이드
    if (base === "HYPE") return "https://coin-images.coingecko.com/coins/images/50882/small/hyperliquid.jpg";
    return `https://bin.bnbstatic.com/static/assets/logos/${base}.png`;
}

interface DropdownPos { top: number; left: number; width: number; maxHeight: number }

const DROPDOWN_W = 300;
const EDGE = 8;

/**
 * 트리거 밑에 붙이되 화면 밖으로 나가지 않게 자른다.
 *
 * 폭 300 · left = 트리거 왼쪽을 그대로 쓰면 좁은 화면에서 오른쪽이 잘리고,
 * 아래 공간이 모자라면 목록이 화면 밖으로 흐른다. 그래서 폭은 뷰포트에 맞춰
 * 줄이고, 아래가 좁으면 위로 띄운다.
 */
function measure(rect: DOMRect): DropdownPos {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(DROPDOWN_W, vw - EDGE * 2);
    const left = Math.min(Math.max(EDGE, rect.left), vw - width - EDGE);

    const below = vh - rect.bottom - EDGE * 2;
    const above = rect.top - EDGE * 2;
    // 위가 확실히 넉넉할 때만 뒤집는다 — 평소에는 아래로 여는 쪽이 자연스럽다.
    const flip = below < 260 && above > below;

    return {
        top: flip ? Math.max(EDGE, rect.top - Math.min(above, 420) - EDGE) : rect.bottom + EDGE,
        left,
        width,
        // 검색창(약 62px)을 뺀 목록 높이. 원래 340을 상한으로 둔다.
        maxHeight: Math.max(140, Math.min(340, (flip ? above : below) - 62)),
    };
}

export interface SymbolSelectorProps {
    value: string;
    onChange: (symbol: string) => void;
    symbols: readonly string[];
    symbolNames?: Record<string, string>;
    /** 드롭다운에 실시간 가격 표시 (없으면 숨김) */
    prices?: Record<string, number>;
    changes?: Record<string, number>;
    isLight?: boolean;
}

export function SymbolSelector({
    value,
    onChange,
    symbols,
    symbolNames,
    prices,
    changes,
    isLight = false,
}: SymbolSelectorProps) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: DROPDOWN_W, maxHeight: 340 });
    const [query, setQuery] = useState("");
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const openDropdown = () => {
        if (!buttonRef.current) return;
        setPos(measure(buttonRef.current.getBoundingClientRect()));
        setOpen(true);
    };

    // position:fixed라 스크롤·회전이 일어나면 트리거와 어긋난다. 열려 있는 동안만 따라간다.
    useEffect(() => {
        if (!open) return;
        const reposition = () => {
            if (buttonRef.current) setPos(measure(buttonRef.current.getBoundingClientRect()));
        };
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [open]);

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

    const filtered = symbols.filter((s) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            s.toLowerCase().includes(q) ||
            s.replace("USDT", "").toLowerCase().includes(q) ||
            (symbolNames?.[s] ?? "").toLowerCase().includes(q)
        );
    });

    const currentBase = value.replace("USDT", "");
    const showPrices = !!prices;

    const triggerHover = isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-800/60";
    const dropdownBg = isLight
        ? "bg-white border-neutral-200 shadow-xl"
        : "bg-neutral-950 border-zinc-800 shadow-[0_16px_48px_rgba(0,0,0,0.95)]";
    const searchBg = isLight
        ? "bg-neutral-100 border-neutral-200"
        : "bg-neutral-900 border-zinc-800";
    const itemHover = isLight ? "hover:bg-neutral-50" : "hover:bg-neutral-800/50";
    const labelColor = isLight ? "text-neutral-900" : "text-neutral-100";

    const dropdown = open ? (
        <div
            ref={dropdownRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, width: pos.width }}
            className={`border rounded-2xl overflow-hidden ${dropdownBg}`}
        >
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

            <div className="overflow-y-auto py-1.5 scrollbar-hide" style={{ maxHeight: pos.maxHeight }}>
                {filtered.length === 0 ? (
                    <div className="text-center text-[11px] text-neutral-600 py-8">검색 결과가 없습니다</div>
                ) : (
                    filtered.map((sym) => {
                        const base = sym.replace("USDT", "");
                        const price = prices?.[sym] ?? 0;
                        const change = changes?.[sym] ?? 0;
                        const isPos = change >= 0;
                        const isActive = sym === value;
                        const decimals = price < 1 ? 5 : price < 100 ? 4 : 2;

                        return (
                            <button
                                key={sym}
                                onClick={() => { onChange(sym); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${itemHover} ${isActive ? (isLight ? "bg-amber-50" : "bg-amber-500/5") : ""}`}
                            >
                                <Image
                                    src={getCoinLogoUrl(sym)}
                                    alt={sym}
                                    width={30}
                                    height={30}
                                    className="rounded-full flex-shrink-0"
                                    unoptimized
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                                />
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[13px] font-semibold ${isActive ? "text-amber-500" : labelColor}`}>
                                            {base}
                                        </span>
                                        <span className="text-[10px] text-neutral-500">/ USDT</span>
                                    </div>
                                    {symbolNames?.[sym] && (
                                        <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
                                            {symbolNames[sym]}
                                        </div>
                                    )}
                                </div>
                                {showPrices && (
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
                                )}
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
                    src={getCoinLogoUrl(value)}
                    alt={value}
                    width={26}
                    height={26}
                    className="rounded-full flex-shrink-0"
                    unoptimized
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                />
                <div className="flex items-center gap-1.5">
                    <span className={`text-[15px] font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                        {currentBase}
                    </span>
                    <span className="text-[11px] text-neutral-400">/ USDT</span>
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
