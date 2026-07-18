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

// 바이낸스 호스트 폴백 — 해외 배포 서버는 api.binance.com이 지역 차단(451)되므로
// 차단 없는 공개 데이터 미러(data-api.binance.vision)까지 순회. (kimchi 라우트와 동일 전략)
const BINANCE_HOSTS = [
    "api.binance.com",
    "api1.binance.com",
    "api2.binance.com",
    "data-api.binance.vision",
];

function baseOf(symbol: string) {
    return symbol.slice(0, -"USDT".length);
}

async function fetchTicker24h(): Promise<Ticker24h[]> {
    for (const host of BINANCE_HOSTS) {
        try {
            const res = await fetch(`https://${host}/api/v3/ticker/24hr`, {
                cache: "no-store",
                headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
            });
            if (!res.ok) continue;
            return (await res.json()) as Ticker24h[];
        } catch {
            // 다음 호스트로 폴백
        }
    }
    throw new Error("all Binance hosts failed");
}

export async function GET() {
    try {
        const all = await fetchTicker24h();

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
