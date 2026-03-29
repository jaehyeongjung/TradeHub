"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, activePageAtom } from "@/shared/store/atoms";

interface FundingInfo {
    fundingRate: number;
    nextFundingTime: number;
}

interface TickerInfo {
    volume: number;
    quoteVolume: number;
    high: number;
    low: number;
    priceChange: number;
    priceChangePct: number;
}

interface OpenInterest {
    openInterest: number;
}

interface LongShortRatio {
    longAccount: number;
    shortAccount: number;
}

export default function SimMarketData() {
    const simSymbol = useAtomValue(simSymbolAtom);
    const activePage = useAtomValue(activePageAtom);
    const prices = useAtomValue(simPricesAtom);
    const currentPrice = prices[simSymbol] ?? 0;

    const [funding, setFunding] = useState<FundingInfo | null>(null);
    const [ticker, setTicker] = useState<TickerInfo | null>(null);
    const [oi, setOi] = useState<OpenInterest | null>(null);
    const [lsRatio, setLsRatio] = useState<LongShortRatio | null>(null);
    const [countdown, setCountdown] = useState("");
    const intervalRef = useRef<number | null>(null);

    const fetchAll = useCallback(async () => {
        if (activePage !== "sim") return;
        const sym = simSymbol;
        try {
            const [fundingRes, tickerRes, oiRes, lsRes] = await Promise.all([
                fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`),
                fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${sym}`),
                fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${sym}`),
                fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=5m&limit=1`),
            ]);

            const fundingData = await fundingRes.json();
            if (fundingData?.lastFundingRate) {
                setFunding({ fundingRate: parseFloat(fundingData.lastFundingRate) * 100, nextFundingTime: fundingData.nextFundingTime });
            }

            const tickerData = await tickerRes.json();
            if (tickerData?.volume) {
                setTicker({
                    volume: parseFloat(tickerData.volume),
                    quoteVolume: parseFloat(tickerData.quoteVolume),
                    high: parseFloat(tickerData.highPrice),
                    low: parseFloat(tickerData.lowPrice),
                    priceChange: parseFloat(tickerData.priceChange),
                    priceChangePct: parseFloat(tickerData.priceChangePercent),
                });
            }

            const oiData = await oiRes.json();
            if (oiData?.openInterest) {
                setOi({ openInterest: parseFloat(oiData.openInterest) });
            }

            const lsData = await lsRes.json();
            if (Array.isArray(lsData) && lsData[0]) {
                setLsRatio({ longAccount: parseFloat(lsData[0].longAccount), shortAccount: parseFloat(lsData[0].shortAccount) });
            }
        } catch (e) { console.error("[SimMarketData] fetchAll error:", e); }
    }, [simSymbol, activePage]);

    useEffect(() => {
        if (activePage !== "sim") return;
        fetchAll();
        const id = window.setInterval(fetchAll, 15000);
        return () => clearInterval(id);
    }, [fetchAll, activePage]);

    useEffect(() => {
        if (!funding?.nextFundingTime) return;
        const tick = () => {
            const diff = funding.nextFundingTime - Date.now();
            if (diff <= 0) { setCountdown("00:00:00"); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        intervalRef.current = window.setInterval(tick, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [funding?.nextFundingTime]);

    const formatVolume = (v: number) => {
        if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
        if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
        return `$${v.toFixed(2)}`;
    };

    const longPct = lsRatio ? Math.round(lsRatio.longAccount * 100) : 50;
    const shortPct = 100 - longPct;

    const pct = ticker?.priceChangePct ?? 0;
    const isPosPct = pct >= 0;
    const isFundPos = (funding?.fundingRate ?? 0) >= 0;

    const Item = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
        <div className="flex-1 min-w-0 group cursor-default px-2 py-0.5">
            <div className="text-[10px] text-neutral-600 mb-[3px] whitespace-nowrap">{label}</div>
            <div>{children}</div>
        </div>
    );

    const val = (v: React.ReactNode) => (
        <span className="text-[12.5px] font-mono tabular-nums font-medium text-neutral-200">{v}</span>
    );

    return (
        <div className="flex flex-1 items-center min-w-0">
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-zinc-600/70 to-transparent flex-shrink-0 mx-3" />

            <Item label="24h 변동">
                <span className={`text-[12.5px] font-bold font-mono tabular-nums ${isPosPct ? "text-emerald-400" : "text-red-400"}`}>
                    {ticker ? `${isPosPct ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                </span>
            </Item>

            <Item label="24h 고가">
                {val(ticker ? ticker.high.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—")}
            </Item>

            <Item label="24h 저가">
                {val(ticker ? ticker.low.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—")}
            </Item>

            <Item label="24h 거래대금">
                {val(ticker ? formatVolume(ticker.quoteVolume) : "—")}
            </Item>

            <Item label={
                <span className="flex items-center gap-1">
                    펀딩비
                    {countdown && <span className="text-[9px] text-neutral-700 font-mono">{countdown}</span>}
                </span>
            }>
                <span className={`text-[12.5px] font-bold font-mono tabular-nums ${isFundPos ? "text-emerald-400" : "text-red-400"}`}>
                    {funding ? `${isFundPos ? "+" : ""}${funding.fundingRate.toFixed(4)}%` : "—"}
                </span>
            </Item>

            <Item label="미결제약정">
                {val(oi ? formatVolume(oi.openInterest * currentPrice) : "—")}
            </Item>

            <Item label="롱/숏 비율">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] font-mono font-semibold text-emerald-400">{longPct}%</span>
                    <div className="flex gap-[2px] h-1.5 w-16 items-center">
                        <div className="bg-emerald-500/60 rounded-full h-full transition-all duration-300" style={{ width: `${longPct}%` }} />
                        <div className="bg-red-400/80 rounded-full h-full transition-all duration-300 translate-y-px" style={{ width: `${shortPct}%` }} />
                    </div>
                    <span className="text-[11.5px] font-mono font-semibold text-red-400">{shortPct}%</span>
                </div>
            </Item>
        </div>
    );
}
