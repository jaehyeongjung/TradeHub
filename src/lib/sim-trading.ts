import { supabase } from "@/lib/supabase-browser";
import type {
    SimAccount,
    SimPosition,
    SimOrder,
    SimTrade,
    OpenPositionInput,
    PositionSide,
} from "@/types/sim-trading";

const TAKER_FEE = 0.0004; // 0.04%
const MAINTENANCE_MARGIN_RATE = 0.004; // 0.4%
const DEFAULT_BALANCE = 10000;

/* ── 계좌 ── */

export async function getOrCreateAccount(
    userId: string
): Promise<SimAccount> {
    const { data } = await supabase
        .from("sim_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (data) return data as SimAccount;

    const { data: created, error } = await supabase
        .from("sim_accounts")
        .insert({
            user_id: userId,
            balance: DEFAULT_BALANCE,
            total_deposit: DEFAULT_BALANCE,
        })
        .select()
        .single();

    if (error) throw error;
    return created as SimAccount;
}

export async function resetAccount(userId: string): Promise<SimAccount> {
    // 모든 오픈 포지션 강제 종료
    await supabase
        .from("sim_positions")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "OPEN");

    // 미체결 주문 취소
    await supabase
        .from("sim_orders")
        .update({ status: "CANCELLED" })
        .eq("user_id", userId)
        .eq("status", "PENDING");

    // 잔고 리셋
    const { data, error } = await supabase
        .from("sim_accounts")
        .update({
            balance: DEFAULT_BALANCE,
            total_deposit: DEFAULT_BALANCE,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

    if (error) throw error;
    return data as SimAccount;
}

/* ── 계산 유틸 ── */

export function calcLiqPrice(
    side: PositionSide,
    entryPrice: number,
    leverage: number
): number {
    if (side === "LONG") {
        return entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE);
    }
    return entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
}

export function calcUnrealizedPnl(
    side: PositionSide,
    entryPrice: number,
    currentPrice: number,
    quantity: number
): number {
    if (side === "LONG") {
        return quantity * (currentPrice - entryPrice);
    }
    return quantity * (entryPrice - currentPrice);
}

export function calcRoe(
    pnl: number,
    margin: number
): number {
    if (margin === 0) return 0;
    return (pnl / margin) * 100;
}

/* ── 포지션 오픈 ── */

export async function openPosition(
    userId: string,
    input: OpenPositionInput
): Promise<{ position: SimPosition; account: SimAccount }> {
    const account = await getOrCreateAccount(userId);

    const { symbol, side, orderType, price, quantityUsdt, leverage, tpPrice, slPrice } = input;

    // 코인 수량
    const quantity = quantityUsdt / price;
    // 필요 증거금
    const margin = quantityUsdt / leverage;
    // 수수료
    const fee = quantityUsdt * TAKER_FEE;
    // 총 비용
    const totalCost = margin + fee;

    if (account.balance < totalCost) {
        throw new Error("잔고가 부족합니다");
    }

    // 지정가 주문은 바로 체결하지 않고 주문으로 등록
    if (orderType === "LIMIT" || orderType === "STOP_MARKET") {
        const { error } = await supabase.from("sim_orders").insert({
            user_id: userId,
            symbol,
            side,
            order_type: orderType,
            price,
            quantity,
            leverage,
            tp_price: tpPrice ?? null,
            sl_price: slPrice ?? null,
        });
        if (error) throw error;

        // 증거금 선차감
        const newBalance = account.balance - totalCost;
        const { data: updatedAccount } = await supabase
            .from("sim_accounts")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .select()
            .single();

        return {
            position: null as unknown as SimPosition,
            account: updatedAccount as SimAccount,
        };
    }

    // 시장가 즉시 체결
    const liqPrice = calcLiqPrice(side, price, leverage);

    const { data: position, error: posErr } = await supabase
        .from("sim_positions")
        .insert({
            user_id: userId,
            symbol,
            side,
            entry_price: price,
            quantity,
            leverage,
            margin,
            liq_price: liqPrice,
            tp_price: tpPrice ?? null,
            sl_price: slPrice ?? null,
        })
        .select()
        .single();

    if (posErr) throw posErr;

    // 거래 기록
    await supabase.from("sim_trades").insert({
        user_id: userId,
        position_id: position.id,
        symbol,
        side,
        type: "OPEN",
        price,
        quantity,
        pnl: 0,
        fee,
    });

    // 잔고 차감
    const newBalance = account.balance - totalCost;
    const { data: updatedAccount } = await supabase
        .from("sim_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();

    return {
        position: position as SimPosition,
        account: updatedAccount as SimAccount,
    };
}

/* ── 포지션 종료 ── */

export async function closePosition(
    userId: string,
    positionId: string,
    closePrice: number
): Promise<{ pnl: number; account: SimAccount }> {
    const { data: pos } = await supabase
        .from("sim_positions")
        .select("*")
        .eq("id", positionId)
        .eq("user_id", userId)
        .single();

    if (!pos || pos.status !== "OPEN") throw new Error("포지션을 찾을 수 없습니다");

    const position = pos as SimPosition;
    const pnl = calcUnrealizedPnl(
        position.side,
        position.entry_price,
        closePrice,
        position.quantity
    );
    const fee = position.quantity * closePrice * TAKER_FEE;
    const returnAmount = position.margin + pnl - fee;

    // 포지션 업데이트
    await supabase
        .from("sim_positions")
        .update({
            status: "CLOSED",
            close_price: closePrice,
            closed_at: new Date().toISOString(),
            unrealized_pnl: pnl,
        })
        .eq("id", positionId);

    // 거래 기록
    await supabase.from("sim_trades").insert({
        user_id: userId,
        position_id: positionId,
        symbol: position.symbol,
        side: position.side,
        type: "CLOSE",
        price: closePrice,
        quantity: position.quantity,
        pnl,
        fee,
    });

    // 잔고 반환
    const { data: account } = await supabase
        .from("sim_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();

    const newBalance = Math.max(0, (account as SimAccount).balance + returnAmount);
    const { data: updatedAccount } = await supabase
        .from("sim_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();

    return { pnl, account: updatedAccount as SimAccount };
}

/* ── 청산 ── */

export async function liquidatePosition(
    userId: string,
    positionId: string,
    liqPrice: number
): Promise<void> {
    const { data: pos } = await supabase
        .from("sim_positions")
        .select("*")
        .eq("id", positionId)
        .single();

    if (!pos || pos.status !== "OPEN") return;

    const position = pos as SimPosition;

    await supabase
        .from("sim_positions")
        .update({
            status: "LIQUIDATED",
            close_price: liqPrice,
            closed_at: new Date().toISOString(),
            unrealized_pnl: -position.margin,
        })
        .eq("id", positionId);

    await supabase.from("sim_trades").insert({
        user_id: userId,
        position_id: positionId,
        symbol: position.symbol,
        side: position.side,
        type: "LIQUIDATION",
        price: liqPrice,
        quantity: position.quantity,
        pnl: -position.margin,
        fee: 0,
    });
    // margin은 이미 차감되어 있으므로 추가 차감 없음 (전액 손실)
}

/* ── 미체결 주문 체결 ── */

export async function fillOrder(
    userId: string,
    orderId: string,
    fillPrice: number
): Promise<SimPosition | null> {
    const { data: ord } = await supabase
        .from("sim_orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (!ord || ord.status !== "PENDING") return null;

    const order = ord as SimOrder;
    const liqPrice = calcLiqPrice(order.side, fillPrice, order.leverage);
    const margin = order.quantity * fillPrice / order.leverage;
    const fee = order.quantity * fillPrice * TAKER_FEE;

    // 주문 체결
    await supabase
        .from("sim_orders")
        .update({ status: "FILLED" })
        .eq("id", orderId);

    // 포지션 생성
    const { data: position } = await supabase
        .from("sim_positions")
        .insert({
            user_id: userId,
            symbol: order.symbol,
            side: order.side,
            entry_price: fillPrice,
            quantity: order.quantity,
            leverage: order.leverage,
            margin,
            liq_price: liqPrice,
            tp_price: order.tp_price,
            sl_price: order.sl_price,
        })
        .select()
        .single();

    // 거래 기록
    if (position) {
        await supabase.from("sim_trades").insert({
            user_id: userId,
            position_id: position.id,
            symbol: order.symbol,
            side: order.side,
            type: "OPEN",
            price: fillPrice,
            quantity: order.quantity,
            pnl: 0,
            fee,
        });
    }

    return position as SimPosition | null;
}

/* ── 주문 취소 ── */

export async function cancelOrder(
    userId: string,
    orderId: string
): Promise<SimAccount> {
    const { data: ord } = await supabase
        .from("sim_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", userId)
        .single();

    if (!ord || ord.status !== "PENDING") throw new Error("주문을 찾을 수 없습니다");

    const order = ord as SimOrder;

    await supabase
        .from("sim_orders")
        .update({ status: "CANCELLED" })
        .eq("id", orderId);

    // 증거금 반환
    const margin = order.quantity * order.price / order.leverage;
    const fee = order.quantity * order.price * TAKER_FEE;
    const returnAmount = margin + fee;

    const { data: account } = await supabase
        .from("sim_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();

    const newBalance = (account as SimAccount).balance + returnAmount;
    const { data: updated } = await supabase
        .from("sim_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();

    return updated as SimAccount;
}

/* ── 데이터 조회 ── */

export async function getOpenPositions(userId: string): Promise<SimPosition[]> {
    const { data } = await supabase
        .from("sim_positions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "OPEN")
        .order("opened_at", { ascending: false });
    return (data ?? []) as SimPosition[];
}

export async function getPendingOrders(userId: string): Promise<SimOrder[]> {
    const { data } = await supabase
        .from("sim_orders")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
    return (data ?? []) as SimOrder[];
}

export async function getTradeHistory(
    userId: string,
    limit = 50
): Promise<SimTrade[]> {
    const { data } = await supabase
        .from("sim_trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    return (data ?? []) as SimTrade[];
}
