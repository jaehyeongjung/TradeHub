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

    const isLong = side === "LONG";

    return (
        <div className="h-full flex flex-col bg-neutral-950 rounded-2xl overflow-hidden border border-zinc-800">

            {/* ── 잔고 섹션 ── */}
            <div className="px-4 pt-4 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium text-neutral-600 tracking-widest uppercase">Demo Account</span>
                    <button
                        onClick={onReset}
                        className="text-[9px] px-2 py-1 rounded-md text-neutral-600 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                    >
                        리셋
                    </button>
                </div>

                {/* 총 자산 */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-[22px] font-bold font-mono tabular-nums text-white leading-none">
                            {loading ? "—" : `$${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <div className="text-[10px] text-neutral-600 mt-1">총 자산 (USDT)</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-[13px] font-bold font-mono tabular-nums ${roe >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {loading ? "—" : `${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%`}
                        </div>
                        <div className={`text-[10px] font-mono tabular-nums mt-0.5 ${totalUnrealizedPnl >= 0 ? "text-emerald-400/50" : "text-red-400/50"}`}>
                            {loading ? "" : `${totalUnrealizedPnl >= 0 ? "+" : ""}${totalUnrealizedPnl.toFixed(2)} uPnL`}
                        </div>
                    </div>
                </div>

                {/* 서브 스탯 */}
                {!loading && (
                    <div className="flex mt-3 pt-3 border-t border-zinc-800/40">
                        <div className="flex-1">
                            <div className="text-[9px] text-neutral-600 mb-0.5">가용잔고</div>
                            <div className="text-[11px] font-mono tabular-nums text-neutral-300">
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="w-px bg-zinc-800/60 mx-3" />
                        <div className="flex-1">
                            <div className="text-[9px] text-neutral-600 mb-0.5">사용 증거금</div>
                            <div className="text-[11px] font-mono tabular-nums text-amber-400/80">
                                {totalPositionMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="w-px bg-zinc-800/60 mx-3" />
                        <div className="flex-1">
                            <div className="text-[9px] text-neutral-600 mb-0.5">미실현 PnL</div>
                            <div className={`text-[11px] font-mono tabular-nums ${totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {totalUnrealizedPnl >= 0 ? "+" : ""}{totalUnrealizedPnl.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 주문 폼 (스크롤 영역) ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3 scrollbar-none">

                {/* 심볼 선택 */}
                <div className="relative">
                    <select
                        value={simSymbol}
                        onChange={(e) => setSimSymbol(e.target.value)}
                        className="w-full appearance-none text-[11px] rounded-xl px-3 py-2 bg-neutral-900 border border-zinc-800 text-neutral-300 outline-none cursor-pointer pr-7"
                    >
                        {SUPPORTED_SYMBOLS.map((s) => (
                            <option key={s} value={s}>{s.replace("USDT", " / USDT")}</option>
                        ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Long / Short 토글 */}
                <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-zinc-800">
                    <button
                        onClick={() => setSide("LONG")}
                        className={`py-2.5 text-[12px] font-bold transition-all cursor-pointer ${
                            isLong
                                ? "bg-emerald-600 text-white"
                                : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        Long
                    </button>
                    <button
                        onClick={() => setSide("SHORT")}
                        className={`py-2.5 text-[12px] font-bold transition-all cursor-pointer border-l border-zinc-800 ${
                            !isLong
                                ? "bg-red-600 text-white"
                                : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        Short
                    </button>
                </div>

                {/* 주문 타입 */}
                <div className="flex gap-1">
                    {(["MARKET", "LIMIT"] as OrderType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setOrderType(t)}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors cursor-pointer ${
                                orderType === t
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-600 hover:text-neutral-400"
                            }`}
                        >
                            {t === "MARKET" ? "시장가" : "지정가"}
                        </button>
                    ))}
                </div>

                {/* 지정가 입력 */}
                {orderType === "LIMIT" && (
                    <div className="relative">
                        <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder={`지정가 ${currentPrice > 0 ? `≈ ${currentPrice.toLocaleString()}` : ""}`}
                            className="w-full text-[11px] rounded-xl px-3 py-2.5 bg-neutral-900 border border-zinc-800 text-white placeholder:text-neutral-600 outline-none focus:border-zinc-600 transition-colors pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600">USDT</span>
                    </div>
                )}

                {/* 마진 모드 */}
                <div>
                    <div className="flex gap-1">
                        {(["CROSS", "ISOLATED"] as MarginMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => !lockedMarginMode && setMarginMode(mode)}
                                disabled={!!lockedMarginMode}
                                className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
                                    lockedMarginMode ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                } ${
                                    marginMode === mode
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                        : "text-neutral-600 hover:text-neutral-400 border border-transparent"
                                }`}
                            >
                                {mode === "CROSS" ? "Cross" : "Isolated"}
                            </button>
                        ))}
                    </div>
                    {lockedMarginMode && (
                        <p className="text-[9px] text-neutral-700 mt-1 pl-0.5">포지션 보유 중 마진 모드 변경 불가</p>
                    )}
                </div>

                {/* 레버리지 */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-neutral-600">레버리지</span>
                        <span className="text-[11px] font-bold text-amber-400 font-mono">{leverage}×</span>
                    </div>
                    <input
                        type="range" min={1} max={125} value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                        className="w-full accent-amber-500 h-[3px] cursor-pointer"
                    />
                    <div className="flex gap-0.5 mt-2">
                        {LEVERAGE_PRESETS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLeverage(l)}
                                className={`flex-1 py-1 text-[9px] rounded-md transition-colors cursor-pointer ${
                                    leverage === l
                                        ? "bg-amber-500/20 text-amber-400 font-semibold"
                                        : "bg-neutral-900 text-neutral-600 hover:text-neutral-400"
                                }`}
                            >
                                {l}×
                            </button>
                        ))}
                    </div>
                </div>

                {/* 주문 금액 */}
                <div>
                    <div className="relative">
                        <input
                            type="number"
                            value={amountUsdt}
                            onChange={(e) => setAmountUsdt(e.target.value)}
                            placeholder="주문 금액"
                            className="w-full text-[11px] rounded-xl px-3 py-2.5 bg-neutral-900 border border-zinc-800 text-white placeholder:text-neutral-600 outline-none focus:border-zinc-600 transition-colors pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600">USDT</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                        {[0.25, 0.5, 0.75, 1].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => handlePercentage(pct)}
                                className="py-1.5 text-[9px] rounded-lg bg-neutral-900 border border-zinc-800 text-neutral-600 hover:text-neutral-300 hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                                {pct * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* TP / SL */}
                <div>
                    <button
                        onClick={() => setShowTpSl(!showTpSl)}
                        className="flex items-center gap-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer"
                    >
                        <svg className={`w-3 h-3 transition-transform duration-150 ${showTpSl ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        TP / SL
                    </button>
                    {showTpSl && (
                        <div className="flex gap-1.5 mt-1.5">
                            <input
                                type="number" value={tpPrice}
                                onChange={(e) => setTpPrice(e.target.value)}
                                placeholder="Take Profit"
                                className="flex-1 text-[10px] rounded-xl px-2.5 py-2 bg-neutral-900 border border-zinc-800 text-white placeholder:text-neutral-700 outline-none focus:border-emerald-600/40 transition-colors"
                            />
                            <input
                                type="number" value={slPrice}
                                onChange={(e) => setSlPrice(e.target.value)}
                                placeholder="Stop Loss"
                                className="flex-1 text-[10px] rounded-xl px-2.5 py-2 bg-neutral-900 border border-zinc-800 text-white placeholder:text-neutral-700 outline-none focus:border-red-600/40 transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* 주문 정보 요약 */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/40 text-[10px]">
                    {[
                        { label: "증거금", value: `${margin.toFixed(2)} USDT`, color: "text-neutral-400" },
                        { label: "수량", value: `${coinQty.toFixed(6)} ${simSymbol.replace("USDT", "")}`, color: "text-neutral-400" },
                        { label: "예상 청산가", value: estLiqPrice > 0 ? `$${estLiqPrice.toFixed(2)}` : "—", color: "text-orange-400" },
                        { label: "수수료 (시장가)", value: `${(amount * 0.0004).toFixed(3)} USDT`, color: "text-neutral-500" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between">
                            <span className="text-neutral-600">{label}</span>
                            <span className={`font-mono tabular-nums ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* 에러 */}
                {error && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15">
                        <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="text-[10px] text-red-400">{error}</span>
                    </div>
                )}
            </div>

            {/* ── 주문 버튼 (항상 하단 고정) ── */}
            <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-zinc-800/60">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !currentPrice}
                    className={`w-full py-3.5 text-[13px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] tracking-wide ${
                        isLong
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                >
                    {submitting ? "처리 중…" : isLong ? "Buy / Long" : "Sell / Short"}
                </button>
            </div>
        </div>
    );
}
