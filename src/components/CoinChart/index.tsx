"use client";

import { useEffect, useRef, useState } from "react";
import {
    createChart,
    CandlestickSeries,
    type IChartApi,
} from "lightweight-charts";
import { toKstUtcTimestamp } from "@/lib/time";
import type { KlineRow, KlineMessage, Interval } from "@/types/binance";
import SymbolPickerModal from "@/components/SymbolPickerModal";
import { supabase } from "@/lib/supabase-browser";
import { AnimatePresence, motion } from "framer-motion";

interface BinanceExchangeInfo {
    symbols: Array<{
        symbol: string;
        filters: Array<{
            filterType: "PRICE_FILTER" | string;
            tickSize?: string;
        }>;
    }>;
}

type Props = {
    boxId?: string;
    symbol?: string;
    interval?: Interval;
    historyLimit?: number;
    className?: string;
};

export default function CoinChart({
    boxId = "chart-1",
    symbol = "BTCUSDT",
    interval = "1m",
    historyLimit = 200,
    className,
}: Props) {
    const outerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const [sym, setSym] = useState(symbol.toUpperCase());
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // 심볼별 precision 캐시
    const precisionCache = useRef<
        Record<string, { decimals: number; minMove: number }>
    >({});

    const decimalsFromTickSize = (tick: string) => {
        const i = tick.indexOf(".");
        if (i === -1) return 0;
        const frac = tick.slice(i + 1);
        const trimmed = frac.replace(/0+$/, "");
        return trimmed.length || frac.length;
    };

    const minMoveFromTickSize = (tick: string) => {
        const n = Number(tick);
        return Number.isFinite(n) ? n : 0.01;
    };

    // 유저 세션 + 저장된 심볼 불러오기
    useEffect(() => {
        let unsub: { subscription: { unsubscribe(): void } } | null = null;

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
                if (row?.symbol) setSym(String(row.symbol).toUpperCase());
            } else {
                const loc = localStorage.getItem(`chart:${boxId}`);
                if (loc) setSym(loc.toUpperCase());
            }

            const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
                const nuid = s?.user?.id ?? null;
                setUserId(nuid);
                if (nuid) {
                    supabase
                        .from("user_symbol_prefs")
                        .select("symbol")
                        .eq("user_id", nuid)
                        .eq("box_id", boxId)
                        .maybeSingle()
                        .then(({ data: r }) => {
                            if (r?.symbol)
                                setSym(String(r.symbol).toUpperCase());
                        });
                } else {
                    const l = localStorage.getItem(`chart:${boxId}`);
                    if (l) setSym(l.toUpperCase());
                }
            });
            unsub = sub;
        })();

        return () => {
            unsub?.subscription.unsubscribe();
        };
    }, [boxId]);

    // 차트 생성 + 안전정리
    useEffect(() => {
        const el = chartRef.current;
        if (!el) return;

        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let ro: ResizeObserver | null = null;

        const chart: IChartApi = createChart(el, {
            width: el.clientWidth,
            height: el.clientHeight,
            layout: {
                background: { color: "#171717" },
                textColor: "#E5E5E5",
            },
            grid: {
                vertLines: { color: "#1F1F1F" },
                horzLines: { color: "#1F1F1F" },
            },
            rightPriceScale: { borderColor: "#2A2A2A" },
            timeScale: { borderColor: "#2A2A2A" },
        });

        chart.timeScale().applyOptions({
            timeVisible: true,
            secondsVisible: false,
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
            borderVisible: false,
        });

        // tickSize 기준으로 가격 포맷 설정
        (async () => {
            try {
                const key = sym.toUpperCase();
                let dec = 2;
                let mm = 0.01;

                if (precisionCache.current[key]) {
                    dec = precisionCache.current[key].decimals;
                    mm = precisionCache.current[key].minMove;
                } else {
                    const res = await fetch(
                        `https://api.binance.com/api/v3/exchangeInfo?symbol=${key}`
                    );
                    const info = (await res.json()) as BinanceExchangeInfo;
                    const pf = info.symbols?.[0]?.filters?.find(
                        (f) => f.filterType === "PRICE_FILTER"
                    );
                    const tick = pf?.tickSize ?? "0.01";
                    dec = decimalsFromTickSize(tick);
                    mm = minMoveFromTickSize(tick);
                    precisionCache.current[key] = {
                        decimals: dec,
                        minMove: mm,
                    };
                }

                if (!destroyed) {
                    candleSeries.applyOptions({
                        priceFormat: {
                            type: "price",
                            precision: dec,
                            minMove: mm,
                        },
                    });
                }
            } catch {
                if (!destroyed) {
                    candleSeries.applyOptions({
                        priceFormat: {
                            type: "price",
                            precision: 2,
                            minMove: 0.01,
                        },
                    });
                }
            }
        })();

        // 과거 데이터
        async function loadHistory() {
            try {
                const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${historyLimit}`;
                const res = await fetch(url);
                const rows = (await res.json()) as KlineRow[];
                if (destroyed) return;

                candleSeries.setData(
                    rows.map((d) => ({
                        time: toKstUtcTimestamp(d[0]),
                        open: parseFloat(d[1]),
                        high: parseFloat(d[2]),
                        low: parseFloat(d[3]),
                        close: parseFloat(d[4]),
                    }))
                );
            } catch (e) {
                console.error(e);
            }
        }

        // 실시간
        function openWs() {
            const stream = `${sym.toLowerCase()}@kline_${interval}`;
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                try {
                    const msg = JSON.parse(ev.data) as KlineMessage;
                    const k = msg.k;
                    candleSeries.update({
                        time: toKstUtcTimestamp(k.t),
                        open: parseFloat(k.o),
                        high: parseFloat(k.h),
                        low: parseFloat(k.l),
                        close: parseFloat(k.c),
                    });
                } catch {}
            };

            ws.onclose = () => {
                if (!destroyed) {
                    reconnectTimer = window.setTimeout(openWs, 1000);
                }
            };

            ws.onerror = () => {
                try {
                    ws?.close();
                } catch {}
            };
        }

        loadHistory()
            .then(openWs)
            .catch(() => {});

        ro = new ResizeObserver(() => {
            if (destroyed) return;
            try {
                chart.applyOptions({
                    width: el.clientWidth,
                    height: el.clientHeight,
                });
            } catch {}
        });
        ro.observe(el);

        return () => {
            destroyed = true;

            try {
                ro?.disconnect();
            } catch {}
            ro = null;

            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }

            if (ws) {
                try {
                    ws.onmessage = null;
                    ws.onclose = null;
                    ws.onerror = null;
                    ws.close();
                } catch {}
                ws = null;
            }

            try {
                chart.remove();
            } catch {}
        };
    }, [sym, interval, historyLimit]);

    const saveSymbol = async (next: string) => {
        const s = next.toUpperCase();
        setSym(s);
        if (userId) {
            await supabase
                .from("user_symbol_prefs")
                .upsert([{ user_id: userId, box_id: boxId, symbol: s }], {
                    onConflict: "user_id,box_id",
                });
        } else {
            localStorage.setItem(`chart:${boxId}`, s);
        }
    };

    return (
        <>
            {/* 바깥 래퍼: overflow-visible (툴팁이 잘리지 않게) */}
            <div
                ref={outerRef}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`relative w-full ${className ?? ""}`}
            >
                {/* 실제 차트 박스 */}
                <div
                    ref={chartRef}
                    onClick={() => setOpen(true)}
                    className="cursor-pointer w-full min-w-55 min-h-30 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900"
                    title="클릭해서 코인 심볼 변경"
                />

                {/* 툴팁 */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] z-50 w-[255px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg py-4 px-5 shadow-lg pointer-events-none"
                        >
                            <div className="font-semibold text-amber-300 mb-1">
                                심볼 변경 안내
                            </div>
                            <p className="leading-snug">
                                차트를 <b>클릭</b>하면 코인 심볼을 변경할 수
                                있습니다.
                                <br />
                                로그인 시 선택은 <b>계정에 저장</b>되며,
                                <br />
                                비로그인 시에는 <b>브라우저에 저장</b>됩니다.
                            </p>
                            {/* 테두리가 있는 삼각형 화살표 */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-neutral-700" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-neutral-900" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <SymbolPickerModal
                open={open}
                initialSymbol={sym}
                onClose={() => setOpen(false)}
                onSelect={saveSymbol}
            />
        </>
    );
}
