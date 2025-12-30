"use client";

import { useEffect, useState } from "react";

const DEFAULT_SYMBOLS = [
    "1inchusdt", // 1inch
    "aaveusdt", // Aave
    "adausdt", // Cardano
    "agixusdt", // SingularityNET
    "algousdt", // Algorand
    "ankrusdt", // Ankr
    "apeusdt", // ApeCoin
    "aptusdt", // Aptos
    "arbusdt", // Arbitrum
    "arkmusdt", // Arkham
    "arumbusdt", // Arweave
    "atomusdt", // Cosmos
    "avaxusdt", // Avalanche
    "axsusdt", // Axie Infinity
    "bchusdt", // Bitcoin Cash
    "beamxusdt", // BeamX
    "blurusdt", // Blur
    "bnbusdt", // Binance Coin
    "bonkusdt", // Bonk (밈)
    "btcusdt", // Bitcoin
    "celousdt", // Celo
    "chzusdt", // Chiliz
    "ckbusdt", // Nervos Network
    "crvusdt", // Curve
    "dogeusdt", // Dogecoin
    "dotusdt", // Polkadot
    "dydusdt", // dYdX
    "egldusdt", // MultiversX
    "enjusdt", // Enjin
    "ensusdt", // ENS
    "eosusdt", // EOS
    "etcusdt", // Ethereum Classic
    "ethusdt", // Ethereum
    "fetusdt", // Fetch.ai
    "filusdt", // Filecoin
    "flokiusdt", // Floki
    "flowusdt", // Flow
    "ftmusdt", // Fantom
    "galausdt", // Gala
    "grtusdt", // The Graph
    "hbarusdt", // Hedera
    "idexusdt", // IDEX
    "imxusdt", // Immutable X
    "injusdt", // Injective
    "iostusdt", // IOST
    "iotausdt", // IOTA
    "iotxusdt", // IoTeX
    "jasmyusdt", // Jasmy
    "jupusdt", // Jupiter
    "kasusdt", // Kaspa
    "kavausdt", // Kava
    "kncusdt", // Kyber Network
    "ksmusdt", // Kusama
    "ldousdt", // Lido DAO
    "linkusdt", // Chainlink
    "lrcusdt", // Loopring
    "ltcusdt", // Litecoin
    "lunausdt", // Terra
    "manausdt", // Decentraland
    "maskusdt", // Mask Network
    "maticusdt", // Polygon
    "maviausdt", // Mavia
    "metisusdt", // Metis
    "minausdt", // Mina
    "mkrusdt", // Maker
    "nearusdt", // Near Protocol
    "neousdt", // NEO
    "notusdt", // Notcoin
    "oceanusdt", // Ocean Protocol
    "omgusdt", // OMG Network
    "ondousdt", // Ondo (RWA)
    "opusdt", // Optimism
    "ordiusdt", // ORDI
    "paxgusdt", // PAX Gold
    "pendleusdt", // Pendle
    "pepeusdt", // Pepe
    "pythusdt", // Pyth Network
    "qtumusdt", // QTUM
    "rdntusdt", // Radiant Capital
    "renderusdt", // Render
    "rswfusdt", // Raydium
    "runeusdt", // THORChain
    "rvnusdt", // Ravencoin
    "sandusdt", // The Sandbox
    "seiusdt", // Sei
    "shibusdt", // Shiba Inu
    "snxusdt", // Synthetix
    "solusdt", // Solana
    "stiusdt", // SingularityDAO
    "stjusdt", // Stratis
    "stxusdt", // Stacks
    "suiusdt", // Sui
    "thetausdt", // Theta
    "tiausdt", // Celestia
    "tonusdt", // Toncoin
    "trxusdt", // TRON
    "uniusdt", // Uniswap
    "vetusdt", // VeChain
    "wavesusdt", // Waves
    "wicpusdt", // Internet Computer (ICP)
    "wldusdt", // Worldcoin
    "woousdt", // WOO Network
    "xrpusdt", // Ripple
    "xtzusdt", // Tezos
    "zecusdt", // Zcash
    "zenusdt", // Horizen
    "zilusdt", // Zilliqa
    "zrxusdt", // Ox
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
