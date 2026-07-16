import { NextResponse } from "next/server";

// 라우트는 매 요청 실행하되, 작은 결과 JSON을 CDN에서 s-maxage로 1시간 캐시.
// (Binance 24hr 응답이 ~2.5MB라 Next fetch 데이터 캐시 한도(2MB)를 넘어 fetch 캐시는 쓰지 않음)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ticker24h = {
    symbol: string;
    quoteVolume: string;
};

export type SymbolsResponse = {
    symbols: string[];       // 소문자, 거래량 상위순 (예: "btcusdt")
    count: number;
    updatedAt: number;
};

// 레버리지 토큰 (BTCUP/BTCDOWN/…)
const LEVERAGED = /(UP|DOWN|BULL|BEAR)USDT$/;

// 스테이블코인/법정화폐 페어 — 차트로서 의미 없어 제외
const STABLE_BASES = new Set([
    "USDC", "FDUSD", "TUSD", "BUSD", "DAI", "USDP", "USD1",
    "EUR", "AEUR", "EURI", "EURT", "GYEN", "USTC", "XUSD",
]);

const LIMIT = 200;

function baseOf(symbol: string) {
    return symbol.slice(0, -"USDT".length);
}

export async function GET() {
    try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);

        const all = (await res.json()) as Ticker24h[];

        const symbols = all
            .filter((t) => {
                const s = t.symbol;
                return (
                    s.endsWith("USDT") &&
                    !LEVERAGED.test(s) &&
                    !STABLE_BASES.has(baseOf(s))
                );
            })
            .sort((a, b) => (Number(b.quoteVolume) || 0) - (Number(a.quoteVolume) || 0))
            .slice(0, LIMIT)
            .map((t) => t.symbol.toLowerCase());

        const body: SymbolsResponse = {
            symbols,
            count: symbols.length,
            updatedAt: Date.now(),
        };

        return NextResponse.json(body, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch {
        // 실패 시 빈 목록 — 클라이언트가 하드코딩 폴백을 사용
        return NextResponse.json(
            { symbols: [], count: 0, updatedAt: Date.now() } satisfies SymbolsResponse,
            { status: 502 },
        );
    }
}
