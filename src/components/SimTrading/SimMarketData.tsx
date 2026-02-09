"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, activePageAtom } from "@/store/atoms";

function useTheme() {
    const [isLight, setIsLight] = useState(false);
    useEffect(() => {
        const html = document.documentElement;
        setIsLight(html.classList.contains("light"));
        const observer = new MutationObserver(() => {
            setIsLight(html.classList.contains("light"));
        });
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);
    return isLight;
}

interface FundingInfo {
    fundingRate: number;
    nextFundingTime: number;
}

interface TickerInfo {
    volume: number;        // 24h 거래량 (코인)
    quoteVolume: number;   // 24h 거래대금 (USDT)
    high: number;          // 24h 고가
    low: number;           // 24h 저가
    priceChange: number;   // 24h 변동
    priceChangePct: number;// 24h 변동률
}

interface OpenInterest {
    openInterest: number;  // 미결제약정 (코인)
    openInterestUsdt: number;
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
    const isLight = useTheme();

    const [funding, setFunding] = useState<FundingInfo | null>(null);
    const [ticker, setTicker] = useState<TickerInfo | null>(null);
    const [oi, setOi] = useState<OpenInterest | null>(null);
    const [lsRatio, setLsRatio] = useState<LongShortRatio | null>(null);
    const [countdown, setCountdown] = useState("");
    const intervalRef = useRef<number | null>(null);

    const coinName = simSymbol.replace("USDT", "");

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
                setFunding({
                    fundingRate: parseFloat(fundingData.lastFundingRate) * 100,
                    nextFundingTime: fundingData.nextFundingTime,
                });
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
                const oiVal = parseFloat(oiData.openInterest);
                setOi({
                    openInterest: oiVal,
                    openInterestUsdt: oiVal * (prices[sym] || 0),
                });
            }

            const lsData = await lsRes.json();
            if (Array.isArray(lsData) && lsData[0]) {
                setLsRatio({
                    longAccount: parseFloat(lsData[0].longAccount),
                    shortAccount: parseFloat(lsData[0].shortAccount),
                });
            }
        } catch {}
    }, [simSymbol, activePage, prices]);

    // 초기 로드 + 15초 폴링
    useEffect(() => {
        if (activePage !== "sim") return;
        fetchAll();
        const id = window.setInterval(fetchAll, 15000);
        return () => clearInterval(id);
    }, [fetchAll, activePage]);

    // 펀딩비 카운트다운
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
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [funding?.nextFundingTime]);

    const formatVolume = (v: number) => {
        if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
        return v.toFixed(2);
    };

    const longPct = lsRatio ? Math.round(lsRatio.longAccount * 100) : 50;
    const shortPct = 100 - longPct;

    const labelCls = `text-[11px] mb-0.5 ${isLight ? "text-neutral-500" : "text-neutral-400"}`;
    const valueCls = `text-[13px] font-mono tabular-nums font-medium ${isLight ? "text-neutral-900" : "text-white"}`;

    return (
        <div className={`rounded-2xl border px-5 py-3.5 ${isLight ? "bg-white border-neutral-200" : "bg-neutral-950 border-zinc-800"}`}>
            <div className="grid grid-cols-7 gap-4">
                {/* 24h 변동 */}
                <div>
                    <div className={labelCls}>24h 변동</div>
                    <div className={`text-[13px] font-bold font-mono tabular-nums ${(ticker?.priceChangePct ?? 0) >= 0 ? (isLight ? "text-emerald-600" : "text-emerald-400") : (isLight ? "text-red-600" : "text-red-400")}`}>
                        {ticker ? `${ticker.priceChangePct >= 0 ? "+" : ""}${ticker.priceChangePct.toFixed(2)}%` : "—"}
                    </div>
                </div>

                {/* 24h 고가 */}
                <div>
                    <div className={labelCls}>24h 고가</div>
                    <div className={valueCls}>
                        {ticker ? ticker.high.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}
                    </div>
                </div>

                {/* 24h 저가 */}
                <div>
                    <div className={labelCls}>24h 저가</div>
                    <div className={valueCls}>
                        {ticker ? ticker.low.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}
                    </div>
                </div>

                {/* 24h 거래대금 */}
                <div>
                    <div className={labelCls}>24h 거래대금</div>
                    <div className={valueCls}>
                        {ticker ? `$${formatVolume(ticker.quoteVolume)}` : "—"}
                    </div>
                </div>

                {/* 펀딩비 */}
                <div>
                    <div className={labelCls}>펀딩비 / {countdown || "—"}</div>
                    <div className={`text-[13px] font-bold font-mono tabular-nums ${(funding?.fundingRate ?? 0) >= 0 ? (isLight ? "text-emerald-600" : "text-emerald-400") : (isLight ? "text-red-600" : "text-red-400")}`}>
                        {funding ? `${funding.fundingRate >= 0 ? "+" : ""}${funding.fundingRate.toFixed(4)}%` : "—"}
                    </div>
                </div>

                {/* 미결제약정 */}
                <div>
                    <div className={labelCls}>미결제약정</div>
                    <div className={valueCls}>
                        {oi ? `$${formatVolume(oi.openInterest * currentPrice)}` : "—"}
                    </div>
                </div>

                {/* 롱/숏 비율 */}
                <div>
                    <div className={labelCls}>롱/숏 비율</div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[12px] font-mono font-medium ${isLight ? "text-emerald-600" : "text-emerald-400"}`}>{longPct}%</span>
                        <div className="flex-1 flex gap-[2px] h-1.5">
                            <div className="bg-emerald-500/60 rounded-full transition-all duration-300" style={{ width: `${longPct}%` }} />
                            <div className="bg-red-400/80 rounded-full transition-all duration-300" style={{ width: `${shortPct}%` }} />
                        </div>
                        <span className={`text-[12px] font-mono font-medium ${isLight ? "text-red-600" : "text-red-400"}`}>{shortPct}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
