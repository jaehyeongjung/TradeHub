"use client";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, simMarginModeAtom } from "@/store/atoms";
import { SUPPORTED_SYMBOLS } from "@/hooks/useSimPriceStream";
import { calcLiqPrice, calcLiqPriceCross } from "@/lib/sim-trading";
import type { SimAccount, OpenPositionInput, PositionSide, OrderType, MarginMode } from "@/types/sim-trading";

interface Props {
    account: SimAccount | null;
    totalUnrealizedPnl: number;
    totalPositionMargin: number;
    loading: boolean;
    onSubmit: (input: OpenPositionInput) => Promise<void>;
    onReset: () => void;
    clickedPrice: number | null;
    lockedMarginMode: MarginMode | null;
}

const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 75, 100, 125];

export default function SimOrderPanel({ account, totalUnrealizedPnl, totalPositionMargin, loading, onSubmit, onReset, clickedPrice, lockedMarginMode }: Props) {
    const [simSymbol, setSimSymbol] = useAtom(simSymbolAtom);
    const prices = useAtomValue(simPricesAtom);
    const [marginMode, setMarginMode] = useAtom(simMarginModeAtom);
    const currentPrice = prices[simSymbol] ?? 0;

    const [side, setSide] = useState<PositionSide>("LONG");
    const [orderType, setOrderType] = useState<OrderType>("MARKET");
    const [leverage, setLeverage] = useState(10);
    const [amountUsdt, setAmountUsdt] = useState("");
    const [limitPrice, setLimitPrice] = useState("");
    const [tpPrice, setTpPrice] = useState("");
    const [slPrice, setSlPrice] = useState("");
    const [showTpSl, setShowTpSl] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (lockedMarginMode) setMarginMode(lockedMarginMode);
    }, [lockedMarginMode, setMarginMode]);

    useEffect(() => {
        if (clickedPrice !== null && clickedPrice > 0) {
            setOrderType("LIMIT");
            setLimitPrice(String(clickedPrice));
        }
    }, [clickedPrice]);

    const balance = account?.balance ?? 0;
    const equity = balance + totalPositionMargin + totalUnrealizedPnl;
    const totalDeposit = account?.total_deposit ?? 10000;
    const totalPnl = equity - totalDeposit;
    const roe = totalDeposit > 0 ? (totalPnl / totalDeposit) * 100 : 0;

    const price = orderType === "MARKET" ? currentPrice : parseFloat(limitPrice) || 0;
    const amount = parseFloat(amountUsdt) || 0;
    const margin = leverage > 0 ? amount / leverage : 0;
    const coinQty = price > 0 ? amount / price : 0;
    const estLiqPrice = (() => {
        if (price <= 0 || leverage <= 0) return 0;
        if (marginMode === "CROSS") {
            const availBal = Math.max(0, balance - margin - amount * 0.0004);
            return calcLiqPriceCross(side, price, coinQty, margin, availBal);
        }
        return calcLiqPrice(side, price, leverage);
    })();

    const handlePercentage = (pct: number) => {
        setAmountUsdt((balance * leverage * pct).toFixed(2));
    };

    const handleSubmit = async () => {
        setError("");
        if (!currentPrice) { setError("가격 정보를 불러오는 중입니다"); return; }
        if (amount <= 0) { setError("주문 금액을 입력하세요"); return; }
        if (orderType !== "MARKET" && (!limitPrice || parseFloat(limitPrice) <= 0)) { setError("지정가를 입력하세요"); return; }
        if (margin > balance) { setError("잔고가 부족합니다"); return; }

        const tp = tpPrice ? parseFloat(tpPrice) : null;
        const sl = slPrice ? parseFloat(slPrice) : null;
        if (side === "LONG") {
            if (tp !== null && tp <= price) { setError("롱 TP는 진입가보다 높아야 합니다"); return; }
            if (sl !== null && sl >= price) { setError("롱 SL은 진입가보다 낮아야 합니다"); return; }
        } else {
            if (tp !== null && tp >= price) { setError("숏 TP는 진입가보다 낮아야 합니다"); return; }
            if (sl !== null && sl <= price) { setError("숏 SL은 진입가보다 높아야 합니다"); return; }
        }

        setSubmitting(true);
        try {
            await onSubmit({ symbol: simSymbol, side, orderType, price, quantityUsdt: amount, leverage, tpPrice: tpPrice ? parseFloat(tpPrice) : undefined, slPrice: slPrice ? parseFloat(slPrice) : undefined, marginMode });
            setAmountUsdt(""); setLimitPrice(""); setTpPrice(""); setSlPrice(""); setError("");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "주문 실패");
        }
        setSubmitting(false);
    };

    // 스타일 변수
    const panelBg = isLight ? "bg-white border border-neutral-200" : "bg-neutral-950 border border-neutral-800";
    const sectionBorder = isLight ? "border-neutral-200" : "border-neutral-800";
    const inputBg = isLight
        ? "bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder:text-neutral-400 focus:border-emerald-500"
        : "bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600";
    const labelColor = isLight ? "text-neutral-500" : "text-neutral-500";
    const metaColor = isLight ? "text-neutral-400" : "text-neutral-600";

    return (
        <div className={`rounded-2xl flex flex-col gap-0 overflow-hidden ${panelBg}`}>
            {/* 잔고 섹션 */}
            <div className={`px-4 pt-4 pb-3 border-b ${sectionBorder}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] uppercase tracking-widest font-medium ${metaColor}`}>Demo Account</span>
                    <button
                        onClick={onReset}
                        className={`text-[9px] px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                            isLight
                                ? "text-neutral-400 hover:text-amber-600 border border-neutral-200 hover:border-amber-300"
                                : "text-neutral-500 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/30"
                        }`}
                    >
                        리셋
                    </button>
                </div>

                {/* 총 자산 */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className={`text-[20px] font-bold font-mono tabular-nums ${isLight ? "text-neutral-900" : "text-white"}`}>
                            {loading ? "—" : equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${metaColor}`}>총 자산 (USDT)</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xs font-bold tabular-nums font-mono ${roe >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {loading ? "—" : `${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%`}
                        </div>
                        <div className={`text-[10px] tabular-nums font-mono ${totalUnrealizedPnl >= 0 ? "text-emerald-400/60" : "text-red-400/60"}`}>
                            {loading ? "" : `${totalUnrealizedPnl >= 0 ? "+" : ""}${totalUnrealizedPnl.toFixed(2)} PnL`}
                        </div>
                    </div>
                </div>

                {/* 가용잔고 / 증거금 / PnL */}
                {!loading && (
                    <div className={`flex gap-3 mt-3 pt-2.5 border-t ${sectionBorder}`}>
                        <div className="flex-1">
                            <div className={`text-[9px] mb-0.5 ${metaColor}`}>가용잔고</div>
                            <div className={`text-[12px] font-mono tabular-nums ${isLight ? "text-neutral-700" : "text-neutral-200"}`}>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className={`text-[9px] mb-0.5 ${metaColor}`}>사용 증거금</div>
                            <div className="text-[12px] text-amber-400 font-mono tabular-nums">
                                {totalPositionMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className={`text-[9px] mb-0.5 ${metaColor}`}>미실현 PnL</div>
                            <div className={`text-[12px] font-mono tabular-nums ${totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {totalUnrealizedPnl >= 0 ? "+" : ""}{totalUnrealizedPnl.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 주문 섹션 */}
            <div className="px-4 py-3 flex flex-col gap-3">
                {/* 심볼 선택 — 커스텀 드롭다운 */}
                <div className="relative">
                    <select
                        value={simSymbol}
                        onChange={(e) => setSimSymbol(e.target.value)}
                        className={`w-full appearance-none text-xs rounded-xl px-3 py-2.5 outline-none cursor-pointer transition-colors pr-8 ${inputBg}`}
                    >
                        {SUPPORTED_SYMBOLS.map((s) => (
                            <option key={s} value={s}>{s.replace("USDT", " / USDT")}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className={`w-3.5 h-3.5 ${isLight ? "text-neutral-400" : "text-neutral-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* 롱 / 숏 */}
                <div className={`grid grid-cols-2 p-1 gap-1 rounded-xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`}>
                    <button
                        onClick={() => setSide("LONG")}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            side === "LONG"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : isLight ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        Long
                    </button>
                    <button
                        onClick={() => setSide("SHORT")}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            side === "SHORT"
                                ? "bg-red-600 text-white shadow-sm"
                                : isLight ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        Short
                    </button>
                </div>

                {/* 주문 타입 */}
                <div className="flex gap-1.5">
                    {(["MARKET", "LIMIT"] as OrderType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setOrderType(t)}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors cursor-pointer border ${
                                orderType === t
                                    ? isLight
                                        ? "bg-white text-neutral-800 border-neutral-300 shadow-sm"
                                        : "bg-neutral-800 text-white border-neutral-700"
                                    : isLight
                                        ? "text-neutral-400 border-transparent hover:text-neutral-600"
                                        : "text-neutral-500 border-transparent hover:text-neutral-300"
                            }`}
                        >
                            {t === "MARKET" ? "시장가" : "지정가"}
                        </button>
                    ))}
                </div>

                {/* 지정가 입력 */}
                {orderType === "LIMIT" && (
                    <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={`지정가 — ${currentPrice || ""}`}
                        className={`w-full text-xs rounded-xl px-3 py-2.5 outline-none transition-colors ${inputBg}`}
                    />
                )}

                {/* 마진 모드 */}
                <div>
                    <div className={`grid grid-cols-2 p-1 gap-1 rounded-xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`}>
                        {(["CROSS", "ISOLATED"] as MarginMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => !lockedMarginMode && setMarginMode(mode)}
                                disabled={!!lockedMarginMode}
                                className={`py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                                    lockedMarginMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                } ${
                                    marginMode === mode
                                        ? "bg-amber-500/20 text-amber-400"
                                        : isLight ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-500 hover:text-neutral-300"
                                }`}
                            >
                                {mode === "CROSS" ? "Cross" : "Isolated"}
                            </button>
                        ))}
                    </div>
                    {lockedMarginMode && (
                        <div className={`text-[9px] mt-1 ${metaColor}`}>포지션이 있어 마진 모드 변경 불가</div>
                    )}
                </div>

                {/* 레버리지 */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] ${labelColor}`}>레버리지</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">{leverage}x</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={125}
                        value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 cursor-pointer"
                    />
                    <div className="flex gap-0.5 mt-2">
                        {LEVERAGE_PRESETS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLeverage(l)}
                                className={`flex-1 py-1 text-[9px] rounded-md transition-colors cursor-pointer ${
                                    leverage === l
                                        ? "bg-amber-500/20 text-amber-400 font-medium"
                                        : isLight
                                            ? "bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                                            : "bg-neutral-900 text-neutral-600 hover:text-neutral-400"
                                }`}
                            >
                                {l}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* 수량 */}
                <div>
                    <input
                        type="number"
                        value={amountUsdt}
                        onChange={(e) => setAmountUsdt(e.target.value)}
                        placeholder="주문 금액 (USDT)"
                        className={`w-full text-xs rounded-xl px-3 py-2.5 outline-none transition-colors ${inputBg}`}
                    />
                    <div className="flex gap-0.5 mt-2">
                        {[0.25, 0.5, 0.75, 1].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => handlePercentage(pct)}
                                className={`flex-1 py-1.5 text-[9px] rounded-md border transition-colors cursor-pointer ${
                                    isLight
                                        ? "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                                        : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                                }`}
                            >
                                {pct * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* TP / SL 토글 */}
                <button
                    onClick={() => setShowTpSl(!showTpSl)}
                    className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors cursor-pointer ${
                        isLight ? "text-neutral-500 hover:text-neutral-700" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showTpSl ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    TP / SL
                </button>
                {showTpSl && (
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={tpPrice}
                            onChange={(e) => setTpPrice(e.target.value)}
                            placeholder="Take Profit"
                            className={`flex-1 text-[10px] rounded-xl px-2.5 py-2 outline-none placeholder:text-neutral-600 ${inputBg}`}
                        />
                        <input
                            type="number"
                            value={slPrice}
                            onChange={(e) => setSlPrice(e.target.value)}
                            placeholder="Stop Loss"
                            className={`flex-1 text-[10px] rounded-xl px-2.5 py-2 outline-none placeholder:text-neutral-600 ${inputBg}`}
                        />
                    </div>
                )}

                {/* 주문 정보 */}
                <div className={`text-[10px] space-y-1 pt-2 border-t ${sectionBorder} ${metaColor}`}>
                    <div className="flex justify-between">
                        <span>증거금</span>
                        <span className={isLight ? "text-neutral-600" : "text-neutral-400"}>{margin.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                        <span>수량</span>
                        <span className={isLight ? "text-neutral-600" : "text-neutral-400"}>{coinQty.toFixed(6)} {simSymbol.replace("USDT", "")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>청산가</span>
                        <span className="text-orange-400">{estLiqPrice > 0 ? `$${estLiqPrice.toFixed(2)}` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>수수료</span>
                        <span className={isLight ? "text-neutral-600" : "text-neutral-400"}>{(amount * 0.0004).toFixed(2)} USDT</span>
                    </div>
                </div>

                {/* 에러 */}
                {error && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="text-[10px] text-red-400">{error}</span>
                    </div>
                )}

                {/* 주문 버튼 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !currentPrice}
                    className={`w-full py-3 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
                        side === "LONG"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                >
                    {submitting ? "처리 중..." : side === "LONG" ? "Buy / Long" : "Sell / Short"}
                </button>
            </div>
        </div>
    );
}
