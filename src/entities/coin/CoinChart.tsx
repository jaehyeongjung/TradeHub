"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import {
    createChart,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type UTCTimestamp,
    type IPriceLine,
    type LineWidth,
} from "lightweight-charts";
import { toKstUtcTimestamp } from "@/shared/lib/time";
import type { KlineRow, KlineMessage, Interval } from "@/shared/types/binance.types";
import type { SimPosition } from "@/shared/types/sim-trading.types";
import SymbolPickerModal from "@/components/SymbolPickerModal";
import { supabase } from "@/shared/lib/supabase-browser";
import { AnimatePresence, motion } from "framer-motion";

type IndicatorType = "MA" | "EMA" | "BB" | "RSI" | "MACD";

interface IndicatorConfig {
    id: string;
    type: IndicatorType;
    period: number;
    color: string;
    enabled: boolean;
    stdDev?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
}

const DEFAULT_COLORS: Record<IndicatorType, string> = {
    MA: "#f59e0b",
    EMA: "#3b82f6",
    BB: "#06b6d4",
    RSI: "#a855f7",
    MACD: "#2196F3",
};

const DEFAULT_PERIODS: Record<IndicatorType, number> = {
    MA: 20,
    EMA: 20,
    BB: 20,
    RSI: 14,
    MACD: 12,
};

function calcMA(data: number[], period: number): (number | null)[] {
    return data.map((_, i) => {
        if (i < period - 1) return null;
        const slice = data.slice(i - period + 1, i + 1);
        return slice.reduce((a, b) => a + b, 0) / period;
    });
}

function calcEMA(data: number[], period: number): (number | null)[] {
    if (data.length < period) return new Array(data.length).fill(null);
    const k = 2 / (period + 1);
    const result: (number | null)[] = new Array(period - 1).fill(null);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    for (let i = period; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
        result.push(ema);
    }
    return result;
}

function calcBB(data: number[], period: number, stdDev: number) {
    const middle = calcMA(data, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { upper.push(null); lower.push(null); continue; }
        const slice = data.slice(i - period + 1, i + 1);
        const mean = middle[i]!;
        const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
        const std = Math.sqrt(variance) * stdDev;
        upper.push(mean + std);
        lower.push(mean - std);
    }
    return { upper, middle, lower };
}

function calcRSI(data: number[], period: number): (number | null)[] {
    if (data.length <= period) return new Array(data.length).fill(null);
    const result: (number | null)[] = new Array(period).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff > 0) avgGain += diff;
        else avgLoss += Math.abs(diff);
    }
    avgGain /= period;
    avgLoss /= period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
        result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return result;
}

function calcMACD(data: number[], fast: number, slow: number, signal: number) {
    const emaFast = calcEMA(data, fast);
    const emaSlow = calcEMA(data, slow);
    const macdLine: (number | null)[] = emaFast.map((f, i) => {
        const s = emaSlow[i];
        return f !== null && s !== null ? f - s : null;
    });
    const validMacd = macdLine.filter((v): v is number => v !== null);
    const signalValues = calcEMA(validMacd, signal);
    const signalLine: (number | null)[] = [];
    let sigIdx = 0;
    for (const v of macdLine) {
        if (v !== null) { signalLine.push(signalValues[sigIdx] ?? null); sigIdx++; }
        else signalLine.push(null);
    }
    const histogram = macdLine.map((m, i) => {
        const sig = signalLine[i];
        return m !== null && sig !== null ? m - sig : null;
    });
    return { macdLine, signalLine, histogram };
}

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
    hideControls?: boolean;
    enableIndicators?: boolean;
    positions?: SimPosition[];
    onUpdateTpSl?: (positionId: string, tp: number | null, sl: number | null) => Promise<void>;
};

const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
    { value: "1m", label: "1분" },
    { value: "5m", label: "5분" },
    { value: "15m", label: "15분" },
    { value: "1h", label: "1시간" },
    { value: "4h", label: "4시간" },
    { value: "1d", label: "1일" },
    { value: "1w", label: "1주" },
    { value: "1M", label: "1월" },
];

interface AddForm {
    type: IndicatorType;
    period: number;
    color: string;
    stdDev: number;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
}

type DrawTool = "cursor" | "hline" | "eraser";
interface DrawnHLine { id: string; price: number; }

function defaultAddForm(type: IndicatorType): AddForm {
    return {
        type,
        period: DEFAULT_PERIODS[type],
        color: DEFAULT_COLORS[type],
        stdDev: 2,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
    };
}


export default function CoinChart({
    boxId = "chart-1",
    symbol = "BTCUSDT",
    interval: defaultInterval = "1m",
    historyLimit = 500,
    className,
    fadeDelay = 0,
    hideControls = false,
    enableIndicators = false,
    positions,
    onUpdateTpSl,
}: Props) {
    const outerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const draggingRef = useRef<{ posId: string; type: "tp" | "sl"; line: IPriceLine } | null>(null);
    const tpSlLinesRef = useRef<Array<{ posId: string; type: "tp" | "sl"; line: IPriceLine }>>([]);
    const onUpdateTpSlRef = useRef(onUpdateTpSl);
    onUpdateTpSlRef.current = onUpdateTpSl;
    const positionsRef = useRef(positions);
    positionsRef.current = positions;

    const candleDataRef = useRef<CandlestickData<UTCTimestamp>[]>([]);
    const indicatorSeriesMapRef = useRef<Map<string, ISeriesApi<any>[]>>(new Map());

    const hlPriceLineRefs = useRef<Map<string, IPriceLine>>(new Map());
    const drawToolRef = useRef<DrawTool>("cursor");
    const drawnHLinesRef = useRef<DrawnHLine[]>([]);
    const drawDragRef = useRef<{ type: "hline"; id: string } | null>(null);

    const [sym, setSym] = useState(symbol.toUpperCase());
    const [interval, setInterval] = useState<Interval>(defaultInterval);
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const isLight = useTheme();
    const [chartLoading, setChartLoading] = useState(true);
    const [candleDataVersion, setCandleDataVersion] = useState(0);

    const drawStorageKey = `chart:${boxId}:drawings`;
    const [drawTool, setDrawTool] = useState<DrawTool>("cursor");
    const [drawnHLines, setDrawnHLines] = useState<DrawnHLine[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const saved = JSON.parse(localStorage.getItem(`chart:${boxId}:drawings`) ?? "{}");
            return Array.isArray(saved.hlines) ? saved.hlines : [];
        } catch { return []; }
    });

    drawToolRef.current = drawTool;
    drawnHLinesRef.current = drawnHLines;

    const indicatorStorageKey = `chart:${boxId}:indicators`;
    const [activeIndicators, setActiveIndicators] = useState<IndicatorConfig[]>(() => {
        if (!enableIndicators) return [];
        try {
            return JSON.parse(localStorage.getItem(indicatorStorageKey) ?? "[]") as IndicatorConfig[];
        } catch { return []; }
    });
    const [indicatorPanelOpen, setIndicatorPanelOpen] = useState(false);
    const [addForm, setAddForm] = useState<AddForm | null>(null);

    const precisionCache = useRef<Record<string, { decimals: number; minMove: number }>>({});

    useEffect(() => { setSym(symbol.toUpperCase()); }, [symbol]);

    useEffect(() => {
        if (!enableIndicators) return;
        localStorage.setItem(indicatorStorageKey, JSON.stringify(activeIndicators));
    }, [activeIndicators, enableIndicators, indicatorStorageKey]);

    useEffect(() => {
        if (!enableIndicators) return;
        localStorage.setItem(drawStorageKey, JSON.stringify({ hlines: drawnHLines }));
    }, [drawnHLines, enableIndicators, drawStorageKey]);

    useEffect(() => {
        const series = candleSeriesRef.current;
        if (!series) return;
        hlPriceLineRefs.current.forEach((line) => { try { series.removePriceLine(line); } catch {} });
        hlPriceLineRefs.current.clear();
        drawnHLines.forEach((h) => {
            try {
                const line = series.createPriceLine({ price: h.price, color: "#f59e0b", lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true, title: "" });
                hlPriceLineRefs.current.set(h.id, line);
            } catch {}
        });
    }, [drawnHLines, candleDataVersion]);

    useEffect(() => {
        const el = chartRef.current;
        if (!el) return;

        let mdPos: { x: number; y: number } | null = null;

        function getCoords(e: MouseEvent) {
            const chart = chartApiRef.current;
            const series = candleSeriesRef.current;
            if (!chart || !series) return null;
            const rect = el!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clampedY = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top));
            const price = series.coordinateToPrice(clampedY) ?? series.coordinateToPrice(clampedY - 30);
            if (price === null) return null;
            let timeVal = chart.timeScale().coordinateToTime(x) as number | null;
            if (timeVal === null) {
                const mouseLl = chart.timeScale().coordinateToLogical(x);
                if (mouseLl === null) return null;
                let t1: number | null = null, l1: number | null = null;
                let t2: number | null = null, l2: number | null = null;
                for (let sx = Math.min(Math.floor(x) - 1, rect.width - 1); sx >= 0; sx--) {
                    const t = chart.timeScale().coordinateToTime(sx) as number | null;
                    if (t !== null) {
                        const ll = chart.timeScale().coordinateToLogical(sx);
                        if (ll !== null) {
                            const li = Math.round(ll);
                            if (t1 === null) { t1 = t; l1 = li; }
                            else if (li !== l1) { t2 = t; l2 = li; break; }
                        }
                    }
                }
                if (t1 === null || t2 === null || l1 === null || l2 === null || l1 === l2) return null;
                const timePerLogical = (t1 - t2) / (l1 - l2);
                timeVal = Math.round(t1 + timePerLogical * (mouseLl - l1));
            }
            return { price, time: timeVal as number };
        }

        function onMouseMove(e: MouseEvent) {
            const coords = getCoords(e);

            const drag = drawDragRef.current;
            if (drag) {
                if (!coords) return;
                const ln = hlPriceLineRefs.current.get(drag.id);
                if (ln) {
                    try { ln.applyOptions({ price: coords.price }); } catch {}
                    drawnHLinesRef.current = drawnHLinesRef.current.map(
                        h => h.id === drag.id ? { ...h, price: coords.price } : h
                    );
                }
                return;
            }

            const tool = drawToolRef.current;
            if (tool === "cursor") {
                const pa = candleSeriesRef.current?.coordinateToPrice(e.clientY - el!.getBoundingClientRect().top - 8);
                const pb = candleSeriesRef.current?.coordinateToPrice(e.clientY - el!.getBoundingClientRect().top + 8);
                const TOL = pa != null && pb != null ? Math.abs(pa - pb) / 2 : 0.01 * Math.abs(coords?.price || 1);
                const nearH = coords ? drawnHLinesRef.current.some(h => Math.abs(h.price - coords.price) <= TOL) : false;
                el!.style.cursor = nearH ? "ns-resize" : "";
            } else {
                el!.style.cursor = "";
            }
        }

        function onMouseDown(e: MouseEvent) {
            mdPos = { x: e.clientX, y: e.clientY };
            const tool = drawToolRef.current;
            if (tool !== "cursor") return;
            const coords = getCoords(e);
            if (!coords) return;
            const rect2 = el!.getBoundingClientRect();
            const pa2 = candleSeriesRef.current?.coordinateToPrice(e.clientY - rect2.top - 8);
            const pb2 = candleSeriesRef.current?.coordinateToPrice(e.clientY - rect2.top + 8);
            const TOL = pa2 != null && pb2 != null ? Math.abs(pa2 - pb2) / 2 : 0.01 * Math.abs(coords.price || 1);

            const hlines = drawnHLinesRef.current;
            const hi = hlines.findIndex(h => Math.abs(h.price - coords.price) <= TOL);
            if (hi >= 0) {
                drawDragRef.current = { type: "hline", id: hlines[hi].id };
                e.stopPropagation();
                return;
            }
        }

        function onMouseUp(e: MouseEvent) {
            el!.style.cursor = "";
            const drag = drawDragRef.current;
            if (drag) {
                setDrawnHLines([...drawnHLinesRef.current]);
                drawDragRef.current = null;
                mdPos = null;
                return;
            }

            if (!mdPos) return;
            const dist = Math.hypot(e.clientX - mdPos.x, e.clientY - mdPos.y);
            mdPos = null;
            if (dist > 5) return;

            const tool = drawToolRef.current;
            if (tool === "cursor") return;
            const series = candleSeriesRef.current;
            if (!series) return;
            const coords = getCoords(e);
            if (!coords) return;
            const { price } = coords;

            if (tool === "hline") {
                setDrawnHLines(prev => [...prev, { id: crypto.randomUUID(), price }]);
            } else if (tool === "eraser") {
                const rect = el!.getBoundingClientRect();
                const pxTol = 12;
                const priceAbove = series.coordinateToPrice(e.clientY - rect.top - pxTol);
                const priceBelow = series.coordinateToPrice(e.clientY - rect.top + pxTol);
                const TOL = priceAbove !== null && priceBelow !== null
                    ? Math.abs(priceAbove - priceBelow) / 2
                    : 0.01 * Math.abs(price || 1);

                const hlines = drawnHLinesRef.current;
                const hi = hlines.findIndex(h => Math.abs(h.price - price) <= TOL);
                if (hi >= 0) {
                    const id = hlines[hi].id;
                    const ln = hlPriceLineRefs.current.get(id);
                    if (ln) { try { series.removePriceLine(ln); } catch {} hlPriceLineRefs.current.delete(id); }
                    setDrawnHLines(prev => prev.filter(h => h.id !== id));
                }
            }
        }

        window.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mousedown", onMouseDown, { capture: true });
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mousedown", onMouseDown, { capture: true });
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

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

    useEffect(() => {
        const savedInterval = localStorage.getItem(`chart:${boxId}:interval`);
        if (savedInterval && INTERVAL_OPTIONS.some((o) => o.value === savedInterval)) {
            setInterval(savedInterval as Interval);
        }
        if (hideControls) return;

        let unsub: { subscription: { unsubscribe(): void } } | null = null;
        (async () => {
            const { data } = await supabase.auth.getSession();
            const uid = data.session?.user?.id ?? null;
            setUserId(uid);
            if (uid) {
                const { data: row } = await supabase
                    .from("user_symbol_prefs").select("symbol")
                    .eq("user_id", uid).eq("box_id", boxId).maybeSingle();
                if (row?.symbol) setSym(String(row.symbol).toUpperCase());
            } else {
                const loc = localStorage.getItem(`chart:${boxId}`);
                if (loc) setSym(loc.toUpperCase());
            }
            const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
                const nuid = s?.user?.id ?? null;
                setUserId(nuid);
                if (nuid) {
                    supabase.from("user_symbol_prefs").select("symbol")
                        .eq("user_id", nuid).eq("box_id", boxId).maybeSingle()
                        .then(({ data: r }) => { if (r?.symbol) setSym(String(r.symbol).toUpperCase()); });
                } else {
                    const l = localStorage.getItem(`chart:${boxId}`);
                    if (l) setSym(l.toUpperCase());
                }
            });
            unsub = sub;
        })();
        return () => { unsub?.subscription.unsubscribe(); };
    }, [boxId, hideControls]);

    useEffect(() => {
        const el = chartRef.current;
        if (!el) return;

        let destroyed = false;
        let ws: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let ro: ResizeObserver | null = null;

        setChartLoading(true);


        const chart: IChartApi = createChart(el, {
            width: el.clientWidth,
            height: el.clientHeight,
            layout: {
                background: { color: isLight ? "#ffffff" : "#111C2D" },
                textColor: isLight ? "#333333" : "#A8B4C8" ,
            },
            grid: {
                vertLines: { color: isLight ? "#e0e0e0" : "#17243A" },
                horzLines: { color: isLight ? "#e0e0e0" : "#17243A" },
            },
            rightPriceScale: { borderColor: isLight ? "#d0d0d0" : "#1F2D40" },
            timeScale: { borderColor: isLight ? "#d0d0d0" : "#1F2D40" },
        });
        chartApiRef.current = chart;

        chart.timeScale().applyOptions({
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 20,
            lockVisibleTimeRangeOnResize: true,
            shiftVisibleRangeOnNewBar: true,
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#02C076",
            downColor: "#F75467",
            wickUpColor: "#02C076",
            wickDownColor: "#F75467",
            borderVisible: false,
        });
        candleSeriesRef.current = candleSeries;

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
            lastValueVisible: false,
            priceLineVisible: false,
        });
        chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false,
        });

        (async () => {
            try {
                const key = sym.toUpperCase();
                let dec = 2, mm = 0.01;
                if (precisionCache.current[key]) {
                    dec = precisionCache.current[key].decimals;
                    mm = precisionCache.current[key].minMove;
                } else {
                    const res = await fetch(`https://api.binance.com/api/v3/exchangeInfo?symbol=${key}`);
                    const info = (await res.json()) as BinanceExchangeInfo;
                    const pf = info.symbols?.[0]?.filters?.find((f) => f.filterType === "PRICE_FILTER");
                    const tick = pf?.tickSize ?? "0.01";
                    dec = decimalsFromTickSize(tick);
                    mm = minMoveFromTickSize(tick);
                    precisionCache.current[key] = { decimals: dec, minMove: mm };
                }
                if (!destroyed) {
                    candleSeries.applyOptions({ priceFormat: { type: "price", precision: dec, minMove: mm } });
                }
            } catch {
                if (!destroyed) {
                    candleSeries.applyOptions({ priceFormat: { type: "price", precision: 2, minMove: 0.01 } });
                }
            }
        })();

        let dataLength = 0;
        let oldestTime = 0;
        let isLoadingMore = false;
        let allDataLoaded = false;

        chart.timeScale().subscribeVisibleLogicalRangeChange(async (range) => {
            if (!range || destroyed) return;
            const maxRight = dataLength - 1;
            const visibleBars = range.to - range.from;
            const maxAllowedRight = maxRight + Math.floor(visibleBars / 3);
            if (range.to > maxAllowedRight) {
                chart.timeScale().setVisibleLogicalRange({ from: maxAllowedRight - visibleBars, to: maxAllowedRight });
            }
            if (range.from < 20 && !isLoadingMore && !allDataLoaded && oldestTime > 0) {
                isLoadingMore = true;
                try {
                    const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&endTime=${oldestTime - 1}&limit=${historyLimit}`;
                    const res = await fetch(url);
                    const rows = (await res.json()) as KlineRow[];
                    if (destroyed) return;
                    if (!rows || rows.length === 0) { allDataLoaded = true; return; }

                    const currentData = candleSeries.data() as CandlestickData<UTCTimestamp>[];
                    const currentVolData = volumeSeries.data() as Array<{ time: UTCTimestamp; value: number; color: string }>;

                    const newData: CandlestickData<UTCTimestamp>[] = rows.map((d) => ({
                        time: toKstUtcTimestamp(d[0]) as UTCTimestamp,
                        open: parseFloat(d[1]),
                        high: parseFloat(d[2]),
                        low: parseFloat(d[3]),
                        close: parseFloat(d[4]),
                    }));
                    const newVolData = rows.map((d) => {
                        const o = parseFloat(d[1]), c = parseFloat(d[4]);
                        return { time: toKstUtcTimestamp(d[0]) as UTCTimestamp, value: parseFloat(d[5]), color: c >= o ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)" };
                    });

                    const existingTimes = new Set(currentData.map((d) => d.time));
                    const uniqueNewData = newData.filter((d) => !existingTimes.has(d.time));
                    const uniqueNewVolData = newVolData.filter((d) => !existingTimes.has(d.time));

                    if (uniqueNewData.length === 0) { allDataLoaded = true; return; }

                    const mergedData = [...uniqueNewData, ...currentData];
                    const mergedVolData = [...uniqueNewVolData, ...currentVolData];
                    candleSeries.setData(mergedData);
                    volumeSeries.setData(mergedVolData);
                    dataLength = mergedData.length;
                    oldestTime = rows[0][0] as number;

                    candleDataRef.current = mergedData;
                    setCandleDataVersion((v) => v + 1);

                    const addedBars = uniqueNewData.length;
                    chart.timeScale().setVisibleLogicalRange({ from: range.from + addedBars, to: range.to + addedBars });
                } catch (e) {
                    console.error("Failed to load more data:", e);
                } finally {
                    isLoadingMore = false;
                }
            }
        });

        async function loadHistory() {
            try {
                const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${historyLimit}`;
                const res = await fetch(url);
                const rows = (await res.json()) as KlineRow[];
                if (destroyed) return;

                dataLength = rows.length;
                if (rows.length > 0) oldestTime = rows[0][0] as number;

                const candles = rows.map((d) => ({
                    time: toKstUtcTimestamp(d[0]) as UTCTimestamp,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }));
                candleSeries.setData(candles);
                volumeSeries.setData(rows.map((d) => {
                    const o = parseFloat(d[1]), c = parseFloat(d[4]);
                    return { time: toKstUtcTimestamp(d[0]), value: parseFloat(d[5]), color: c >= o ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)" };
                }));

                candleDataRef.current = candles;
                setCandleDataVersion((v) => v + 1);
                setChartLoading(false);
            } catch (e) {
                console.error(e);
                setChartLoading(false);
            }
        }

        function openWs() {
            const stream = `${sym.toLowerCase()}@kline_${interval}`;
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
            ws.onmessage = (ev: MessageEvent<string>) => {
                if (destroyed) return;
                try {
                    const msg = JSON.parse(ev.data) as KlineMessage;
                    const k = msg.k;
                    const newCandle = {
                        time: toKstUtcTimestamp(k.t) as UTCTimestamp,
                        open: parseFloat(k.o),
                        high: parseFloat(k.h),
                        low: parseFloat(k.l),
                        close: parseFloat(k.c),
                    };
                    candleSeries.update(newCandle);
                    const kOpen = parseFloat(k.o), kClose = parseFloat(k.c);
                    volumeSeries.update({ time: toKstUtcTimestamp(k.t), value: parseFloat(k.v), color: kClose >= kOpen ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)" });

                    if (k.x) {
                        dataLength++;
                        const existing = candleDataRef.current;
                        const idx = existing.findIndex((d) => d.time === newCandle.time);
                        if (idx >= 0) {
                            candleDataRef.current = [...existing.slice(0, idx), newCandle, ...existing.slice(idx + 1)];
                        } else {
                            candleDataRef.current = [...existing, newCandle];
                        }
                        setCandleDataVersion((v) => v + 1);
                    }
                } catch (e) { console.error("[CoinChart] ws kline parse error:", e); }
            };
            ws.onclose = () => { if (!destroyed) reconnectTimer = window.setTimeout(openWs, 1000); };
            ws.onerror = () => { try { ws?.close(); } catch {} };
        }

        loadHistory().then(openWs).catch((e) => console.error("[CoinChart] loadHistory error:", e));

        ro = new ResizeObserver(() => {
            if (destroyed) return;
            try { chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }); } catch {}
        });
        ro.observe(el);

        return () => {
            destroyed = true;
            candleSeriesRef.current = null;
            chartApiRef.current = null;
            priceLinesRef.current = [];
            tpSlLinesRef.current = [];
            indicatorSeriesMapRef.current.clear();
            try { ro?.disconnect(); } catch {}
            ro = null;
            if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
            if (ws) {
                try { ws.onmessage = null; ws.onclose = null; ws.onerror = null; ws.close(); } catch {}
                ws = null;
            }
            try { chart.remove(); } catch {}
        };
    }, [sym, interval, historyLimit, isLight]);

    useEffect(() => {
        const chart = chartApiRef.current;
        const candles = candleDataRef.current;
        const seriesMap = indicatorSeriesMapRef.current;
        if (!chart || candles.length === 0) return;

        for (const seriesList of seriesMap.values()) {
            for (const s of seriesList) {
                try { chart.removeSeries(s); } catch {}
            }
        }
        seriesMap.clear();

        while (chart.panes().length > 1) {
            try { chart.removePane(chart.panes().length - 1); } catch { break; }
        }

        if (activeIndicators.length === 0) return;

        const closes = candles.map((c) => c.close);
        const times = candles.map((c) => c.time);

        const toSeries = (values: (number | null)[]) =>
            values
                .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
                .filter(Boolean) as { time: UTCTimestamp; value: number }[];

        for (const ind of activeIndicators.filter((i) => i.enabled)) {
            const seriesList: ISeriesApi<any>[] = [];

            try {
                switch (ind.type) {
                    case "MA": {
                        const s = chart.addSeries(LineSeries, {
                            color: ind.color, lineWidth: 1 as LineWidth,
                            priceLineVisible: false, lastValueVisible: false,
                            crosshairMarkerVisible: false,
                            title: `MA${ind.period}`,
                        });
                        s.setData(toSeries(calcMA(closes, ind.period)));
                        seriesList.push(s);
                        break;
                    }
                    case "EMA": {
                        const s = chart.addSeries(LineSeries, {
                            color: ind.color, lineWidth: 1 as LineWidth,
                            priceLineVisible: false, lastValueVisible: false,
                            crosshairMarkerVisible: false,
                            title: `EMA${ind.period}`,
                        });
                        s.setData(toSeries(calcEMA(closes, ind.period)));
                        seriesList.push(s);
                        break;
                    }
                    case "BB": {
                        const { upper, middle, lower } = calcBB(closes, ind.period, ind.stdDev ?? 2);
                        const opts = { color: ind.color, lineWidth: 1 as LineWidth, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
                        const uS = chart.addSeries(LineSeries, { ...opts, title: `BB상단` });
                        const mS = chart.addSeries(LineSeries, { ...opts, lineStyle: 2, title: `BB중간` });
                        const lS = chart.addSeries(LineSeries, { ...opts, title: `BB하단` });
                        uS.setData(toSeries(upper));
                        mS.setData(toSeries(middle));
                        lS.setData(toSeries(lower));
                        seriesList.push(uS, mS, lS);
                        break;
                    }
                    case "RSI": {
                        const pane = chart.addPane();
                        pane.setHeight(120);
                        const s = pane.addSeries(LineSeries, {
                            color: ind.color, lineWidth: 1 as LineWidth,
                            priceLineVisible: false, lastValueVisible: true,
                            title: `RSI${ind.period}`,
                            priceFormat: { type: "price", precision: 2 },
                        });
                        s.setData(toSeries(calcRSI(closes, ind.period)));
                        s.createPriceLine({ price: 70, color: "rgba(239,83,80,0.5)", lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true, title: "70" });
                        s.createPriceLine({ price: 30, color: "rgba(38,166,154,0.5)", lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true, title: "30" });
                        seriesList.push(s);
                        break;
                    }
                    case "MACD": {
                        const { macdLine, signalLine, histogram } = calcMACD(closes, ind.fastPeriod ?? 12, ind.slowPeriod ?? 26, ind.signalPeriod ?? 9);
                        const pane = chart.addPane();
                        pane.setHeight(120);
                        const macdS = pane.addSeries(LineSeries, { color: "#2196F3", lineWidth: 1 as LineWidth, priceLineVisible: false, lastValueVisible: true, title: "MACD" });
                        const signalS = pane.addSeries(LineSeries, { color: "#FF9800", lineWidth: 1 as LineWidth, priceLineVisible: false, lastValueVisible: true, title: "Signal" });
                        const histS = pane.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, title: "Hist" });
                        macdS.setData(toSeries(macdLine));
                        signalS.setData(toSeries(signalLine));
                        histS.setData(
                            histogram
                                .map((v, i) => v !== null ? { time: times[i], value: v, color: v >= 0 ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)" } : null)
                                .filter(Boolean) as { time: UTCTimestamp; value: number; color: string }[]
                        );
                        seriesList.push(macdS, signalS, histS);
                        break;
                    }
                }
            } catch (e) {
                console.error(`Failed to render indicator ${ind.type}:`, e);
            }

            seriesMap.set(ind.id, seriesList);
        }
    }, [candleDataVersion, activeIndicators]);

    useEffect(() => {
        const series = candleSeriesRef.current;
        if (!series || !positions) return;

        for (const line of priceLinesRef.current) {
            try { series.removePriceLine(line); } catch {}
        }
        priceLinesRef.current = [];
        tpSlLinesRef.current = [];

        const currentPositions = positions.filter((p) => p.symbol === sym && p.status === "OPEN");

        for (const pos of currentPositions) {
            const isLong = pos.side === "LONG";
            const entryLine = series.createPriceLine({
                price: pos.entry_price, color: isLong ? "#26a69a" : "#ef5350",
                lineWidth: 1 as LineWidth, lineStyle: 1, axisLabelVisible: true,
                title: isLong ? "▲ 진입" : "▼ 진입",
            });
            priceLinesRef.current.push(entryLine);

            if (pos.liq_price > 0) {
                const liqLine = series.createPriceLine({
                    price: pos.liq_price, color: "#f97316",
                    lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true,
                    title: "청산",
                });
                priceLinesRef.current.push(liqLine);
            }
            if (pos.tp_price && pos.tp_price > 0) {
                const tpLine = series.createPriceLine({
                    price: pos.tp_price, color: "#22c55e",
                    lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true,
                    title: "TP",
                });
                priceLinesRef.current.push(tpLine);
                tpSlLinesRef.current.push({ posId: pos.id, type: "tp", line: tpLine });
            }
            if (pos.sl_price && pos.sl_price > 0) {
                const slLine = series.createPriceLine({
                    price: pos.sl_price, color: "#ef4444",
                    lineWidth: 1 as LineWidth, lineStyle: 2, axisLabelVisible: true,
                    title: "SL",
                });
                priceLinesRef.current.push(slLine);
                tpSlLinesRef.current.push({ posId: pos.id, type: "sl", line: slLine });
            }
        }
    }, [positions, sym]);

    useEffect(() => {
        const el = chartRef.current;
        if (!el || !onUpdateTpSl) return;

        const DRAG_THRESHOLD_PX = 10;

        const handleMouseDown = (e: MouseEvent) => {
            const series = candleSeriesRef.current;
            if (!series || tpSlLinesRef.current.length === 0) return;
            const rect = el.getBoundingClientRect();
            const y = e.clientY - rect.top;
            for (const item of tpSlLinesRef.current) {
                const lineY = series.priceToCoordinate(item.line.options().price);
                if (lineY !== null && Math.abs(y - (lineY as number)) < DRAG_THRESHOLD_PX) {
                    draggingRef.current = { posId: item.posId, type: item.type, line: item.line };
                    el.style.cursor = "grabbing";
                    chartApiRef.current?.applyOptions({ handleScroll: { pressedMouseMove: false } });
                    e.preventDefault(); e.stopPropagation(); return;
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const series = candleSeriesRef.current;
            if (!series) return;
            if (!draggingRef.current) {
                const rect = el.getBoundingClientRect();
                const y = e.clientY - rect.top;
                let near = false;
                for (const item of tpSlLinesRef.current) {
                    const lineY = series.priceToCoordinate(item.line.options().price);
                    if (lineY !== null && Math.abs(y - (lineY as number)) < DRAG_THRESHOLD_PX) { near = true; break; }
                }
                el.style.cursor = near ? "grab" : "";
                return;
            }
            const rect = el.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const newPrice = series.coordinateToPrice(y);
            if (newPrice !== null && (newPrice as number) > 0) {
                const drag = draggingRef.current;
                drag.line.applyOptions({ price: newPrice as number, title: `${drag.type.toUpperCase()} $${(newPrice as number).toLocaleString(undefined, { maximumFractionDigits: 2 })}` });
            }
        };

        const handleMouseUp = async () => {
            if (!draggingRef.current) return;
            const drag = draggingRef.current;
            const finalPrice = drag.line.options().price;
            draggingRef.current = null;
            el.style.cursor = "";
            chartApiRef.current?.applyOptions({ handleScroll: { pressedMouseMove: true } });
            const pos = positionsRef.current?.find((p) => p.id === drag.posId);
            if (!pos) return;
            const newTp = drag.type === "tp" ? finalPrice : (pos.tp_price ?? null);
            const newSl = drag.type === "sl" ? finalPrice : (pos.sl_price ?? null);
            try { await onUpdateTpSlRef.current?.(drag.posId, newTp, newSl); } catch (e) { console.error(e); }
        };

        el.addEventListener("mousedown", handleMouseDown, true);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            el.removeEventListener("mousedown", handleMouseDown, true);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [positions, sym, onUpdateTpSl]);

    const saveSymbol = async (next: string) => {
        const s = next.toUpperCase();
        setSym(s);
        if (userId) {
            await supabase.from("user_symbol_prefs")
                .upsert([{ user_id: userId, box_id: boxId, symbol: s }], { onConflict: "user_id,box_id" });
        } else {
            localStorage.setItem(`chart:${boxId}`, s);
        }
    };

    const addIndicator = () => {
        if (!addForm) return;
        const newInd: IndicatorConfig = {
            id: `${addForm.type}-${Date.now()}`,
            type: addForm.type,
            period: addForm.period,
            color: addForm.color,
            enabled: true,
            stdDev: addForm.stdDev,
            fastPeriod: addForm.fastPeriod,
            slowPeriod: addForm.slowPeriod,
            signalPeriod: addForm.signalPeriod,
        };
        setActiveIndicators((prev) => [...prev, newInd]);
        setAddForm(null);
    };

    const removeIndicator = (id: string) => {
        setActiveIndicators((prev) => prev.filter((i) => i.id !== id));
    };

    const toggleIndicator = (id: string) => {
        setActiveIndicators((prev) => prev.map((i) => i.id === id ? { ...i, enabled: !i.enabled } : i));
    };

    const clearAllDrawings = () => {
        const series = candleSeriesRef.current;
        hlPriceLineRefs.current.forEach((line) => { try { series?.removePriceLine(line); } catch {} });
        hlPriceLineRefs.current.clear();
        setDrawnHLines([]);
    };

    const indicatorLabel = (ind: IndicatorConfig) => {
        switch (ind.type) {
            case "MA": return `MA(${ind.period})`;
            case "EMA": return `EMA(${ind.period})`;
            case "BB": return `BB(${ind.period}, ${ind.stdDev ?? 2})`;
            case "RSI": return `RSI(${ind.period})`;
            case "MACD": return `MACD(${ind.fastPeriod ?? 12},${ind.slowPeriod ?? 26},${ind.signalPeriod ?? 9})`;
        }
    };

    return (
        <>
            <div
                ref={outerRef}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`relative w-full ${className ?? ""}`}
            >
                <div className={`relative w-full ${className ? "h-full" : "h-30 2xl:h-45"}`}>
                    <div
                        ref={chartRef}
                        className={`w-full h-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 transition-[opacity,transform] duration-700 ${drawTool === "cursor" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"} ${chartLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
                        style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />

                    <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                        {!hideControls && (
                            <div className="px-2 py-0.5 bg-neutral-900/80 backdrop-blur-sm rounded-md border border-neutral-700/50">
                                <span className="text-[10px] 2xl:text-xs text-neutral-300 font-medium">{sym}</span>
                            </div>
                        )}
                        <div className="flex gap-0.5 bg-neutral-900/80 backdrop-blur-sm rounded-lg p-0.5 border border-neutral-700/50">
                            {INTERVAL_OPTIONS.filter(opt => enableIndicators || (opt.value !== "1w" && opt.value !== "1M")).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setInterval(opt.value);
                                        localStorage.setItem(`chart:${boxId}:interval`, opt.value);
                                    }}
                                    className={`px-1.5 py-0.5 text-[10px] 2xl:text-xs rounded-md transition-all cursor-pointer ${interval === opt.value ? "bg-amber-500/20 text-amber-300 font-medium" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {enableIndicators && (
                            <div className="flex items-center gap-0.5 bg-neutral-900/80 backdrop-blur-sm rounded-lg p-0.5 border border-neutral-700/50">
                                <button
                                    title="커서"
                                    onClick={() => setDrawTool("cursor")}
                                    className={`p-1 rounded-md transition-all cursor-pointer ${drawTool === "cursor" ? "bg-amber-500/20 text-amber-300" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                                    </svg>
                                </button>
                                <button
                                    title="수평선 (지지/저항)"
                                    onClick={() => setDrawTool("hline")}
                                    className={`p-1 rounded-md transition-all cursor-pointer ${drawTool === "hline" ? "bg-amber-500/20 text-amber-300" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
                                    </svg>
                                </button>
                                <button
                                    title="지우개"
                                    onClick={() => setDrawTool("eraser")}
                                    className={`p-1 rounded-md transition-all cursor-pointer ${drawTool === "eraser" ? "bg-amber-500/20 text-amber-300" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                {drawnHLines.length > 0 && (
                                    <button
                                        title="전체 삭제"
                                        onClick={clearAllDrawings}
                                        className="p-1 rounded-md transition-all cursor-pointer text-neutral-600 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {enableIndicators && <div className="relative">
                            <button
                                onClick={() => { setIndicatorPanelOpen((v) => !v); setAddForm(null); }}
                                className={`flex items-center gap-1 px-2 py-1 text-[10px] 2xl:text-xs rounded-lg border transition-all cursor-pointer backdrop-blur-sm ${indicatorPanelOpen ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "bg-neutral-900/80 text-neutral-400 border-neutral-700/50 hover:text-neutral-200"}`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                지표
                                {activeIndicators.filter((i) => i.enabled).length > 0 && (
                                    <span className="bg-amber-500 text-neutral-900 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {activeIndicators.filter((i) => i.enabled).length}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {indicatorPanelOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-[calc(100%+6px)] left-0 z-50 w-64 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
                                            <span className="text-[11px] font-semibold text-neutral-200">기술적 지표</span>
                                            <button onClick={() => { setIndicatorPanelOpen(false); setAddForm(null); }} className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="py-1 max-h-[200px] overflow-y-auto">
                                            {activeIndicators.length === 0 && !addForm && (
                                                <div className="px-3 py-4 text-center text-[11px] text-neutral-500">
                                                    추가된 지표가 없습니다
                                                </div>
                                            )}
                                            {activeIndicators.map((ind) => (
                                                <div key={ind.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800/50 group">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ind.color }} />
                                                    <span className="flex-1 text-[11px] text-neutral-300">{indicatorLabel(ind)}</span>
                                                    <button
                                                        onClick={() => toggleIndicator(ind.id)}
                                                        className={`w-7 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${ind.enabled ? "bg-amber-500" : "bg-neutral-700"}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${ind.enabled ? "left-3.5" : "left-0.5"}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeIndicator(ind.id)}
                                                        className="text-neutral-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {addForm ? (
                                            <div className="border-t border-neutral-800 px-3 py-2.5 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">종류</span>
                                                    <select
                                                        value={addForm.type}
                                                        onChange={(e) => setAddForm(defaultAddForm(e.target.value as IndicatorType))}
                                                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 cursor-pointer outline-none"
                                                    >
                                                        <option value="MA">MA (이동평균)</option>
                                                        <option value="EMA">EMA (지수이동평균)</option>
                                                        <option value="BB">BB (볼린저밴드)</option>
                                                        <option value="RSI">RSI</option>
                                                        <option value="MACD">MACD</option>
                                                    </select>
                                                </div>

                                                {addForm.type !== "MACD" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">기간</span>
                                                        <input
                                                            type="number"
                                                            min={2} max={500}
                                                            value={addForm.period}
                                                            onChange={(e) => setAddForm((f) => f ? { ...f, period: parseInt(e.target.value) || 20 } : f)}
                                                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {addForm.type === "BB" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">표준편차</span>
                                                        <input
                                                            type="number"
                                                            min={0.5} max={5} step={0.5}
                                                            value={addForm.stdDev}
                                                            onChange={(e) => setAddForm((f) => f ? { ...f, stdDev: parseFloat(e.target.value) || 2 } : f)}
                                                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {addForm.type === "MACD" && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">Fast</span>
                                                            <input type="number" min={2} max={100} value={addForm.fastPeriod}
                                                                onChange={(e) => setAddForm((f) => f ? { ...f, fastPeriod: parseInt(e.target.value) || 12 } : f)}
                                                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 outline-none" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">Slow</span>
                                                            <input type="number" min={2} max={200} value={addForm.slowPeriod}
                                                                onChange={(e) => setAddForm((f) => f ? { ...f, slowPeriod: parseInt(e.target.value) || 26 } : f)}
                                                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 outline-none" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">Signal</span>
                                                            <input type="number" min={2} max={100} value={addForm.signalPeriod}
                                                                onChange={(e) => setAddForm((f) => f ? { ...f, signalPeriod: parseInt(e.target.value) || 9 } : f)}
                                                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-[11px] text-neutral-200 outline-none" />
                                                        </div>
                                                    </>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-neutral-500 w-12 flex-shrink-0">색상</span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={addForm.color}
                                                            onChange={(e) => setAddForm((f) => f ? { ...f, color: e.target.value } : f)}
                                                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                                                        />
                                                        <span className="text-[10px] text-neutral-500">{addForm.color}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={addIndicator}
                                                        className="flex-1 py-1.5 text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer"
                                                    >
                                                        추가
                                                    </button>
                                                    <button
                                                        onClick={() => setAddForm(null)}
                                                        className="flex-1 py-1.5 text-[11px] text-neutral-400 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border-t border-neutral-800 p-2">
                                                <button
                                                    onClick={() => setAddForm(defaultAddForm("MA"))}
                                                    className="w-full py-1.5 text-[11px] text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10 border border-neutral-700 hover:border-amber-500/30 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    지표 추가
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>}
                    </div>

                    {!hideControls && (
                        <button
                            onClick={() => setOpen(true)}
                            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-neutral-900/80 backdrop-blur-sm rounded-lg border border-neutral-700/50 z-20 text-[10px] 2xl:text-xs text-neutral-400 hover:text-amber-300 hover:border-amber-500/50 transition-all cursor-pointer"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            변경
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {hovered && !hideControls && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] z-50 w-[295px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg py-4 px-5 shadow-lg pointer-events-none"
                        >
                            <div className="font-semibold text-amber-300 mb-1">차트 사용 안내</div>
                            <p className="leading-snug whitespace-nowrap">
                                • 좌측 상단에서 <b>인터벌</b>을 선택하세요.
                                <br />• <b>지표</b> 버튼으로 기술적 지표를 추가하세요.
                                <br />• 우측 하단 <b>변경</b> 버튼으로 코인을 바꿀 수 있습니다.
                                <br />• 차트를 <b>드래그</b>해서 과거 데이터를 확인하세요.
                            </p>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-neutral-700" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-neutral-900" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!hideControls && (
                <SymbolPickerModal open={open} initialSymbol={sym} onClose={() => setOpen(false)} onSelect={saveSymbol} />
            )}
        </>
    );
}
