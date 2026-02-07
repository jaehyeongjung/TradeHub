"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { activePageAtom, simPricesAtom } from "@/store/atoms";
import { supabase } from "@/lib/supabase-browser";
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
} from "@/lib/sim-trading";
import {
    playOrderFilledSound,
    playPositionClosedSound,
    playLiquidationSound,
} from "@/lib/sounds";
import type {
    SimAccount,
    SimPosition,
    SimOrder,
    SimTrade,
    OpenPositionInput,
} from "@/types/sim-trading";

export function useSimAccount() {
    const activePage = useAtomValue(activePageAtom);
    const prices = useAtomValue(simPricesAtom);

    const [userId, setUserId] = useState<string | null>(null);
    const [account, setAccount] = useState<SimAccount | null>(null);
    const [positions, setPositions] = useState<SimPosition[]>([]);
    const [orders, setOrders] = useState<SimOrder[]>([]);
    const [trades, setTrades] = useState<SimTrade[]>([]);
    const [loading, setLoading] = useState(true);

    // 청산/TP/SL/주문 체크 중복 방지
    const checkingRef = useRef(false);

    // 세션 확인
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user?.id ?? null);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            setUserId(s?.user?.id ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    // 초기 데이터 로드
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

    // 실시간 가격에 따른 체크 (청산, TP/SL, 지정가 체결)
    useEffect(() => {
        if (!userId || activePage !== "sim" || checkingRef.current) return;
        if (positions.length === 0 && orders.length === 0) return;

        checkingRef.current = true;

        (async () => {
            let changed = false;

            // 포지션 체크: 청산 & TP/SL
            for (const pos of positions) {
                const cp = prices[pos.symbol];
                if (!cp) continue;

                // Cross 모드: 청산가를 실시간 잔고 기준으로 재계산
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

                // 청산 체크
                const shouldLiq =
                    (pos.side === "LONG" && cp <= effectiveLiqPrice) ||
                    (pos.side === "SHORT" && cp >= effectiveLiqPrice);

                if (shouldLiq) {
                    await liquidatePosition(userId, pos.id, effectiveLiqPrice);
                    playLiquidationSound();
                    changed = true;
                    continue;
                }

                // TP 체크 (현재 시장가로 체결)
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

                // SL 체크 (현재 시장가로 체결)
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

            // 미체결 주문 체크
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

    // 미실현 PnL이 반영된 포지션 (UI용) + Cross 모드 청산가 실시간 갱신
    const positionsWithPnl = positions.map((pos) => {
        const cp = prices[pos.symbol] ?? pos.entry_price;
        const unrealized_pnl = calcUnrealizedPnl(
            pos.side,
            pos.entry_price,
            cp,
            pos.quantity
        );

        // Cross 모드: 잔고 변동에 따라 청산가 재계산
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

    // 총 미실현 PnL
    const totalUnrealizedPnl = positionsWithPnl.reduce(
        (sum, p) => sum + p.unrealized_pnl,
        0
    );

    // 포지션에 잠긴 총 증거금
    const totalPositionMargin = positionsWithPnl.reduce(
        (sum, p) => sum + p.margin,
        0
    );

    // 액션 래퍼들
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

    // TP/SL 검증용 최신 가격 참조
    const latestPricesRef = useRef(prices);
    latestPricesRef.current = prices;
    const latestPositionsRef = useRef(positionsWithPnl);
    latestPositionsRef.current = positionsWithPnl;

    const handleUpdateTpSl = useCallback(
        async (positionId: string, tpPrice: number | null, slPrice: number | null) => {
            if (!userId) throw new Error("로그인이 필요합니다");

            // 포지션 찾아서 유효성 검증
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
