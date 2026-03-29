"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { activePageAtom, simPricesAtom } from "@/shared/store/atoms";
import { supabase } from "@/shared/lib/supabase-browser";
import {
    getOrCreateAccount,
    resetAccount,
    getOpenPositions,
    getPendingOrders,
    getTradeHistory,
    openPosition,
    closePosition,
    liquidatePosition,
    fillOrder,
    cancelOrder,
    calcUnrealizedPnl,
    calcLiqPriceCross,
    updatePositionTpSl,
} from "@/shared/lib/sim-trading.service";
import {
    playOrderFilledSound,
    playPositionClosedSound,
    playLiquidationSound,
} from "@/shared/lib/sounds";
import type {
    SimAccount,
    SimPosition,
    SimOrder,
    SimTrade,
    OpenPositionInput,
} from "@/shared/types/sim-trading.types";

export function useSimAccount() {
    const activePage = useAtomValue(activePageAtom);
    const prices = useAtomValue(simPricesAtom);

    const [userId, setUserId] = useState<string | null>(null);
    const [account, setAccount] = useState<SimAccount | null>(null);
    const [positions, setPositions] = useState<SimPosition[]>([]);
    const [orders, setOrders] = useState<SimOrder[]>([]);
    const [trades, setTrades] = useState<SimTrade[]>([]);
    const [loading, setLoading] = useState(true);

    const checkingRef = useRef(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user?.id ?? null);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            setUserId(s?.user?.id ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const loadAll = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [acc, pos, ord, trd] = await Promise.all([
                getOrCreateAccount(userId),
                getOpenPositions(userId),
                getPendingOrders(userId),
                getTradeHistory(userId),
            ]);
            setAccount(acc);
            setPositions(pos);
            setOrders(ord);
            setTrades(trd);
        } catch (e) {
            console.error("sim account load error:", e);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (activePage === "sim" && userId) {
            loadAll();
        }
    }, [activePage, userId, loadAll]);

    useEffect(() => {
        if (!userId || activePage !== "sim" || checkingRef.current) return;
        if (positions.length === 0 && orders.length === 0) return;

        checkingRef.current = true;

        (async () => {
            let changed = false;

            for (const pos of positions) {
                const cp = prices[pos.symbol];
                if (!cp) continue;

                let effectiveLiqPrice = pos.liq_price;
                if (pos.margin_mode === "CROSS" && account) {
                    effectiveLiqPrice = calcLiqPriceCross(
                        pos.side,
                        pos.entry_price,
                        pos.quantity,
                        pos.margin,
                        account.balance
                    );
                }

                const shouldLiq =
                    (pos.side === "LONG" && cp <= effectiveLiqPrice) ||
                    (pos.side === "SHORT" && cp >= effectiveLiqPrice);

                if (shouldLiq) {
                    await liquidatePosition(userId, pos.id, effectiveLiqPrice);
                    playLiquidationSound();
                    changed = true;
                    continue;
                }

                if (pos.tp_price) {
                    const hitTp =
                        (pos.side === "LONG" && cp >= pos.tp_price) ||
                        (pos.side === "SHORT" && cp <= pos.tp_price);
                    if (hitTp) {
                        await closePosition(userId, pos.id, cp);
                        playPositionClosedSound();
                        changed = true;
                        continue;
                    }
                }

                if (pos.sl_price) {
                    const hitSl =
                        (pos.side === "LONG" && cp <= pos.sl_price) ||
                        (pos.side === "SHORT" && cp >= pos.sl_price);
                    if (hitSl) {
                        await closePosition(userId, pos.id, cp);
                        playPositionClosedSound();
                        changed = true;
                        continue;
                    }
                }
            }

            for (const ord of orders) {
                const cp = prices[ord.symbol];
                if (!cp) continue;

                const shouldFill =
                    (ord.side === "LONG" && ord.order_type === "LIMIT" && cp <= ord.price) ||
                    (ord.side === "SHORT" && ord.order_type === "LIMIT" && cp >= ord.price) ||
                    (ord.side === "LONG" && ord.order_type === "STOP_MARKET" && cp >= ord.price) ||
                    (ord.side === "SHORT" && ord.order_type === "STOP_MARKET" && cp <= ord.price);

                if (shouldFill) {
                    await fillOrder(userId, ord.id, cp);
                    playOrderFilledSound();
                    changed = true;
                }
            }

            if (changed) {
                await loadAll();
            }

            checkingRef.current = false;
        })();
    }, [prices, userId, activePage, positions, orders, account, loadAll]);

    const positionsWithPnl = positions.map((pos) => {
        const cp = prices[pos.symbol] ?? pos.entry_price;
        const unrealized_pnl = calcUnrealizedPnl(
            pos.side,
            pos.entry_price,
            cp,
            pos.quantity
        );

        let liq_price = pos.liq_price;
        if (pos.margin_mode === "CROSS" && account) {
            liq_price = calcLiqPriceCross(
                pos.side,
                pos.entry_price,
                pos.quantity,
                pos.margin,
                account.balance
            );
        }

        return { ...pos, unrealized_pnl, liq_price };
    });

    const totalUnrealizedPnl = positionsWithPnl.reduce(
        (sum, p) => sum + p.unrealized_pnl,
        0
    );

    const totalPositionMargin = positionsWithPnl.reduce(
        (sum, p) => sum + p.margin,
        0
    );

    const handleOpen = useCallback(
        async (input: OpenPositionInput) => {
            if (!userId) throw new Error("로그인이 필요합니다");
            const result = await openPosition(userId, input);
            playOrderFilledSound();
            await loadAll();
            return result;
        },
        [userId, loadAll]
    );

    const handleClose = useCallback(
        async (positionId: string, closePrice: number) => {
            if (!userId) throw new Error("로그인이 필요합니다");
            const result = await closePosition(userId, positionId, closePrice);
            playPositionClosedSound();
            await loadAll();
            return result;
        },
        [userId, loadAll]
    );

    const handleCancel = useCallback(
        async (orderId: string) => {
            if (!userId) throw new Error("로그인이 필요합니다");
            await cancelOrder(userId, orderId);
            await loadAll();
        },
        [userId, loadAll]
    );

    const handleReset = useCallback(async () => {
        if (!userId) throw new Error("로그인이 필요합니다");
        await resetAccount(userId);
        await loadAll();
    }, [userId, loadAll]);

    const latestPositionsPnlRef = useRef(positionsWithPnl);
    latestPositionsPnlRef.current = positionsWithPnl;

    useEffect(() => {
        if (!userId || activePage !== "sim") return;
        const sync = async () => {
            const pos = latestPositionsPnlRef.current;
            if (pos.length === 0) return;
            await Promise.all(
                pos.map((p) =>
                    supabase
                        .from("sim_positions")
                        .update({ unrealized_pnl: p.unrealized_pnl })
                        .eq("id", p.id)
                )
            );
        };
        const id = setInterval(sync, 30_000);
        return () => clearInterval(id);
    }, [userId, activePage]);

    const latestPricesRef = useRef(prices);
    latestPricesRef.current = prices;
    const latestPositionsRef = useRef(positionsWithPnl);
    latestPositionsRef.current = positionsWithPnl;

    const handleUpdateTpSl = useCallback(
        async (positionId: string, tpPrice: number | null, slPrice: number | null) => {
            if (!userId) throw new Error("로그인이 필요합니다");

            const pos = latestPositionsRef.current.find(p => p.id === positionId);
            if (!pos) throw new Error("포지션을 찾을 수 없습니다");

            const cp = latestPricesRef.current[pos.symbol];
            if (!cp) throw new Error("가격 정보를 불러올 수 없습니다");

            if (pos.side === "LONG") {
                if (tpPrice !== null && tpPrice <= cp) throw new Error("TP는 현재가보다 높아야 합니다");
                if (slPrice !== null && slPrice >= cp) throw new Error("SL은 현재가보다 낮아야 합니다");
            } else {
                if (tpPrice !== null && tpPrice >= cp) throw new Error("TP는 현재가보다 낮아야 합니다");
                if (slPrice !== null && slPrice <= cp) throw new Error("SL은 현재가보다 높아야 합니다");
            }

            await updatePositionTpSl(userId, positionId, tpPrice, slPrice);
            await loadAll();
        },
        [userId, loadAll]
    );

    return {
        userId,
        account,
        positions: positionsWithPnl,
        orders,
        trades,
        loading,
        totalUnrealizedPnl,
        totalPositionMargin,
        openPosition: handleOpen,
        closePosition: handleClose,
        cancelOrder: handleCancel,
        resetAccount: handleReset,
        updateTpSl: handleUpdateTpSl,
        reload: loadAll,
    };
}
