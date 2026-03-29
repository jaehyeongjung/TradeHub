"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "@/shared/hooks/useTheme";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const DEFAULT_SYMBOLS = [
    "1inchusdt", "aaveusdt", "adausdt", "agixusdt", "algousdt",
    "ankrusdt", "apeusdt", "aptusdt", "arbusdt", "arkusdt",
    "arkmusdt", "arumbusdt", "atomusdt", "avaxusdt", "axsusdt",
    "bchusdt", "beamxusdt", "blurusdt", "bnbusdt", "bonkusdt",
    "btcusdt", "celousdt", "chzusdt", "ckbusdt", "crvusdt",
    "dogeusdt", "dotusdt", "dydusdt", "egldusdt", "enjusdt",
    "ensusdt", "eosusdt", "etcusdt", "ethusdt", "fetusdt",
    "filusdt", "flokiusdt", "flowusdt", "ftmusdt", "galausdt",
    "grtusdt", "hbarusdt", "idexusdt", "imxusdt", "injusdt",
    "iostusdt", "iotausdt", "iotxusdt", "jasmyusdt", "jupusdt",
    "kasusdt", "kavausdt", "kncusdt", "ksmusdt", "ldousdt",
    "linkusdt", "lrcusdt", "ltcusdt", "lunausdt", "manausdt",
    "maskusdt", "maticusdt", "maviausdt", "metisusdt", "minausdt",
    "mkrusdt", "nearusdt", "neousdt", "notusdt", "oceanusdt",
    "omgusdt", "ondousdt", "opusdt", "ordiusdt", "paxgusdt",
    "pendleusdt", "pepeusdt", "pythusdt", "qtumusdt", "rdntusdt",
    "renderusdt", "rswfusdt", "runeusdt", "rvnusdt", "sandusdt",
    "seiusdt", "shibusdt", "snxusdt", "solusdt", "stiusdt",
    "stjusdt", "stxusdt", "suiusdt", "thetausdt", "tiausdt",
    "tonusdt", "trxusdt", "uniusdt", "vetusdt", "wavesusdt",
    "wicpusdt", "wldusdt", "woousdt", "xrpusdt", "xtzusdt",
    "zecusdt", "zenusdt", "zilusdt", "zrxusdt",
];

const POPULAR_SYMBOLS = [
    "btcusdt", "ethusdt", "bnbusdt", "xrpusdt", "solusdt",
    "dogeusdt", "adausdt", "avaxusdt", "dotusdt", "maticusdt",
];

const SYMBOL_NAMES: Record<string, string> = {
    "1inchusdt": "1inch",
    "aaveusdt": "Aave",
    "adausdt": "Cardano",
    "agixusdt": "SingularityNET",
    "algousdt": "Algorand",
    "ankrusdt": "Ankr",
    "apeusdt": "ApeCoin",
    "aptusdt": "Aptos",
    "arbusdt": "Arbitrum",
    "arkusdt": "ARK",
    "arkmusdt": "Arkham",
    "arumbusdt": "Arweave",
    "atomusdt": "Cosmos",
    "avaxusdt": "Avalanche",
    "axsusdt": "Axie Infinity",
    "bchusdt": "Bitcoin Cash",
    "beamxusdt": "BeamX",
    "blurusdt": "Blur",
    "bnbusdt": "BNB",
    "bonkusdt": "Bonk",
    "btcusdt": "Bitcoin",
    "celousdt": "Celo",
    "chzusdt": "Chiliz",
    "ckbusdt": "Nervos",
    "crvusdt": "Curve",
    "dogeusdt": "Dogecoin",
    "dotusdt": "Polkadot",
    "dydusdt": "dYdX",
    "egldusdt": "MultiversX",
    "enjusdt": "Enjin",
    "ensusdt": "ENS",
    "eosusdt": "EOS",
    "etcusdt": "Ethereum Classic",
    "ethusdt": "Ethereum",
    "fetusdt": "Fetch.ai",
    "filusdt": "Filecoin",
    "flokiusdt": "Floki",
    "flowusdt": "Flow",
    "ftmusdt": "Fantom",
    "galausdt": "Gala",
    "grtusdt": "The Graph",
    "hbarusdt": "Hedera",
    "idexusdt": "IDEX",
    "imxusdt": "Immutable X",
    "injusdt": "Injective",
    "iostusdt": "IOST",
    "iotausdt": "IOTA",
    "iotxusdt": "IoTeX",
    "jasmyusdt": "Jasmy",
    "jupusdt": "Jupiter",
    "kasusdt": "Kaspa",
    "kavausdt": "Kava",
    "kncusdt": "Kyber",
    "ksmusdt": "Kusama",
    "ldousdt": "Lido DAO",
    "linkusdt": "Chainlink",
    "lrcusdt": "Loopring",
    "ltcusdt": "Litecoin",
    "lunausdt": "Terra",
    "manausdt": "Decentraland",
    "maskusdt": "Mask",
    "maticusdt": "Polygon",
    "maviausdt": "Mavia",
    "metisusdt": "Metis",
    "minausdt": "Mina",
    "mkrusdt": "Maker",
    "nearusdt": "NEAR",
    "neousdt": "NEO",
    "notusdt": "Notcoin",
    "oceanusdt": "Ocean",
    "omgusdt": "OMG",
    "ondousdt": "Ondo",
    "opusdt": "Optimism",
    "ordiusdt": "ORDI",
    "paxgusdt": "PAX Gold",
    "pendleusdt": "Pendle",
    "pepeusdt": "Pepe",
    "pythusdt": "Pyth",
    "qtumusdt": "QTUM",
    "rdntusdt": "Radiant",
    "renderusdt": "Render",
    "rswfusdt": "Raydium",
    "runeusdt": "THORChain",
    "rvnusdt": "Ravencoin",
    "sandusdt": "Sandbox",
    "seiusdt": "Sei",
    "shibusdt": "Shiba Inu",
    "snxusdt": "Synthetix",
    "solusdt": "Solana",
    "stiusdt": "SingularityDAO",
    "stjusdt": "Stratis",
    "stxusdt": "Stacks",
    "suiusdt": "Sui",
    "thetausdt": "Theta",
    "tiausdt": "Celestia",
    "tonusdt": "Toncoin",
    "trxusdt": "TRON",
    "uniusdt": "Uniswap",
    "vetusdt": "VeChain",
    "wavesusdt": "Waves",
    "wicpusdt": "ICP",
    "wldusdt": "Worldcoin",
    "woousdt": "WOO",
    "xrpusdt": "XRP",
    "xtzusdt": "Tezos",
    "zecusdt": "Zcash",
    "zenusdt": "Horizen",
    "zilusdt": "Zilliqa",
    "zrxusdt": "0x",
};

function getCoinLogoUrl(symbol: string) {
    const base = symbol.replace(/usdt$/i, "").toLowerCase();
    return `https://assets.coincap.io/assets/icons/${base}@2x.png`;
}

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
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(initialSymbol.toLowerCase());
    const isLight = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setSelected(initialSymbol.toLowerCase());
            setSearch("");
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [open, initialSymbol]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const filteredSymbols = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return symbols;
        return symbols.filter((s) => {
            const name = SYMBOL_NAMES[s]?.toLowerCase() ?? "";
            return s.toLowerCase().includes(q) || name.includes(q);
        });
    }, [search, symbols]);

    const popularFiltered = useMemo(() => {
        if (search.trim()) return [];
        return POPULAR_SYMBOLS.filter((s) => symbols.includes(s));
    }, [search, symbols]);

    const otherSymbols = useMemo(() => {
        if (search.trim()) return filteredSymbols;
        return filteredSymbols.filter((s) => !POPULAR_SYMBOLS.includes(s));
    }, [search, filteredSymbols]);

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        onClose();
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative w-full max-w-[460px] h-[72vh] rounded-3xl overflow-hidden flex flex-col ${
                            isLight
                                ? "bg-white border border-neutral-200 shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
                                : "bg-neutral-950 border border-zinc-800 shadow-[0_32px_80px_rgba(0,0,0,0.9)]"
                        }`}
                    >
                        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
                            <div className={`w-8 h-1 rounded-full ${isLight ? "bg-neutral-300" : "bg-zinc-700"}`} />
                        </div>

                        <div className="flex-shrink-0 px-5 pt-4 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className={`text-[17px] font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>코인 선택</h2>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">{symbols.length}개 코인 지원</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                        isLight
                                            ? "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                                            : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-colors ${
                                isLight
                                    ? "bg-neutral-50 border-neutral-200 focus-within:border-neutral-400"
                                    : "bg-neutral-900 border-zinc-800 focus-within:border-zinc-600"
                            }`}>
                                <svg className="w-4 h-4 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="코인 이름 또는 심볼 검색"
                                    className={`flex-1 bg-transparent text-[13px] outline-none ${isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-600"}`}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">

                            {popularFiltered.length > 0 && (
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">인기</span>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                        {popularFiltered.map((s) => {
                                            const base = s.replace("usdt", "").toUpperCase();
                                            const isActive = selected === s;
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => handleSelect(s)}
                                                    className={`flex-shrink-0 flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-2xl border transition-all cursor-pointer ${
                                                        isActive
                                                            ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                                                            : isLight
                                                                ? "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100"
                                                                : "bg-neutral-900 border-zinc-800 text-neutral-300 hover:border-zinc-600 hover:bg-neutral-800/60"
                                                    }`}
                                                >
                                                    <Image
                                                        src={getCoinLogoUrl(s)}
                                                        alt={s}
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full flex-shrink-0"
                                                        unoptimized
                                                    />
                                                    <span className="text-[12px] font-semibold">{base}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                {!search.trim() && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        <span className="text-[11px] font-semibold text-neutral-500 tracking-wider uppercase">전체</span>
                                        <span className={`text-[10px] font-mono ${isLight ? "text-neutral-400" : "text-neutral-700"}`}>{otherSymbols.length}개</span>
                                    </div>
                                )}

                                {search.trim() && filteredSymbols.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-900 border-zinc-800"}`}>
                                            <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-[14px] font-semibold ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>결과 없음</p>
                                            <p className="text-[12px] text-neutral-400 mt-1">다른 검색어를 입력해보세요</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {otherSymbols.map((s) => {
                                            const base = s.replace("usdt", "").toUpperCase();
                                            const name = SYMBOL_NAMES[s] || base;
                                            const isActive = selected === s;
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => handleSelect(s)}
                                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                                                        isActive
                                                            ? "bg-amber-500/8 border border-amber-500/20"
                                                            : isLight
                                                                ? "border border-transparent hover:bg-neutral-50"
                                                                : "border border-transparent hover:bg-neutral-900"
                                                    }`}
                                                >
                                                    <div className="relative w-9 h-9 flex-shrink-0">
                                                        <Image
                                                            src={getCoinLogoUrl(s)}
                                                            alt={s}
                                                            fill
                                                            className="object-contain rounded-full"
                                                            unoptimized
                                                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <div className={`text-[14px] font-semibold leading-tight ${isActive ? "text-amber-500" : isLight ? "text-neutral-900" : "text-white"}`}>
                                                            {base}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-500 mt-0.5 truncate">{name}</div>
                                                    </div>
                                                    {isActive ? (
                                                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <svg className={`w-4 h-4 flex-shrink-0 ${isLight ? "text-neutral-300" : "text-neutral-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`flex-shrink-0 px-5 py-3 border-t backdrop-blur-sm ${
                            isLight
                                ? "border-neutral-200 bg-white/90"
                                : "border-zinc-800/60 bg-neutral-950/80"
                        }`}>
                            <div className="flex items-center gap-2.5">
                                <div className="relative w-5 h-5 flex-shrink-0">
                                    <Image
                                        src={getCoinLogoUrl(selected)}
                                        alt={selected}
                                        fill
                                        className="object-contain rounded-full"
                                        unoptimized
                                    />
                                </div>
                                <span className="text-[12px] text-neutral-500">현재 선택</span>
                                <span className="text-[12px] font-semibold text-amber-500">
                                    {selected.replace("usdt", "").toUpperCase()}
                                </span>
                                <span className={`text-[11px] ${isLight ? "text-neutral-400" : "text-neutral-600"}`}>
                                    · {SYMBOL_NAMES[selected] ?? ""}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
