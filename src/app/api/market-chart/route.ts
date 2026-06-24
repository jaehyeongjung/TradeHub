import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type OhlcvBar = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

const INTERVAL_MAP: Record<string, { yahooInterval: string; range: string }> = {
    "1m":  { yahooInterval: "2m",  range: "1d"  },
    "5m":  { yahooInterval: "5m",  range: "5d"  },
    "15m": { yahooInterval: "15m", range: "1mo" },
    "1h":  { yahooInterval: "60m", range: "3mo" },
    "4h":  { yahooInterval: "60m", range: "3mo" },
    "1d":  { yahooInterval: "1d",  range: "2y"  },
    "1w":  { yahooInterval: "1wk", range: "5y"  },
    "1M":  { yahooInterval: "1mo", range: "10y" },
};

type YahooChartResponse = {
    chart?: {
        result?: Array<{
            timestamp?: number[];
            indicators?: {
                quote?: Array<{
                    open?: (number | null)[];
                    high?: (number | null)[];
                    low?: (number | null)[];
                    close?: (number | null)[];
                    volume?: (number | null)[];
                }>;
            };
        }>;
        error?: { code: string; description: string } | null;
    };
};

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol") ?? "^IXIC";
    const interval = searchParams.get("interval") ?? "1d";

    const mapping = INTERVAL_MAP[interval] ?? INTERVAL_MAP["1d"];

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${mapping.yahooInterval}&range=${mapping.range}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ bars: [], error: `Yahoo Finance error: ${res.status}` }, { status: 502 });
        }

        const data = (await res.json()) as YahooChartResponse;
        const result = data?.chart?.result?.[0];

        if (!result) {
            return NextResponse.json({ bars: [] }, { headers: { "Cache-Control": "no-store" } });
        }

        const timestamps = result.timestamp ?? [];
        const quote = result.indicators?.quote?.[0] ?? {};
        const opens = quote.open ?? [];
        const highs = quote.high ?? [];
        const lows = quote.low ?? [];
        const closes = quote.close ?? [];
        const volumes = quote.volume ?? [];

        const bars: OhlcvBar[] = [];
        for (let i = 0; i < timestamps.length; i++) {
            const o = opens[i], h = highs[i], l = lows[i], c = closes[i];
            if (o == null || h == null || l == null || c == null) continue;
            bars.push({
                time: timestamps[i],
                open: o,
                high: h,
                low: l,
                close: c,
                volume: volumes[i] ?? 0,
            });
        }

        return NextResponse.json({ bars }, { headers: { "Cache-Control": "no-store, must-revalidate" } });
    } catch (e) {
        return NextResponse.json({ bars: [], error: String(e) }, { status: 500 });
    }
}
