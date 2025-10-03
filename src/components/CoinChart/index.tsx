"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { toKstUtcTimestamp } from "@/lib/time";
import type { KlineRow, KlineMessage, Interval } from "@/types/binance";

type Props = {
    symbol?: string; // 기본 BTCUSDT
    interval?: Interval; // 기본 1m
    historyLimit?: number; // 기본 200
};

export default function CoinChart({
    symbol = "BTCUSDT",
    interval = "1m",
    historyLimit = 200,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const chart = createChart(el, {
            width: el.clientWidth,
            height: el.clientHeight,
            layout: {
                background: { color: "#171717" }, // 완전 블랙 배경
                textColor: "#E5E5E5", // 기본 텍스트는 밝은 회색
            },
            grid: {
                vertLines: { color: "#1F1F1F" }, // 세로 라인 (거의 안 보이게)
                horzLines: { color: "#1F1F1F" }, // 가로 라인
            },
            rightPriceScale: { borderColor: "#2A2A2A" }, // 가격 스케일 구분선
            timeScale: { borderColor: "#2A2A2A" }, // 시간축 구분선
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

        let ws: WebSocket | null = null;
        let destroyed = false;

        async function loadHistory() {
            const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${historyLimit}`;
            const res = await fetch(url);
            const rows = (await res.json()) as KlineRow[];

            candleSeries.setData(
                rows.map((d) => ({
                    time: toKstUtcTimestamp(d[0]),
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }))
            );
        }

        function openWs() {
            const stream = `${symbol.toLowerCase()}@kline_${interval}`;
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
            ws.onmessage = (ev) => {
                const msg = JSON.parse(ev.data) as KlineMessage;
                const k = msg.k;
                candleSeries.update({
                    time: toKstUtcTimestamp(k.t),
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                });
            };
            ws.onclose = () => {
                if (!destroyed) setTimeout(openWs, 1000);
            };
        }

        loadHistory().then(openWs).catch(console.error);

        const ro = new ResizeObserver(() => {
            if (!containerRef.current) return;
            chart.applyOptions({ width: containerRef.current.clientWidth });
        });
        ro.observe(el);

        return () => {
            destroyed = true;
            ro.disconnect();
            ws?.close();
            chart.remove();
        };
    }, [symbol, interval, historyLimit]);

    return (
        <div
            ref={containerRef}
            className="cursor-pointer w-full min-w-55 min-h-30 rounded-2xl overflow-hidden border"
        />
    );
}
