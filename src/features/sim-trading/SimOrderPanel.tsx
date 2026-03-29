"use client";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, simMarginModeAtom } from "@/shared/store/atoms";
import { calcLiqPrice, calcLiqPriceCross } from "@/shared/lib/sim-trading";
import { AnimatedNumber } from "@/shared/ui/AnimatedNumber";
import { useTheme } from "@/shared/hooks/useTheme";
import { LEVERAGE_PRESETS } from "@/shared/constants/sim-trading.constants";
import type { SimAccount, OpenPositionInput, PositionSide, OrderType, MarginMode } from "@/shared/types/sim-trading.types";

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

export function SimOrderPanel({ account, totalUnrealizedPnl, totalPositionMargin, loading, onSubmit, onReset, clickedPrice, lockedMarginMode }: Props) {
    const isLight = useTheme();
    const simSymbol = useAtomValue(simSymbolAtom);
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

    const handlePercentage = (pct: number) => setAmountUsdt((balance * leverage * pct).toFixed(2));

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

    const isLong = side === "LONG";
    const leveragePct = ((leverage - 1) / (125 - 1)) * 100;

    const bg = isLight ? "bg-white" : "bg-neutral-950";
    const cardBg = isLight ? "bg-neutral-50" : "bg-neutral-900/60";
    const inputBg = isLight ? "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400" : "bg-neutral-900 border-zinc-800 text-white placeholder:text-neutral-600";
    const border = isLight ? "border-neutral-200" : "border-zinc-800";
    const divider = isLight ? "bg-neutral-100" : "bg-zinc-800/60";
    const textPrimary = isLight ? "text-neutral-900" : "text-white";
    const textSecondary = isLight ? "text-neutral-500" : "text-neutral-500";
    const textTertiary = isLight ? "text-neutral-400" : "text-neutral-600";
    const pillBg = isLight ? "bg-neutral-100" : "bg-neutral-900";
    const pillActive = isLight ? "bg-white shadow-sm text-neutral-900" : "bg-neutral-700 text-white";
    const pillInactive = isLight ? "text-neutral-500 hover:text-neutral-700" : "text-neutral-600 hover:text-neutral-400";

    return (
        <div className={`h-full flex flex-col ${bg} rounded-2xl overflow-hidden border ${border}`}>

            <div className="px-5 pt-5 pb-4 flex-shrink-0">
                <div className="flex items-start justify-between mb-1">
                    <span className={`text-[10px] font-medium ${textTertiary} tracking-widest uppercase`}>Demo Account</span>
                    <button
                        onClick={onReset}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border ${border} ${textTertiary} hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer`}
                    >
                        초기화
                    </button>
                </div>

                <div className="flex items-end justify-between mt-2 mb-4">
                    <div>
                        {loading ? (
                            <div className={`h-9 w-36 ${isLight ? "bg-neutral-100" : "bg-neutral-800/60"} rounded-xl animate-pulse`} />
                        ) : (
                            <div className={`text-[28px] font-bold ${textPrimary} leading-none tracking-tight font-mono`}>
                                <AnimatedNumber
                                    value={equity}
                                    formatter={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                />
                            </div>
                        )}
                        <div className={`text-[10px] ${textTertiary} mt-1`}>총 자산 (USDT)</div>
                    </div>
                    {!loading && (
                        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${roe >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            <svg className={`w-3 h-3 ${roe >= 0 ? "text-emerald-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d={roe >= 0 ? "M7 14l5-5 5 5H7z" : "M7 10l5 5 5-5H7z"} />
                            </svg>
                            <span className={`text-[13px] font-bold font-mono tabular-nums ${roe >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>

                {!loading && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            { label: "가용잔고", value: balance.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: textPrimary },
                            { label: "사용증거금", value: totalPositionMargin.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: isLight ? "text-amber-600" : "text-amber-400" },
                            { label: "미실현 PnL", value: `${totalUnrealizedPnl >= 0 ? "+" : ""}${totalUnrealizedPnl.toFixed(1)}`, color: totalUnrealizedPnl >= 0 ? "text-emerald-500" : "text-red-500" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`${cardBg} rounded-xl px-2.5 py-2 border ${border}`}>
                                <div className={`text-[9px] ${textTertiary} mb-0.5`}>{label}</div>
                                <div className={`text-[11px] font-mono font-bold tabular-nums ${color}`}>{value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={`h-px ${divider} mx-4 flex-shrink-0`} />

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">

                <div className={`relative grid grid-cols-2 ${pillBg} rounded-2xl p-1`}>
                    <div className={`absolute top-1 bottom-1 rounded-xl transition-all duration-200 ease-out pointer-events-none ${
                        isLong
                            ? "left-1 right-[calc(50%+2px)] bg-emerald-500/20 border border-emerald-500/30"
                            : "left-[calc(50%+2px)] right-1 bg-red-500/20 border border-red-500/30"
                    }`} />
                    <button
                        onClick={() => setSide("LONG")}
                        className={`relative z-10 py-2.5 text-[13px] font-bold transition-colors duration-200 cursor-pointer rounded-xl ${
                            isLong ? "text-emerald-500" : `${textTertiary} hover:${textSecondary}`
                        }`}
                    >Long</button>
                    <button
                        onClick={() => setSide("SHORT")}
                        className={`relative z-10 py-2.5 text-[13px] font-bold transition-colors duration-200 cursor-pointer rounded-xl ${
                            !isLong ? "text-red-500" : `${textTertiary} hover:${textSecondary}`
                        }`}
                    >Short</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className={`flex ${pillBg} rounded-xl p-0.5 gap-0.5 border ${border}`}>
                        {(["MARKET", "LIMIT"] as OrderType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setOrderType(t)}
                                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-[10px] transition-all duration-150 cursor-pointer ${
                                    orderType === t ? pillActive : pillInactive
                                }`}
                            >
                                {t === "MARKET" ? "시장가" : "지정가"}
                            </button>
                        ))}
                    </div>
                    <div className={`flex ${pillBg} rounded-xl p-0.5 gap-0.5 border ${border}`}>
                        {(["CROSS", "ISOLATED"] as MarginMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => !lockedMarginMode && setMarginMode(mode)}
                                disabled={!!lockedMarginMode}
                                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-[10px] transition-all duration-150 ${
                                    lockedMarginMode ? "cursor-not-allowed opacity-35" : "cursor-pointer"
                                } ${
                                    marginMode === mode
                                        ? `bg-amber-500/10 ${isLight ? "text-amber-600" : "text-amber-400"}`
                                        : pillInactive
                                }`}
                            >
                                {mode === "CROSS" ? "교차" : "격리"}
                            </button>
                        ))}
                    </div>
                </div>
                {lockedMarginMode && (
                    <p className={`text-[9px] ${textTertiary} -mt-1 pl-0.5`}>포지션 보유 중 마진 모드 변경 불가</p>
                )}

                {orderType === "LIMIT" && (
                    <div className="relative">
                        <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder={`지정가 ${currentPrice > 0 ? `≈ ${currentPrice.toLocaleString()}` : ""}`}
                            className={`w-full text-[12px] rounded-xl px-3.5 py-2.5 border outline-none focus:border-zinc-500 transition-colors pr-14 ${inputBg}`}
                        />
                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] ${textTertiary} font-medium`}>USDT</span>
                    </div>
                )}

                <div className={`${cardBg} rounded-2xl px-3.5 py-3 border ${border}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-[11px] ${textSecondary} font-medium`}>레버리지</span>
                        <span className={`text-[15px] font-bold font-mono tabular-nums ${
                            leverage >= 50 ? "text-red-500" : leverage >= 20 ? (isLight ? "text-amber-600" : "text-amber-400") : textPrimary
                        }`}>
                            {leverage}×
                        </span>
                    </div>

                    <div className="relative h-5 mb-3">
                        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[3px] rounded-full overflow-hidden" style={{ background: isLight ? "#e5e7eb" : "#262626" }}>
                            <div
                                className={`h-full rounded-full transition-all duration-75 ${
                                    leverage >= 50 ? "bg-red-500" : leverage >= 20 ? "bg-amber-400" : "bg-amber-300"
                                }`}
                                style={{ width: `${leveragePct}%` }}
                            />
                        </div>
                        <input
                            type="range" min={1} max={125} value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                            className="absolute w-[14px] h-[14px] rounded-full shadow-md pointer-events-none transition-[left] duration-75"
                            style={{
                                left: `${leveragePct}%`,
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                background: isLight ? "#ffffff" : "#ffffff",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                            }}
                        />
                    </div>

                    <div className="flex gap-1">
                        {LEVERAGE_PRESETS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLeverage(l)}
                                className={`flex-1 py-1 text-[9px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                                    leverage === l ? pillActive : pillInactive
                                }`}
                            >
                                {l}×
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="relative mb-1.5">
                        <input
                            type="number"
                            value={amountUsdt}
                            onChange={(e) => setAmountUsdt(e.target.value)}
                            placeholder="주문 금액 (USDT)"
                            className={`w-full text-[13px] rounded-xl px-3.5 py-3 border outline-none focus:border-zinc-500 transition-colors pr-16 ${inputBg}`}
                        />
                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] ${textTertiary} font-medium`}>USDT</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[
                            { pct: 0.25, label: "25%" },
                            { pct: 0.5, label: "50%" },
                            { pct: 0.75, label: "75%" },
                            { pct: 1, label: "최대" },
                        ].map(({ pct, label }) => (
                            <button
                                key={pct}
                                onClick={() => handlePercentage(pct)}
                                className={`py-2 text-[10px] font-semibold rounded-xl border transition-all cursor-pointer active:scale-[0.97] ${
                                    isLight
                                        ? "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                        : "bg-neutral-900 border-zinc-800 text-neutral-500 hover:text-white hover:bg-neutral-800"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => setShowTpSl(!showTpSl)}
                        className={`flex items-center justify-between w-full py-1.5 text-[11px] font-medium cursor-pointer group`}
                    >
                        <span className={`flex items-center gap-1.5 transition-colors ${showTpSl ? textSecondary : `${textTertiary} group-hover:${textSecondary}`}`}>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showTpSl ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            익절 / 손절 (TP/SL)
                        </span>
                        {(tpPrice || slPrice) && !showTpSl && (
                            <span className={`text-[9px] px-2 py-0.5 bg-amber-500/10 rounded-full font-medium ${isLight ? "text-amber-600" : "text-amber-400"}`}>설정됨</span>
                        )}
                    </button>

                    <div className={`grid transition-all duration-200 ease-in-out ${showTpSl ? "grid-rows-[1fr] mt-1.5" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                            <div className="flex gap-1.5">
                                <input
                                    type="number" value={tpPrice}
                                    onChange={(e) => setTpPrice(e.target.value)}
                                    placeholder="익절가 (TP)"
                                    className={`flex-1 text-[11px] rounded-xl px-3 py-2.5 border outline-none focus:border-emerald-500/40 transition-colors text-emerald-500 ${
                                        isLight ? "bg-white border-neutral-200 placeholder:text-neutral-400" : "bg-neutral-900 border-zinc-800 placeholder:text-neutral-700"
                                    }`}
                                />
                                <input
                                    type="number" value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                    placeholder="손절가 (SL)"
                                    className={`flex-1 text-[11px] rounded-xl px-3 py-2.5 border outline-none focus:border-red-500/40 transition-colors text-red-500 ${
                                        isLight ? "bg-white border-neutral-200 placeholder:text-neutral-400" : "bg-neutral-900 border-zinc-800 placeholder:text-neutral-700"
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {amount > 0 && (
                    <div className={`space-y-2 pt-2.5 border-t ${border}`}>
                        {[
                            { label: "필요 증거금", value: `${margin.toFixed(2)} USDT`, color: textSecondary },
                            { label: "거래 수량", value: `${coinQty.toFixed(6)} ${simSymbol.replace("USDT", "")}`, color: textTertiary },
                            { label: "예상 청산가", value: estLiqPrice > 0 ? `$${estLiqPrice.toFixed(2)}` : "—", color: "text-orange-500" },
                            { label: "거래 수수료", value: `${(amount * 0.0004).toFixed(3)} USDT`, color: textTertiary },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className={`text-[10px] ${textTertiary}`}>{label}</span>
                                <span className={`text-[11px] font-mono tabular-nums font-medium ${color}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15">
                        <svg className="w-3.5 h-3.5 text-red-500 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="text-[10px] text-red-500 leading-relaxed">{error}</span>
                    </div>
                )}
            </div>

            <div className={`flex-shrink-0 px-4 pb-5 pt-3 border-t ${border}`}>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !currentPrice}
                    className={`w-full py-4 text-[14px] font-bold rounded-2xl transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] tracking-wide ${
                        isLong
                            ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20"
                    }`}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            처리 중…
                        </span>
                    ) : (
                        isLong ? "매수 (Long)" : "매도 (Short)"
                    )}
                </button>
            </div>
        </div>
    );
}
