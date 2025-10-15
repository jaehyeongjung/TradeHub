"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SymbolPickerModal from "@/components/SymbolPickerModal";
import { supabase } from "@/lib/supabase-browser";

type Props = { boxId: string; defaultSymbol?: string };

export const CoinPriceBox = ({ boxId, defaultSymbol = "btcusdt" }: Props) => {
    const initialSymbol = defaultSymbol.toLowerCase();

    const [symbol, setSymbol] = useState(initialSymbol);
    const [price, setPrice] = useState<number | null>(null);
    const [pct, setPct] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const verRef = useRef(0);
    const reconnectTimer = useRef<number | null>(null);

    const usd = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
            }),
        []
    );

    // 로그인 세션 + 심볼 로드
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange(
            async (_e, session) => {
                const uid = session?.user?.id ?? null;
                setUserId(uid);

                if (uid) {
                    const { data: row } = await supabase
                        .from("user_symbol_prefs")
                        .select("symbol")
                        .eq("user_id", uid)
                        .eq("box_id", boxId)
                        .maybeSingle();
                    if (row?.symbol) setSymbol(row.symbol.toLowerCase());
                    else setSymbol(initialSymbol);
                } else {
                    const loc = localStorage.getItem(`coin_box:${boxId}`);
                    setSymbol(loc ?? initialSymbol);
                }
            }
        );

        (async () => {
            const { data } = await supabase.auth.getSession();
            const uid = data.session?.user?.id ?? null;
            setUserId(uid);

            if (uid) {
                const { data: row } = await supabase
                    .from("user_symbol_prefs")
                    .select("symbol")
                    .eq("user_id", uid)
                    .eq("box_id", boxId)
                    .maybeSingle();
                if (row?.symbol) setSymbol(row.symbol.toLowerCase());
            } else {
                const loc = localStorage.getItem(`coin_box:${boxId}`);
                if (loc) setSymbol(loc);
            }
        })();

        return () => sub.subscription.unsubscribe();
    }, [boxId, initialSymbol]);

    // Binance WebSocket
    useEffect(() => {
        const myVer = ++verRef.current;
        setPrice(null);
        setPct(null);

        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        if (wsRef.current) {
            try {
                wsRef.current.close(1000, "symbol change");
            } catch {}
            wsRef.current = null;
        }

        const stream = symbol.toLowerCase();
        const url = `wss://stream.binance.com:9443/ws/${stream}@ticker`;

        const connect = () => {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onmessage = (ev) => {
                if (verRef.current !== myVer) return;
                const d = JSON.parse(ev.data);
                const last = parseFloat(d?.c);
                const changePct = parseFloat(d?.P);
                if (!Number.isNaN(last)) setPrice(last);
                if (!Number.isNaN(changePct)) setPct(changePct);
            };

            ws.onclose = () => {
                if (verRef.current === myVer) {
                    reconnectTimer.current = window.setTimeout(connect, 1200);
                }
            };

            ws.onerror = () => {
                try {
                    ws.close();
                } catch {}
            };
        };

        connect();

        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                try {
                    wsRef.current.close(1000, "cleanup");
                } catch {}
            }
        };
    }, [symbol]);

    const saveSymbol = async (next: string) => {
        const s = next.toLowerCase();
        setSymbol(s);
        if (userId) {
            await supabase
                .from("user_symbol_prefs")
                .upsert([{ user_id: userId, box_id: boxId, symbol: s }], {
                    onConflict: "user_id,box_id",
                });
        } else {
            localStorage.setItem(`coin_box:${boxId}`, s);
        }
    };

    const pctColor =
        pct == null
            ? "text-gray-300"
            : pct > 0
            ? "text-emerald-500"
            : "text-red-500";
    const arrow = pct == null ? "" : pct > 0 ? "▲" : pct < 0 ? "▼" : "•";
    const pctText =
        pct == null ? "" : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`;

    return (
        <>
            <div
                className="relative w-full"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <button
                    onClick={() => setOpen(true)}
                    className="min-w-30 w-full min-h-26 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-md transition hover:border-neutral-700"
                >
                    <h2 className="text-sm font-bold text-white">
                        {symbol.toUpperCase()}
                    </h2>
                    <p className={`mt-1 text-lg font-mono ${pctColor}`}>
                        {price != null ? usd.format(price) : "—"}
                    </p>
                    <div className={`mt-0.5 text-xs font-semibold ${pctColor}`}>
                        {pct != null ? (
                            <>
                                {arrow} {pctText}
                            </>
                        ) : (
                            "—"
                        )}
                    </div>
                </button>

                {/* 간단한 툴팁 */}
                {hovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 w-[200px] rounded-lg bg-neutral-900 border border-neutral-700 py-2 px-3 text-[11px] text-neutral-200 shadow-lg pointer-events-none">
                        클릭 시 코인 심볼을 변경할 수 있습니다.
                        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-neutral-900" />
                    </div>
                )}
            </div>

            <SymbolPickerModal
                open={open}
                initialSymbol={symbol}
                onClose={() => setOpen(false)}
                onSelect={saveSymbol}
            />
        </>
    );
};
