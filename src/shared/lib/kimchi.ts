// 김치프리미엄을 브라우저에서 직접 계산한다.
//
// 예전엔 /api/kimchi 라우트가 매 요청마다 업비트·바이낸스·환율을 불러 계산했는데,
// 대시보드가 5초마다 호출해서 탭 하나가 하루 1.7만 번 함수를 돌렸다. 이게 Vercel Hobby
// 한도(CDN Requests 1M, Active CPU 4h)를 넘겨 사이트가 402로 멈춘 주원인이다.
// 업비트·바이낸스·frankfurter 모두 CORS를 허용하므로 서버를 거칠 이유가 없다.

export type KimchiResponse = {
    symbol: string;
    upbitKrw: number | null;
    upbitPriceSource?: "orderbook_mid" | "trade_price";
    binanceUsdt: number | null;
    usdkrw: number | null;
    globalKrw: number | null;
    premium: number | null;
    updatedAt: string;
    degraded: boolean;
};

function isNum(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v) && v > 0;
}

async function getJson<T>(url: string, ms: number, signal?: AbortSignal): Promise<T | null> {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onAbort);
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
        const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        return r.ok ? ((await r.json()) as T) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(id);
        signal?.removeEventListener("abort", onAbort);
    }
}

/* 환율은 하루 한 번 바뀌는 값이라 탭 안에서 10분간 재사용한다. */
const FX_TTL_MS = 10 * 60_000;
let fxCache: { value: number; at: number } | null = null;

async function fetchUsdKrw(signal?: AbortSignal): Promise<number | null> {
    if (fxCache && Date.now() - fxCache.at < FX_TTL_MS) return fxCache.value;

    const sources: { url: string; pick: (j: unknown) => unknown }[] = [
        {
            url: "https://api.frankfurter.dev/v1/latest?from=USD&to=KRW",
            pick: (j) => (j as { rates?: { KRW?: number } })?.rates?.KRW,
        },
        {
            url: "https://api.exchangerate-api.com/v4/latest/USD",
            pick: (j) => (j as { rates?: { KRW?: number } })?.rates?.KRW,
        },
        {
            url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
            pick: (j) => (j as { usd?: { krw?: number } })?.usd?.krw,
        },
    ];
    for (const { url, pick } of sources) {
        const j = await getJson<unknown>(url, 3000, signal);
        const v = j && pick(j);
        if (isNum(v)) {
            fxCache = { value: v, at: Date.now() };
            return v;
        }
    }
    // 새로 못 받았으면 만료된 값이라도 쓴다 — 환율은 몇 분 늦어도 프리미엄이 거의 안 변한다.
    return fxCache?.value ?? null;
}

const BINANCE_HOSTS = ["api.binance.com", "data-api.binance.vision"];

async function fetchBinancePrice(symbol: string, signal?: AbortSignal): Promise<number | null> {
    for (const h of BINANCE_HOSTS) {
        const j = await getJson<{ price?: string }>(`https://${h}/api/v3/ticker/price?symbol=${symbol}`, 3000, signal);
        const p = Number(j?.price);
        if (isNum(p)) return p;
    }
    return null;
}

type UpbitPrice = { price: number; source: "orderbook_mid" | "trade_price" } | null;

async function fetchUpbitPrice(market: string, signal?: AbortSignal): Promise<UpbitPrice> {
    const ob = await getJson<Array<{ orderbook_units?: Array<{ ask_price: number; bid_price: number }> }>>(
        `https://api.upbit.com/v1/orderbook?markets=${market}`,
        2000,
        signal,
    );
    const u0 = ob?.[0]?.orderbook_units?.[0];
    if (u0) {
        const mid = (u0.ask_price + u0.bid_price) / 2;
        if (isNum(mid)) return { price: mid, source: "orderbook_mid" };
    }

    const t = await getJson<Array<{ trade_price?: number }>>(
        `https://api.upbit.com/v1/ticker?markets=${market}`,
        2000,
        signal,
    );
    const p = t?.[0]?.trade_price;
    return isNum(p) ? { price: p, source: "trade_price" } : null;
}

/** 실패해도 throw하지 않는다. 셋 중 하나라도 빠지면 premium이 null이고 degraded다. */
export async function fetchKimchi(symbol: string, signal?: AbortSignal): Promise<KimchiResponse> {
    const sym = symbol.toUpperCase();
    const [usdkrw, binanceUsdt, upbit] = await Promise.all([
        fetchUsdKrw(signal),
        fetchBinancePrice(`${sym}USDT`, signal),
        fetchUpbitPrice(`KRW-${sym}`, signal),
    ]);

    const globalKrw = usdkrw != null && binanceUsdt != null ? binanceUsdt * usdkrw : null;
    const premium = globalKrw != null && upbit != null ? (upbit.price - globalKrw) / globalKrw : null;

    return {
        symbol: sym,
        upbitKrw: upbit?.price ?? null,
        upbitPriceSource: upbit?.source,
        binanceUsdt,
        usdkrw,
        globalKrw,
        premium,
        updatedAt: new Date().toISOString(),
        degraded: premium == null,
    };
}
