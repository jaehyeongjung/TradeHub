// 도구 페이지(/dashboard·/trading·/analysis)가 크롤러에게 내보낼 시세를 서버에서 채운다.
//
// 이 셋은 화면 전체를 WebSocket으로 그리기 때문에, JS를 실행하지 않는 크롤러가 받는
// HTML에는 `BTCUSDT $— —`, `연결 중`, `종목을 선택하세요` 같은 껍데기만 남았다.
// 애드센스가 "가치가 별로 없는 콘텐츠"로 사이트 전체 게재를 중단시킨 직접 원인이다.
// stock-tokens.server.ts가 /stocks에 대해 하는 일을 나머지 페이지에도 해준다.
//
// 실패하면 전부 null을 돌려준다 — 틀린 시세를 HTML에 박아두는 것보다 섹션을 통째로
// 감추는 편이 낫다. 호출부는 null을 받으면 아무것도 렌더하지 않는다.

import { getUsdKrw } from "./fx";

const UA = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" };

// 해외 배포 서버에서 바이낸스가 지역 차단(451)될 수 있어 호스트를 순회한다.
// fapi1~4는 302만 돌려주므로 폴백이 못 된다 — stock-tokens.server.ts와 같은 이유다.
const FAPI_HOSTS = ["fapi.binance.com", "www.binance.com"];

async function withTimeout(url: string, ms: number, revalidate: number) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { headers: UA, next: { revalidate }, signal: ctrl.signal })
        .finally(() => clearTimeout(id));
}

export type Ticker = {
    symbol: string;
    last: number;
    changePct: number;
    high: number;
    low: number;
    /** 24시간 거래대금(USDT) */
    quoteVolume: number;
};

type RawTicker = {
    symbol?: string;
    lastPrice?: string;
    priceChangePercent?: string;
    highPrice?: string;
    lowPrice?: string;
    quoteVolume?: string;
};

function num(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
}

/**
 * 선물 전 종목 24시간 통계. 응답이 1MB 남짓이라 Next fetch 데이터 캐시 한도(2MB) 안에 든다.
 * 심볼별로 따로 부르면 요청이 50번 넘게 나가므로 한 번에 받아 Map으로 넘긴다.
 */
export async function getFuturesTickers(revalidate = 300): Promise<Map<string, Ticker> | null> {
    for (const host of FAPI_HOSTS) {
        try {
            const res = await withTimeout(`https://${host}/fapi/v1/ticker/24hr`, 4000, revalidate);
            if (!res.ok) continue;
            const rows = (await res.json()) as RawTicker[];
            if (!Array.isArray(rows)) continue;

            const map = new Map<string, Ticker>();
            for (const r of rows) {
                const symbol = r.symbol;
                if (!symbol) continue;
                const t: Ticker = {
                    symbol,
                    last:        num(r.lastPrice),
                    changePct:   num(r.priceChangePercent),
                    high:        num(r.highPrice),
                    low:         num(r.lowPrice),
                    quoteVolume: num(r.quoteVolume),
                };
                if (!Number.isFinite(t.last) || t.last <= 0) continue;
                map.set(symbol, t);
            }
            return map.size ? map : null;
        } catch {
            // 다음 호스트로 폴백
        }
    }
    return null;
}

export type FearGreed = { value: number; label: string };

/** 하루에 한 번 바뀌는 값이라 길게 캐시한다. */
export async function getFearGreed(revalidate = 1800): Promise<FearGreed | null> {
    try {
        const res = await withTimeout("https://api.alternative.me/fng/?limit=1&format=json", 3500, revalidate);
        if (!res.ok) return null;
        const json = await res.json() as { data?: Array<{ value?: string; value_classification?: string }> };
        const item = json?.data?.[0];
        const value = num(item?.value);
        if (!Number.isFinite(value)) return null;
        return { value, label: item?.value_classification ?? "Neutral" };
    } catch {
        return null;
    }
}

export type Kimchi = {
    upbitKrw: number;
    binanceUsdt: number;
    usdkrw: number;
    /** 국내가 해외보다 비싼 정도(%). 음수면 역프. */
    premium: number;
};

/**
 * BTC 기준 김치프리미엄. api/kimchi 라우트와 같은 계산이지만 여기선 페이지 ISR에 맞춰 캐시한다.
 * 세 값 중 하나라도 빠지면 null — 환율을 못 구한 채로 프리미엄을 내보내면 숫자가 틀린다.
 */
export async function getKimchiPremium(revalidate = 300): Promise<Kimchi | null> {
    try {
        const [upbitRes, binanceRes, usdkrw] = await Promise.all([
            withTimeout("https://api.upbit.com/v1/ticker?markets=KRW-BTC", 3500, revalidate),
            withTimeout("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", 3500, revalidate),
            getUsdKrw(revalidate),
        ]);
        if (!upbitRes.ok || !binanceRes.ok || !usdkrw) return null;

        const upbitJson   = await upbitRes.json() as Array<{ trade_price?: number }>;
        const binanceJson = await binanceRes.json() as { price?: string };

        const upbitKrw    = num(upbitJson?.[0]?.trade_price);
        const binanceUsdt = num(binanceJson?.price);
        if (!(upbitKrw > 0) || !(binanceUsdt > 0)) return null;

        const globalKrw = binanceUsdt * usdkrw;
        return {
            upbitKrw,
            binanceUsdt,
            usdkrw,
            premium: (upbitKrw / globalKrw - 1) * 100,
        };
    } catch {
        return null;
    }
}

export type Breadth = {
    up: number;
    down: number;
    total: number;
    /** 24시간 거래대금 합계(USDT) */
    volume: number;
};

/** USDT 무기한 선물 전 종목의 등락 분포. 지금 시장이 한쪽으로 쏠렸는지를 한 줄로 말해준다. */
export function getBreadth(tickers: Map<string, Ticker>): Breadth {
    let up = 0, down = 0, total = 0, volume = 0;
    for (const t of tickers.values()) {
        if (!t.symbol.endsWith("USDT")) continue;
        total  += 1;
        volume += t.quoteVolume || 0;
        if (t.changePct > 0) up += 1;
        else if (t.changePct < 0) down += 1;
    }
    return { up, down, total, volume };
}
