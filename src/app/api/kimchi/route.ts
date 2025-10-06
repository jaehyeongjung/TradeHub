import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
// 미국/유럽 선호(일부 거래소, 환율 API가 안정적)
export const preferredRegion = ["iad1", "sfo1", "lhr1"];

type UpbitTicker = Array<{ trade_price: number; timestamp: number }>;
type FxLatest = { rates?: { KRW?: number } };

type UpstreamInfo = Record<string, number | string>;

type KimchiPayload = {
    symbol: string;
    upbitKrw: number;
    globalUsd: number;
    usdkrw: number;
    globalKrw: number;
    premium: number; // 0.0321 => 3.21%
    updatedAt: string;
    stale?: boolean; // 캐시 폴백 여부
    upstream?: UpstreamInfo; // 디버깅 참고용
};

const UA: HeadersInit = {
    "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)",
    Accept: "application/json",
};

const TTL_MS = 5_000; // 결과 캐시 5초
const FX_TTL_MS = 20_000; // 환율은 20초
const TIMEOUT = 3_500; // 각 외부요청 타임아웃

// ── 간단한 in-memory 캐시 & 중복요청 합치기 ─────────────────────
type CacheVal = { ts: number; data: KimchiPayload };
const cacheBySymbol = new Map<string, CacheVal>();
const fxCache: { ts: number; krw?: number } = { ts: 0, krw: undefined };

// 중복요청 디듀프용 (동일 심볼로 동시에 들어오면 하나만 외부 호출)
const pendingBySymbol = new Map<string, Promise<KimchiPayload>>();
let pendingFx: Promise<number> | null = null;

// ── 유틸 ────────────────────────────────────────────────────────
function isNum(x: unknown): x is number {
    return typeof x === "number" && Number.isFinite(x);
}

function withTimeout(url: string, ms = TIMEOUT, init?: RequestInit) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...init, signal: ctrl.signal }).finally(() =>
        clearTimeout(id)
    );
}

// ── 글로벌 USD 가격 공급자들 (동시에 던져서 가장 먼저 성공한 값 채택) ──
const COINGECKO_IDS: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
};

async function priceFromCoinGecko(sym: string) {
    const id = COINGECKO_IDS[sym];
    if (!id) throw new Error("cg:no-id");
    const r = await withTimeout(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
        TIMEOUT,
        { headers: UA, cache: "no-store" }
    );
    if (!r.ok) throw new Error(`cg:${r.status}`);
    const j = (await r.json()) as Record<string, { usd?: number }>;
    const v = j?.[id]?.usd;
    if (!isNum(v)) throw new Error("cg:invalid");
    return { src: "coingecko", status: r.status, price: v };
}

async function priceFromCoinbase(sym: string) {
    const pair = `${sym}-USD`;
    const r = await withTimeout(
        `https://api.coinbase.com/v2/prices/${pair}/spot`,
        TIMEOUT,
        {
            headers: UA,
            cache: "no-store",
        }
    );
    if (!r.ok) throw new Error(`cb:${r.status}`);
    const j = (await r.json()) as { data?: { amount?: string } };
    const v = Number(j?.data?.amount);
    if (!Number.isFinite(v)) throw new Error("cb:invalid");
    return { src: "coinbase", status: r.status, price: v };
}

async function priceFromOKX(sym: string) {
    const inst = `${sym}-USDT`;
    const r = await withTimeout(
        `https://www.okx.com/api/v5/market/ticker?instId=${inst}`,
        TIMEOUT,
        {
            headers: UA,
            cache: "no-store",
        }
    );
    if (!r.ok) throw new Error(`okx:${r.status}`);
    const j = (await r.json()) as { data?: Array<{ last?: string }> };
    const v = Number(j?.data?.[0]?.last);
    if (!Number.isFinite(v)) throw new Error("okx:invalid");
    return { src: "okx", status: r.status, price: v };
}

async function priceFromKraken(sym: string) {
    const map: Record<string, string> = { BTC: "XXBTZUSD", ETH: "XETHZUSD" };
    const pair = map[sym];
    if (!pair) throw new Error("kr:pair");
    const r = await withTimeout(
        `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
        TIMEOUT,
        {
            headers: UA,
            cache: "no-store",
        }
    );
    if (!r.ok) throw new Error(`kr:${r.status}`);
    const j = (await r.json()) as { result?: Record<string, { c?: [string] }> };
    const firstKey = j.result && Object.keys(j.result)[0];
    const v = Number(firstKey ? j.result[firstKey]?.c?.[0] : NaN);
    if (!Number.isFinite(v)) throw new Error("kr:invalid");
    return { src: "kraken", status: r.status, price: v };
}

async function getGlobalUsd(sym: string) {
    // 동시에 3~4곳에 던지고 Promise.any 로 가장 빠른 성공값 채택
    const providers = [
        priceFromCoinGecko(sym),
        priceFromCoinbase(sym),
        priceFromOKX(sym),
        priceFromKraken(sym),
    ];
    const upstream: UpstreamInfo = {};
    try {
        const first = await Promise.any(providers);
        upstream[first.src] = first.status;
        return { price: first.price, upstream };
    } catch {
        // 모두 실패 시 에러 메시지 모아 반환
        for (const p of providers) {
            p.catch((e) => {
                const msg = e instanceof Error ? e.message : String(e);
                const key = msg.split(":")[0] ?? "provider";
                upstream[key] = msg;
            });
        }
        throw { upstream };
    }
}

// ── 환율(USD/KRW) ───────────────────────────────────────────────
async function getUsdKrw(): Promise<{
    value: number;
    from: string;
    status: number;
}> {
    const now = Date.now();
    if (fxCache.krw && now - fxCache.ts < FX_TTL_MS) {
        return { value: fxCache.krw, from: "cache", status: 200 };
    }
    if (!pendingFx) {
        pendingFx = (async () => {
            // 1차
            const r1 = await withTimeout(
                "https://api.exchangerate.host/latest?base=USD&symbols=KRW",
                TIMEOUT,
                { headers: UA, cache: "no-store" }
            );
            if (r1.ok) {
                const j = (await r1.json()) as FxLatest;
                const v = j?.rates?.KRW;
                if (isNum(v)) {
                    fxCache.ts = now;
                    fxCache.krw = v;
                    return v;
                }
            }
            // 2차
            const r2 = await withTimeout(
                "https://open.er-api.com/v6/latest/USD",
                TIMEOUT,
                {
                    headers: UA,
                    cache: "no-store",
                }
            );
            if (r2.ok) {
                const j2 = (await r2.json()) as { rates?: { KRW?: number } };
                const v2 = j2?.rates?.KRW;
                if (isNum(v2)) {
                    fxCache.ts = now;
                    fxCache.krw = v2;
                    return v2;
                }
            }
            throw new Error("fx:failed");
        })();
        pendingFx.finally(() => (pendingFx = null));
    }
    const value = await pendingFx;
    return { value, from: "live", status: 200 };
}

// ── 메인 핸들러 ─────────────────────────────────────────────────
export async function GET(req: Request) {
    const url = new URL(req.url);
    const sym = (url.searchParams.get("symbol") || "BTC").toUpperCase();

    // 1) 캐시 HIT → 즉시 반환
    const now = Date.now();
    const hit = cacheBySymbol.get(sym);
    if (hit && now - hit.ts < TTL_MS) {
        return NextResponse.json(hit.data, {
            headers: {
                "Cache-Control":
                    "public, s-maxage=3, stale-while-revalidate=30",
            },
        });
    }

    // 2) 진행 중 요청과 합치기(디듀프)
    if (pendingBySymbol.has(sym)) {
        const same = pendingBySymbol.get(sym)!;
        const data = await same;
        return NextResponse.json(data, {
            headers: {
                "Cache-Control":
                    "public, s-maxage=3, stale-while-revalidate=30",
            },
        });
    }

    // 3) 새로 가져오기
    const task = (async (): Promise<KimchiPayload> => {
        const upstream: UpstreamInfo = {};
        try {
            // 업비트
            const upbitRes = await withTimeout(
                `https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(
                    `KRW-${sym}`
                )}`,
                TIMEOUT,
                { headers: UA, cache: "no-store" }
            );
            upstream.upbit = upbitRes.status;
            if (!upbitRes.ok) throw new Error(`upbit:${upbitRes.status}`);
            const up = (await upbitRes.json()) as UpbitTicker;
            const upbitKrw = up?.[0]?.trade_price;
            if (!isNum(upbitKrw)) throw new Error("upbit:invalid");

            // 글로벌 USD (동시 시도 → 첫 성공)
            let globalUsd: number;
            try {
                const g = await getGlobalUsd(sym);
                globalUsd = g.price;
                Object.assign(upstream, g.upstream);
            } catch (e) {
                Object.assign(
                    upstream,
                    (e as { upstream?: UpstreamInfo })?.upstream
                );
                throw new Error("global:failed");
            }

            // 환율
            const fx = await getUsdKrw();
            upstream.fx = fx.status;
            upstream.fxFrom = fx.from;
            const usdkrw = fx.value;

            const globalKrw = globalUsd * usdkrw;
            const premium = (upbitKrw - globalKrw) / globalKrw;

            const payload: KimchiPayload = {
                symbol: sym,
                upbitKrw,
                globalUsd,
                usdkrw,
                globalKrw,
                premium,
                updatedAt: new Date().toISOString(),
                upstream,
            };

            // 캐시 저장
            cacheBySymbol.set(sym, { ts: now, data: payload });
            return payload;
        } catch (e) {
            // 완전 실패 → 마지막 정상값이라도 있으면 stale로 반환
            const last = cacheBySymbol.get(sym);
            if (last) {
                const stale: KimchiPayload = {
                    ...last.data,
                    stale: true,
                    updatedAt: new Date().toISOString(),
                };
                cacheBySymbol.set(sym, { ts: now, data: stale });
                return stale;
            }
            // 캐시도 없으면 502
            const msg = e instanceof Error ? e.message : "kimchi:failed";
            return Promise.reject(new Error(msg));
        }
    })();

    pendingBySymbol.set(sym, task);
    try {
        const data = await task;
        return NextResponse.json(data, {
            // 약간의 CDN 캐시 허용(3초), 실패 시 브라우저는 직전 값 사용 가능
            headers: {
                "Cache-Control":
                    "public, s-maxage=3, stale-while-revalidate=30",
            },
        });
    } finally {
        pendingBySymbol.delete(sym);
    }
}
