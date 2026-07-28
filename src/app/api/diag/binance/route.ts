import { NextResponse } from "next/server";

// 임시 진단용. 배포 서버에서 바이낸스 선물 API에 닿는지 확인하고 나면 삭제할 것.
// /stocks 시세가 비어 있던 원인(지역 차단 여부)을 특정하기 위해 만들었다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "icn1";

const HOSTS = [
    "fapi.binance.com",
    "www.binance.com",
    "fapi1.binance.com",
    "data-api.binance.vision",
];

export async function GET() {
    const results = await Promise.all(
        HOSTS.map(async (host) => {
            const url = `https://${host}/fapi/v1/ticker/24hr?symbol=SAMSUNGUSDT`;
            const startedAt = Date.now();
            try {
                const res = await fetch(url, {
                    cache: "no-store",
                    headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
                });
                const body = (await res.text()).slice(0, 200);
                return {
                    host,
                    ok: res.ok,
                    status: res.status,
                    ms: Date.now() - startedAt,
                    body,
                };
            } catch (e) {
                return {
                    host,
                    ok: false,
                    status: null,
                    ms: Date.now() - startedAt,
                    error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
                };
            }
        }),
    );

    return NextResponse.json(
        {
            // Vercel이 주입하는 실행 리전 — preferredRegion이 먹었는지 확인용
            region: process.env.VERCEL_REGION ?? null,
            env: process.env.VERCEL_ENV ?? null,
            results,
        },
        { headers: { "Cache-Control": "no-store" } },
    );
}
