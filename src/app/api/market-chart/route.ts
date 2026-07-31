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

/* range를 짧게 잡으면 장 초반에 봉이 몇 개 안 나온다. "1d"는 오늘 정규장
   개장 이후만 주기 때문에, 개장 30분 뒤에 1분봉을 열면 봉이 15개뿐이었다.
   야후 제약: 1m은 최대 7d, 2~15m은 60d, 60m은 730d까지 준다.

   bucketSec이 있으면 그 초 단위로 다시 묶는다. 야후엔 4시간 간격이 없어서
   4h는 60분봉을 받아 직접 집계해야 한다 — 예전엔 매핑만 60m으로 해두고
   집계하는 곳이 없어서 4h를 눌러도 1시간봉이 그대로 그려졌다. */
const INTERVAL_MAP: Record<string, { yahooInterval: string; range: string; bucketSec?: number }> = {
    "1m":  { yahooInterval: "1m",  range: "5d"  },
    "5m":  { yahooInterval: "5m",  range: "5d"  },
    "15m": { yahooInterval: "15m", range: "1mo" },
    "1h":  { yahooInterval: "60m", range: "3mo" },
    "4h":  { yahooInterval: "60m", range: "1y", bucketSec: 4 * 3600 },
    "1d":  { yahooInterval: "1d",  range: "2y"  },
    "1w":  { yahooInterval: "1wk", range: "5y"  },
    "1M":  { yahooInterval: "1mo", range: "10y" },
};

/**
 * 봉을 더 큰 간격으로 다시 묶는다.
 *
 * 경계는 에포크 기준(`floor(t / bucket) * bucket`)으로 자른다. 정규장이
 * 6.5시간이라 4로 나누어떨어지지 않는데, 세션 안에서 4개씩 세면 날마다
 * 4개+2.5개로 들쭉날쭉해진다. 에포크 정렬은 바이낸스 4시간봉과도 경계가
 * 같아서 코인 차트와 같은 컴포넌트에서 봐도 어긋나 보이지 않는다.
 */
function bucketBars(bars: OhlcvBar[], bucketSec: number): OhlcvBar[] {
    const out: OhlcvBar[] = [];
    for (const b of bars) {
        const start = Math.floor(b.time / bucketSec) * bucketSec;
        const last = out[out.length - 1];
        if (last && last.time === start) {
            last.high = Math.max(last.high, b.high);
            last.low = Math.min(last.low, b.low);
            last.close = b.close;
            last.volume += b.volume;
        } else {
            out.push({ time: start, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume });
        }
    }
    return out;
}

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

        const out = mapping.bucketSec ? bucketBars(bars, mapping.bucketSec) : bars;

        return NextResponse.json({ bars: out }, { headers: { "Cache-Control": "no-store, must-revalidate" } });
    } catch (e) {
        return NextResponse.json({ bars: [], error: String(e) }, { status: 500 });
    }
}
