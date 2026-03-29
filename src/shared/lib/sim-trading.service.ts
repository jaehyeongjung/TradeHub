import { supabase } from "@/shared/lib/supabase-browser";
import type {
    SimAccount,
    SimPosition,
    SimOrder,
    SimTrade,
    OpenPositionInput,
    PositionSide,
    MarginMode,
} from "@/shared/types/sim-trading.types";

const TAKER_FEE = 0.0004;
const MAINTENANCE_MARGIN_RATE = 0.004;
const DEFAULT_BALANCE = 10000;

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
    await supabase
        .from("sim_positions")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "OPEN");

    await supabase
        .from("sim_orders")
        .update({ status: "CANCELLED" })
        .eq("user_id", userId)
        .eq("status", "PENDING");

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

export function calcLiqPriceCross(
    side: PositionSide,
    entryPrice: number,
    quantity: number,
    margin: number,
    availableBalance: number
): number {
    const notional = entryPrice * quantity;
    const effectiveMargin = margin + availableBalance;
    if (notional === 0) return 0;
    const effectiveLev = notional / effectiveMargin;
    if (side === "LONG") {
        return entryPrice * (1 - 1 / effectiveLev + MAINTENANCE_MARGIN_RATE);
    }
    return entryPrice * (1 + 1 / effectiveLev - MAINTENANCE_MARGIN_RATE);
}

export async function openPosition(
    userId: string,
    input: OpenPositionInput
): Promise<{ position: SimPosition; account: SimAccount }> {
    const account = await getOrCreateAccount(userId);

    const { symbol, side, orderType, price, quantityUsdt, leverage, tpPrice, slPrice, marginMode = "CROSS" } = input;

    const quantity = quantityUsdt / price;
    const margin = quantityUsdt / leverage;
    const fee = quantityUsdt * TAKER_FEE;
    const totalCost = margin + fee;

    if (account.balance < totalCost) {
        throw new Error("잔고가 부족합니다");
    }

    if (tpPrice !== undefined && tpPrice !== null) {
        if (side === "LONG" && tpPrice <= price) throw new Error("롱 포지션의 TP는 진입가보다 높아야 합니다");
        if (side === "SHORT" && tpPrice >= price) throw new Error("숏 포지션의 TP는 진입가보다 낮아야 합니다");
    }
    if (slPrice !== undefined && slPrice !== null) {
        if (side === "LONG" && slPrice >= price) throw new Error("롱 포지션의 SL은 진입가보다 낮아야 합니다");
        if (side === "SHORT" && slPrice <= price) throw new Error("숏 포지션의 SL은 진입가보다 높아야 합니다");
    }

    if (orderType === "LIMIT" || orderType === "STOP_MARKET") {
        const { error } = await supabase.from("sim_orders").insert({
            user_id: userId,
            symbol,
            side,
            order_type: orderType,
            price,
            quantity,
            leverage,
            margin_mode: marginMode,
            tp_price: tpPrice ?? null,
            sl_price: slPrice ?? null,
        });
        if (error) throw error;

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

    const { data: conflictPos } = await supabase
        .from("sim_positions")
        .select("margin_mode")
        .eq("user_id", userId)
        .eq("symbol", symbol)
        .eq("status", "OPEN")
        .neq("margin_mode", marginMode)
        .limit(1)
        .maybeSingle();

    if (conflictPos) {
        const existing = conflictPos.margin_mode === "CROSS" ? "교차(Cross)" : "격리(Isolated)";
        throw new Error(`이미 ${existing} 모드 포지션이 있습니다. 마진 모드를 변경하려면 기존 포지션을 먼저 청산하세요.`);
    }

    const { data: existingPos } = await supabase
        .from("sim_positions")
        .select("*")
        .eq("user_id", userId)
        .eq("symbol", symbol)
        .eq("side", side)
        .eq("margin_mode", marginMode)
        .eq("status", "OPEN")
        .maybeSingle();

    let position: SimPosition;

    if (existingPos) {
        const old = existingPos as SimPosition;
        const newQty = old.quantity + quantity;
        const newEntryPrice = (old.quantity * old.entry_price + quantity * price) / newQty;
        const newMargin = old.margin + margin;
        const newLeverage = (old.margin * old.leverage + margin * leverage) / (old.margin + margin);
        const mergedMarginMode = marginMode;

        let newLiqPrice: number;
        const remainingBalance = account.balance - totalCost;
        if (mergedMarginMode === "CROSS") {
            newLiqPrice = calcLiqPriceCross(side, newEntryPrice, newQty, newMargin, remainingBalance);
        } else {
            newLiqPrice = calcLiqPrice(side, newEntryPrice, newLeverage);
        }

        const mergedTp = tpPrice ?? old.tp_price;
        const mergedSl = slPrice ?? old.sl_price;

        const { data: updated, error: upErr } = await supabase
            .from("sim_positions")
            .update({
                entry_price: newEntryPrice,
                quantity: newQty,
                leverage: newLeverage,
                margin: newMargin,
                liq_price: newLiqPrice,
                margin_mode: mergedMarginMode,
                tp_price: mergedTp,
                sl_price: mergedSl,
            })
            .eq("id", old.id)
            .select()
            .single();

        if (upErr) throw upErr;
        position = updated as SimPosition;
    } else {
        const remainingBalance = account.balance - totalCost;
        let liqPrice: number;
        if (marginMode === "CROSS") {
            liqPrice = calcLiqPriceCross(side, price, quantity, margin, remainingBalance);
        } else {
            liqPrice = calcLiqPrice(side, price, leverage);
        }

        const { data: created, error: posErr } = await supabase
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
                margin_mode: marginMode,
                tp_price: tpPrice ?? null,
                sl_price: slPrice ?? null,
            })
            .select()
            .single();

        if (posErr) throw posErr;
        position = created as SimPosition;
    }

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

    await supabase
        .from("sim_positions")
        .update({
            status: "CLOSED",
            close_price: closePrice,
            closed_at: new Date().toISOString(),
            unrealized_pnl: pnl,
        })
        .eq("id", positionId);

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
}

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
    const margin = order.quantity * fillPrice / order.leverage;
    const fee = order.quantity * fillPrice * TAKER_FEE;
    const orderMarginMode: MarginMode = order.margin_mode ?? "CROSS";

    await supabase
        .from("sim_orders")
        .update({ status: "FILLED" })
        .eq("id", orderId);

    const { data: conflictPos } = await supabase
        .from("sim_positions")
        .select("margin_mode")
        .eq("user_id", userId)
        .eq("symbol", order.symbol)
        .eq("status", "OPEN")
        .neq("margin_mode", orderMarginMode)
        .limit(1)
        .maybeSingle();

    if (conflictPos) {
        await supabase
            .from("sim_orders")
            .update({ status: "CANCELLED" })
            .eq("id", orderId);
        return null;
    }

    const { data: existingPos } = await supabase
        .from("sim_positions")
        .select("*")
        .eq("user_id", userId)
        .eq("symbol", order.symbol)
        .eq("side", order.side)
        .eq("margin_mode", orderMarginMode)
        .eq("status", "OPEN")
        .maybeSingle();

    let position: SimPosition;

    if (existingPos) {
        const old = existingPos as SimPosition;
        const newQty = old.quantity + order.quantity;
        const newEntryPrice = (old.quantity * old.entry_price + order.quantity * fillPrice) / newQty;
        const newMargin = old.margin + margin;
        const newLeverage = (old.margin * old.leverage + margin * order.leverage) / (old.margin + margin);
        const mergedMarginMode = orderMarginMode;

        let newLiqPrice: number;
        if (mergedMarginMode === "CROSS") {
            const account = await getOrCreateAccount(userId);
            newLiqPrice = calcLiqPriceCross(order.side, newEntryPrice, newQty, newMargin, account.balance);
        } else {
            newLiqPrice = calcLiqPrice(order.side, newEntryPrice, newLeverage);
        }

        const mergedTp = order.tp_price ?? old.tp_price;
        const mergedSl = order.sl_price ?? old.sl_price;

        const { data: updated } = await supabase
            .from("sim_positions")
            .update({
                entry_price: newEntryPrice,
                quantity: newQty,
                leverage: newLeverage,
                margin: newMargin,
                liq_price: newLiqPrice,
                margin_mode: mergedMarginMode,
                tp_price: mergedTp,
                sl_price: mergedSl,
            })
            .eq("id", old.id)
            .select()
            .single();

        position = updated as SimPosition;
    } else {
        let liqPrice: number;
        if (orderMarginMode === "CROSS") {
            const account = await getOrCreateAccount(userId);
            liqPrice = calcLiqPriceCross(order.side, fillPrice, order.quantity, margin, account.balance);
        } else {
            liqPrice = calcLiqPrice(order.side, fillPrice, order.leverage);
        }

        const { data: created } = await supabase
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
                margin_mode: orderMarginMode,
                tp_price: order.tp_price,
                sl_price: order.sl_price,
            })
            .select()
            .single();

        position = created as SimPosition;
    }

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

    return position;
}

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

export async function updatePositionTpSl(
    userId: string,
    positionId: string,
    tpPrice: number | null,
    slPrice: number | null
): Promise<void> {
    await supabase
        .from("sim_positions")
        .update({ tp_price: tpPrice, sl_price: slPrice })
        .eq("id", positionId)
        .eq("user_id", userId)
        .eq("status", "OPEN");
}

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
