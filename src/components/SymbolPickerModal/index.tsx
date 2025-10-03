"use client";

import { useEffect, useState } from "react";

const DEFAULT_SYMBOLS = [
    "btcusdt", // 비트코인
    "ethusdt", // 이더리움
    "bnbusdt", // 바이낸스 코인
    "solusdt", // 솔라나 (최신 레이어 1 강자)
    "xrpusdt", // 리플
    "dogeusdt", // 도지코인 (밈 코인 대표)
    "adausdt", // 카르다노
    "avaxusdt", // 아발란체
    "linkusdt", // 체인링크
    "dotusdt", // 폴카닷
    "ltcusdt", // 라이트코인
    "bchusdt", // 비트코인 캐시
    //"shibusdt", // 시바이누 (주요 밈 코인)
    "suiusdt", // Sui (신규 L1 고성능 코인)
    "aptusdt", // Aptos (신규 L1 고성능 코인)
    "seiusdt", // Sei (웹 3.0 인프라)
    "pepeusdt", // Pepe (밈 코인)
    //"flokiusdt", // Floki (밈 코인)
    "wldusdt", // Worldcoin (AI & Identity)
    "fetusdt", // Fetch.ai

    // ⛓️ DeFi 및 주요 프로토콜
    "uniusdt", // 유니스왑
    "aaveusdt", // Aave

    // 🌐 메타버스 및 게임 (Gaming/Metaverse)
    "galausdt", // Gala
    "axsusdt", // Axie Infinity
    "manausdt", // Decentraland
    "sandusdt", // The Sandbox

    // 💡 기타 고거래량 알트
    "etcusdt", // 이더리움 클래식
    "nearusdt", // 니어 프로토콜
    "atomusdt", // 코스모스
    "imxusdt", // Immutable X (NFT/Gaming L2)
    "beamxusdt", // BeamX (Gaming/DeFi)
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
                    Coin
                </h3>
                <div className="relative">
                    <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white   appearance-none"
                    >
                        {symbols.map((s) => (
                            <option key={s} value={s}>
                                {s.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-2/5 -translate-y-1/2 text-gray-400 text-base">
                        ⌄
                    </span>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-gray-200 cursor-pointer"
                    >
                        Cancle
                    </button>
                    <button
                        onClick={() => {
                            onSelect(value);
                            onClose();
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white cursor-pointer"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
