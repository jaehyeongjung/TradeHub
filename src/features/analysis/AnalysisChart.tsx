"use client";

import { useEffect, useRef } from "react";
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    type IChartApi,
    type UTCTimestamp,
    type LineWidth,
    type LineStyle,
} from "lightweight-charts";
import type { Candle, AnalysisResult } from "@/shared/lib/technical-analysis/types";
import type { Locale } from "@/shared/types/locale.types";

type Props = {
    candles: Candle[];
    overlay?: AnalysisResult | null;
    isLight: boolean;
    locale?: Locale;
};

const LINE_STYLE_DASHED = 2 as LineStyle;
const LINE_STYLE_DOTTED = 1 as LineStyle;

export function AnalysisChart({ candles, overlay, isLight, locale = "ko" }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef     = useRef<IChartApi | null>(null);

    // 테마 변경 또는 캔들 변경 시 차트 재생성
    useEffect(() => {
        const el = containerRef.current;
        if (!el || candles.length === 0) return;

        const bg          = isLight ? "#FFFFFF"  : "#0C1422";
        const textColor   = isLight ? "#6B7684"  : "#7A8BA0";
        const gridColor   = isLight ? "#F2F4F6"  : "#17243A";
        const borderColor = isLight ? "#D1D6DB"  : "#1F2D40";
        const upColor     = isLight ? "#00A676"  : "#02C076";
        const downColor   = isLight ? "#E0294A"  : "#F75467";

        const chart = createChart(el, {
            layout: { background: { color: bg }, textColor, fontSize: 11 },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            crosshair: { mode: 1 },
            rightPriceScale: { borderColor, scaleMargins: { top: 0.08, bottom: 0.08 } },
            timeScale: { borderColor, timeVisible: true, secondsVisible: false },
            localization: { locale: locale === "en" ? "en-US" : "ko-KR" },
            handleScale: true,
            handleScroll: true,
        });
        chartRef.current = chart;

        const ro = new ResizeObserver(() => chart.resize(el.clientWidth, el.clientHeight));
        ro.observe(el);

        // ── 캔들 ──────────────────────────────────────────
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor, downColor,
            borderUpColor: upColor, borderDownColor: downColor,
            wickUpColor: upColor,   wickDownColor: downColor,
        });
        candleSeries.setData(
            candles.map(c => ({
                time: Math.floor(c.time / 1000) as UTCTimestamp,
                open: c.open, high: c.high, low: c.low, close: c.close,
            }))
        );

        // ── 오버레이 (분석 결과가 있을 때만) ──────────────
        if (overlay) {
            const candleDuration = candles.length >= 2
                ? Math.floor((candles[candles.length - 1].time - candles[candles.length - 2].time) / 1000)
                : 3600;
            const lastCandleTimeSec = Math.floor(candles[candles.length - 1].time / 1000);
            const n = candles.length - 1;

            // 추세선 (실선) + 미래 연장 (점선)
            for (const line of overlay.trendLines.filter(l => !l.broken)) {
                const color = line.type === "uptrend"
                    ? isLight ? "rgba(0, 166, 118, 0.65)" : "rgba(2, 192, 118, 0.65)"
                    : isLight ? "rgba(224, 41, 74, 0.65)"  : "rgba(247, 84, 103, 0.65)";
                const futureColor = line.type === "uptrend"
                    ? isLight ? "rgba(0, 166, 118, 0.30)" : "rgba(2, 192, 118, 0.30)"
                    : isLight ? "rgba(224, 41, 74, 0.30)"  : "rgba(247, 84, 103, 0.30)";

                const points = candles
                    .slice(line.startIndex, line.endIndex + 1)
                    .map((c, i) => ({
                        time: Math.floor(c.time / 1000) as UTCTimestamp,
                        value: line.priceAt(line.startIndex + i),
                    }));

                if (points.length < 2) continue;
                const s = chart.addSeries(LineSeries, {
                    color,
                    lineWidth: line.strength > 60 ? 2 as LineWidth : 1 as LineWidth,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    crosshairMarkerVisible: false,
                });
                s.setData(points);

                // 미래 30캔들 연장 (점선 느낌: 희미한 별도 시리즈)
                const futureExtend = 30;
                const futurePoints = Array.from({ length: futureExtend + 1 }, (_, i) => ({
                    time: (lastCandleTimeSec + i * candleDuration) as UTCTimestamp,
                    value: line.priceAt(n + i),
                }));
                const sf = chart.addSeries(LineSeries, {
                    color: futureColor,
                    lineWidth: 1 as LineWidth,
                    lineStyle: LINE_STYLE_DASHED,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    crosshairMarkerVisible: false,
                });
                sf.setData(futurePoints);
            }

            // 지지/저항
            for (const level of overlay.srLevels.slice(0, 8)) {
                const srColor = level.type === "support"
                    ? isLight ? "rgba(0, 166, 118, 0.4)"  : "rgba(2, 192, 118, 0.4)"
                    : isLight ? "rgba(224, 41, 74, 0.4)"  : "rgba(247, 84, 103, 0.4)";
                candleSeries.createPriceLine({
                    price: level.price, color: srColor,
                    lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DASHED,
                    axisLabelVisible: false,
                    title: `${level.type === "support" ? "지지" : "저항"} (${level.touches}회)`,
                });
            }

            // 피보나치
            if (overlay.fibonacci) {
                for (const fib of overlay.fibonacci.levels) {
                    const fibColor = fib.isKeyLevel
                        ? isLight ? "rgba(217, 119, 6, 0.65)" : "rgba(251, 191, 36, 0.6)"
                        : isLight ? "rgba(217, 119, 6, 0.25)" : "rgba(251, 191, 36, 0.25)";
                    candleSeries.createPriceLine({
                        price: fib.price, color: fibColor,
                        lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DOTTED,
                        axisLabelVisible: fib.isKeyLevel, title: `Fib ${fib.label}`,
                    });
                }
            }

            // 진입/손절/목표가
            const { setup } = overlay;
            const lbl = locale === "en"
                ? { entry: "Entry", sl: "SL", tp1: "TP1", tp2: "TP2" }
                : { entry: "진입", sl: "손절", tp1: "목표1", tp2: "목표2" };
            if (setup.direction !== "neutral") {
                candleSeries.createPriceLine({ price: setup.entry,       color: "#3182F6", lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DASHED, axisLabelVisible: true, title: lbl.entry });
                candleSeries.createPriceLine({ price: setup.stopLoss,    color: "#FF4B4B", lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DASHED, axisLabelVisible: true, title: lbl.sl });
                candleSeries.createPriceLine({ price: setup.takeProfit1, color: "#0DC268", lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DASHED, axisLabelVisible: true, title: lbl.tp1 });
                candleSeries.createPriceLine({ price: setup.takeProfit2, color: "#0DC268", lineWidth: 1 as LineWidth, lineStyle: LINE_STYLE_DOTTED, axisLabelVisible: true, title: lbl.tp2 });
            }

            // 추세선 타점: 미래 진입 예상 가격 마커
            for (const ts of overlay.trendLineSetups) {
                const isLong   = ts.setupType === "pullback_long";
                const dotColor = isLong ? "#02C076" : "#F75467";
                const slColor  = "#FF4B4B";
                const tpColor  = "#0DC268";

                // 진입 예상 시점의 timestamp
                const entryTime = (lastCandleTimeSec + ts.entryOffset * candleDuration) as UTCTimestamp;

                // 진입 예상 타점 수직 마커 (point series)
                const marker = chart.addSeries(LineSeries, {
                    color: dotColor,
                    lineWidth: 1 as LineWidth,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    crosshairMarkerVisible: true,
                });
                // 짧은 수직 범위 마커 (진입가 ± ATR*0.3)
                const markerSpan = 2;
                marker.setData(Array.from({ length: markerSpan }, (_, i) => ({
                    time: (lastCandleTimeSec + (ts.entryOffset - 1 + i) * candleDuration) as UTCTimestamp,
                    value: ts.entryPrice,
                })));

                // 진입/손절/목표 수평선
                candleSeries.createPriceLine({
                    price: ts.entryPrice,
                    color: dotColor,
                    lineWidth: 1 as LineWidth,
                    lineStyle: LINE_STYLE_DOTTED,
                    axisLabelVisible: true,
                    title: locale === "en"
                        ? (isLong ? "↑Pullback Entry" : "↓Bounce Entry")
                        : (isLong ? "↑눌림진입" : "↓반등진입"),
                });
                candleSeries.createPriceLine({
                    price: ts.stopLoss,
                    color: slColor,
                    lineWidth: 1 as LineWidth,
                    lineStyle: LINE_STYLE_DOTTED,
                    axisLabelVisible: false,
                    title: "",
                });
                candleSeries.createPriceLine({
                    price: ts.takeProfit1,
                    color: tpColor,
                    lineWidth: 1 as LineWidth,
                    lineStyle: LINE_STYLE_DOTTED,
                    axisLabelVisible: false,
                    title: "",
                });

                void entryTime; // used for future: marker timestamps
            }
        }

        chart.timeScale().fitContent();

        return () => {
            ro.disconnect();
            try { chart.remove(); } catch {}
            chartRef.current = null;
        };
    }, [candles, overlay, isLight]);

    return <div ref={containerRef} className="w-full h-full" />;
}
