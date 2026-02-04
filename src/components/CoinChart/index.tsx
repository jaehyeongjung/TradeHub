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
    fadeDelay?: number;
};

const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
    { value: "1m", label: "1분" },
    { value: "5m", label: "5분" },
    { value: "15m", label: "15분" },
    { value: "1h", label: "1시간" },
    { value: "4h", label: "4시간" },
    { value: "1d", label: "1일" },
];

export default function CoinChart({
    boxId = "chart-1",
    symbol = "BTCUSDT",
    interval: defaultInterval = "1m",
    historyLimit = 200,
    className,
    fadeDelay = 0,
}: Props) {
    const outerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const [sym, setSym] = useState(symbol.toUpperCase());
    const [interval, setInterval] = useState<Interval>(defaultInterval);
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState<"dark" | "light">("light");
    const [chartLoading, setChartLoading] = useState(true);

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

    // 테마 변경 감지
    useEffect(() => {
        const html = document.documentElement;
        setTheme(html.classList.contains("light") ? "light" : "dark");

        const observer = new MutationObserver(() => {
            setTheme(html.classList.contains("light") ? "light" : "dark");
        });
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    // 유저 세션 + 저장된 심볼 불러오기
    useEffect(() => {
        let unsub: { subscription: { unsubscribe(): void } } | null = null;

        (async () => {
            const { data } = await supabase.auth.getSession();
            const uid = data.session?.user?.id ?? null;
            setUserId(uid);

            // 인터벌 불러오기 (로컬스토리지)
            const savedInterval = localStorage.getItem(`chart:${boxId}:interval`);
            if (savedInterval && INTERVAL_OPTIONS.some(o => o.value === savedInterval)) {
                setInterval(savedInterval as Interval);
            }

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

        setChartLoading(true);
        const isLight = theme === "light";

        const chart: IChartApi = createChart(el, {
            width: el.clientWidth,
            height: el.clientHeight,
            layout: {
                background: { color: isLight ? "#ffffff" : "#171717" },
                textColor: isLight ? "#333333" : "#E5E5E5",
            },
            grid: {
                vertLines: { color: isLight ? "#e0e0e0" : "#1F1F1F" },
                horzLines: { color: isLight ? "#e0e0e0" : "#1F1F1F" },
            },
            rightPriceScale: { borderColor: isLight ? "#d0d0d0" : "#2A2A2A" },
            timeScale: { borderColor: isLight ? "#d0d0d0" : "#2A2A2A" },
        });

        chart.timeScale().applyOptions({
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 0,
            lockVisibleTimeRangeOnResize: true,
            shiftVisibleRangeOnNewBar: true,
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

        // 데이터 개수 추적
        let dataLength = 0;

        // 미래 영역 스크롤 방지
        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (!range || destroyed) return;
            const maxRight = dataLength - 1;
            if (range.to > maxRight) {
                const visibleBars = range.to - range.from;
                chart.timeScale().setVisibleLogicalRange({
                    from: maxRight - visibleBars,
                    to: maxRight,
                });
            }
        });

        // 과거 데이터
        async function loadHistory() {
            try {
                const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${historyLimit}`;
                const res = await fetch(url);
                const rows = (await res.json()) as KlineRow[];
                if (destroyed) return;

                dataLength = rows.length;
                candleSeries.setData(
                    rows.map((d) => ({
                        time: toKstUtcTimestamp(d[0]),
                        open: parseFloat(d[1]),
                        high: parseFloat(d[2]),
                        low: parseFloat(d[3]),
                        close: parseFloat(d[4]),
                    }))
                );
                setChartLoading(false);
            } catch (e) {
                console.error(e);
                setChartLoading(false);
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
                    // 새 캔들이 확정되면 dataLength 증가
                    if (k.x) dataLength++;
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
    }, [sym, interval, historyLimit, theme]);

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
                <div className="relative w-full h-30 2xl:h-45">
                    <div
                        ref={chartRef}
                        className={`w-full h-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 cursor-grab active:cursor-grabbing transition-opacity duration-700 ease-in-out ${chartLoading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transitionDelay: `${fadeDelay}ms` }}
                    />
                    {/* 인터벌 선택 버튼 */}
                    <div className="absolute top-2 left-2 flex gap-0.5 bg-neutral-900/80 backdrop-blur-sm rounded-lg p-0.5 border border-neutral-700/50 z-20">
                        {INTERVAL_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setInterval(opt.value);
                                    localStorage.setItem(`chart:${boxId}:interval`, opt.value);
                                }}
                                className={`px-1.5 py-0.5 text-[10px] 2xl:text-xs rounded-md transition-all cursor-pointer ${
                                    interval === opt.value
                                        ? "bg-amber-500/20 text-amber-300 font-medium"
                                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {/* 심볼 표시 */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-sm rounded-md border border-neutral-700/50 z-20">
                        <span className="text-[10px] 2xl:text-xs text-neutral-300 font-medium">{sym}</span>
                    </div>
                    {/* 코인 변경 버튼 */}
                    <button
                        onClick={() => setOpen(true)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-neutral-900/80 backdrop-blur-sm rounded-lg border border-neutral-700/50 z-20 text-[10px] 2xl:text-xs text-neutral-400 hover:text-amber-300 hover:border-amber-500/50 transition-all cursor-pointer"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        변경
                    </button>
                </div>

                {/* 툴팁 */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] z-50 w-[295px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg py-4 px-5 shadow-lg pointer-events-none"
                        >
                            <div className="font-semibold text-amber-300 mb-1">
                                차트 사용 안내
                            </div>
                            <p className="leading-snug whitespace-nowrap">
                                • 좌측 상단에서 <b>인터벌</b>을 선택하세요.
                                <br />
                                • 우측 하단 <b>변경</b> 버튼으로 코인을 바꿀 수 있습니다.
                                <br />
                                • 차트를 <b>드래그</b>해서 과거 데이터를 확인하세요.
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
