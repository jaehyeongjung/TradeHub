"use client";

import type { SimTrade } from "@/shared/types/sim-trading.types";

interface Props {
    trades: SimTrade[];
    /** 모바일 전용 2줄 레이아웃. 데스크톱 6열 그리드는 390px에서 열당 50px밖에
        안 나와 "진입"·"청산" 배지가 잘린다. 기본값 false — 데스크톱은 그대로. */
    mobile?: boolean;
}

export function SimTradeHistory({ trades, mobile = false }: Props) {
    if (trades.length === 0) {
        return (
            <div className="bg-neutral-950 rounded-2xl border border-zinc-800 p-5 min-h-[214px] flex flex-col justify-center">
                <div className="text-[11px] text-neutral-500 text-center">거래 이력이 없습니다</div>
            </div>
        );
    }

    if (mobile) {
        return (
            <ul className="divide-y divide-border-subtle">
                {trades.map((t) => {
                    const isLiq = t.type === "LIQUIDATION";
                    const isOpen = t.type === "OPEN";
                    const isProfit = t.pnl >= 0;
                    const isLong = t.side === "LONG";
                    const notional = t.quantity * t.price;
                    const d = new Date(t.created_at);
                    const p2 = (n: number) => n.toString().padStart(2, "0");
                    const timeStr = `${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;

                    return (
                        <li key={t.id} className="flex items-center gap-2.5 py-2.5">
                            <span
                                className={`h-8 w-1 shrink-0 rounded-full ${
                                    isLiq ? "bg-orange-500" : isLong ? "bg-[var(--color-up)]" : "bg-[var(--color-down)]"
                                }`}
                                aria-hidden="true"
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-label font-bold text-text-primary">
                                        {t.symbol.replace("USDT", "")}
                                    </span>
                                    <span className={`rounded-[5px] px-1.5 py-px text-caption font-bold ${
                                        isLong
                                            ? "bg-[var(--color-up-muted)] text-[var(--color-up-text)]"
                                            : "bg-[var(--color-down-muted)] text-[var(--color-down-text)]"
                                    }`}>
                                        {t.side}
                                    </span>
                                    <span className={`rounded-[5px] px-1.5 py-px text-caption font-bold ${
                                        isLiq
                                            ? "bg-orange-500/15 text-orange-400"
                                            : isOpen
                                                ? "bg-blue-500/10 text-blue-400"
                                                : "bg-surface-input text-text-tertiary"
                                    }`}>
                                        {isLiq ? ("청산") : isOpen ? ("진입") : ("종료")}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate font-mono text-caption text-text-muted">
                                    {t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    {" · $"}
                                    {notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                {isOpen ? (
                                    <span className="text-label text-text-disabled">—</span>
                                ) : (
                                    <p className={`font-mono text-label font-bold tabular-nums ${
                                        isLiq ? "text-orange-400" : isProfit ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                                    }`}>
                                        {isProfit && !isLiq ? "+" : ""}{t.pnl.toFixed(2)}
                                    </p>
                                )}
                                <p className="font-mono text-caption text-text-muted">{timeStr}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <div className="bg-neutral-950 rounded-2xl border border-zinc-800 overflow-hidden min-h-[214px]">
            <div className="grid grid-cols-[1fr_0.8fr_1fr_1fr_1fr_0.8fr] gap-2 px-5 py-2 text-[10px] text-neutral-500 border-b border-zinc-800/40">
                <div>심볼</div>
                <div className="text-right">유형</div>
                <div className="text-right">가격</div>
                <div className="text-right">규모</div>
                <div className="text-right">손익</div>
                <div className="text-right">시간</div>
            </div>

            <div className="divide-y divide-zinc-800/30 max-h-60 overflow-y-auto">
                {trades.map((t) => {
                    const isLiq = t.type === "LIQUIDATION";
                    const isOpen = t.type === "OPEN";
                    const isProfit = t.pnl >= 0;
                    const isLong = t.side === "LONG";
                    const notional = t.quantity * t.price;
                    const date = new Date(t.created_at);
                    const timeStr = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

                    return (
                        <div
                            key={t.id}
                            className="grid grid-cols-[1fr_0.8fr_1fr_1fr_1fr_0.8fr] gap-2 items-center px-5 py-2.5 hover:bg-white/[0.015] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-1 h-6 rounded-full ${
                                    isLiq ? "bg-orange-500" : isLong ? "bg-emerald-500" : "bg-red-500"
                                }`} />
                                <div>
                                    <span className="text-[12px] font-bold text-white">
                                        {t.symbol.replace("USDT", "")}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 ${
                                        isLong
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-red-500/15 text-red-400"
                                    }`}>
                                        {t.side}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                    isLiq
                                        ? "bg-orange-500/15 text-orange-400"
                                        : isOpen
                                          ? "bg-blue-500/10 text-blue-400"
                                          : "bg-neutral-800 text-neutral-400"
                                }`}>
                                    {isLiq ? ("청산") : isOpen ? ("진입") : ("종료")}
                                </span>
                            </div>

                            <div className="text-right">
                                <div className="text-[12px] text-neutral-200 font-mono tabular-nums">
                                    {t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-[12px] text-neutral-300 font-mono tabular-nums">
                                    ${notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="text-right">
                                {isOpen ? (
                                    <span className="text-[11px] text-neutral-600">—</span>
                                ) : (
                                    <div className={`text-[12px] font-bold font-mono tabular-nums ${
                                        isLiq
                                            ? "text-orange-400"
                                            : isProfit
                                              ? "text-emerald-400"
                                              : "text-red-400"
                                    }`}>
                                        {isProfit && !isLiq ? "+" : ""}{t.pnl.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            <div className="text-right">
                                <div className="text-[10px] text-neutral-500 font-mono tabular-nums">
                                    {timeStr}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
