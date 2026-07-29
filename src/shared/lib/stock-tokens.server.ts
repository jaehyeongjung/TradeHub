// 주식 토큰 시세를 서버에서 가져온다. SEO상 가격이 HTML에 박혀 있어야 하므로
// 클라이언트 WS에만 의존하지 않고 SSR 시점에 한 번 채운다.

import { stockTokens } from "./stock-tokens";
import { getUsdKrw } from "./fx";
import { getLastSessionCloseMs } from "./market-hours";
import type { StockMarket } from "./stock-tokens";

// 해외 배포 서버에서 바이낸스가 지역 차단(451)될 수 있어 호스트를 순회한다.
//
// 주의: fapi1~4.binance.com은 302만 돌려주므로 폴백으로 쓸 수 없다. 현물처럼
// data-api.binance.vision을 쓸 수도 없다 — 그 미러는 /fapi 경로를 서비스하지 않는다(404).
// 실제로 동작이 확인된 대체 호스트는 www.binance.com이며 같은 /fapi/v1 경로를 받는다.
const FAPI_HOSTS = ["fapi.binance.com", "www.binance.com"];

const UA = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" };

/**
 * 선물 API 응답은 전 종목을 받아도 1MB 남짓이라 Next fetch 데이터 캐시 한도(2MB) 안에 든다.
 * (현물 /ticker/24hr은 ~2.5MB라 캐시가 안 되는데, 그건 api/symbols 라우트 쪽 이야기다.)
 *
 * @param revalidate 초 단위. 거의 안 바뀌는 exchangeInfo는 길게 준다.
 */
async function fapi<T>(path: string, revalidate = 60): Promise<T | null> {
    for (const host of FAPI_HOSTS) {
        try {
            const res = await fetch(`https://${host}/fapi/v1${path}`, {
                headers: UA,
                next: { revalidate },
            });
            if (!res.ok) continue;
            return (await res.json()) as T;
        } catch {
            // 다음 호스트로 폴백
        }
    }
    return null;
}

export type StockQuote = {
    symbol: string;
    price: number;
    changePercent: number;
    high: number;
    low: number;
    quoteVolume: number;
    tradeCount: number;
};

type RawTicker = {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    quoteVolume: string;
    count: number;
};

function toQuote(t: RawTicker): StockQuote {
    return {
        symbol: t.symbol,
        price: Number(t.lastPrice),
        changePercent: Number(t.priceChangePercent),
        high: Number(t.highPrice),
        low: Number(t.lowPrice),
        quoteVolume: Number(t.quoteVolume),
        tradeCount: Number(t.count),
    };
}

export type TradfiRow = StockQuote & {
    /** 바이낸스 심볼에서 USDT를 뗀 것 */
    base: string;
    /** 개별 페이지가 있는 종목이면 슬러그 */
    slug: string | null;
    koreanName: string | null;
    isKorean: boolean;
};

type ExchangeInfo = {
    symbols: {
        symbol: string;
        status: string;
        contractType?: string;
        underlyingType?: string;
    }[];
};

/**
 * 바이낸스 주식 토큰(TRADIFI_PERPETUAL) 전 종목을 거래대금 순으로.
 * stockTokens에 없는 종목도 심볼 그대로 노출한다 — 기초자산을 확정 못 한 것들이 섞여 있어
 * 개별 페이지는 만들지 않지만 목록에서는 시세를 볼 수 있게 한다.
 */
export async function getAllTradfiRows(): Promise<TradfiRow[]> {
    const [info, tickers] = await Promise.all([
        fapi<ExchangeInfo>("/exchangeInfo", 3600),
        fapi<RawTicker[]>("/ticker/24hr"),
    ]);
    if (!info || !tickers) return [];

    const tradfi = new Map(
        info.symbols
            .filter((s) => s.contractType === "TRADIFI_PERPETUAL" && s.status === "TRADING")
            .map((s) => [s.symbol, s]),
    );

    const bySymbol = new Map(stockTokens.map((t) => [t.symbol, t]));

    return tickers
        .filter((t) => tradfi.has(t.symbol))
        .map((t) => {
            const base = t.symbol.replace(/USDT$/, "");
            const meta = bySymbol.get(base);
            return {
                ...toQuote(t),
                base,
                slug: meta?.slug ?? null,
                koreanName: meta?.koreanName ?? null,
                isKorean: tradfi.get(t.symbol)?.underlyingType === "KR_EQUITY",
            };
        })
        .sort((a, b) => b.quoteVolume - a.quoteVolume);
}

export type StockDetail = {
    quote: StockQuote | null;
    /** 직전 정규장 마감 시점의 토큰 가격 (KRX 종가가 아니다 — 그 시각 토큰의 값) */
    sessionClosePrice: number | null;
    sessionCloseAt: number | null;
    markPrice: number | null;
    openInterestUsd: number | null;
    /** USD/KRW. 못 가져오면 null이고, 그때는 원화 표기를 숨긴다. */
    usdKrw: number | null;
};

/** 직전 장 마감 시각의 15분봉 시가 = 그 순간의 토큰 가격 */
async function getSessionClosePrice(symbol: string, market: StockMarket, closeAt: number) {
    const k = await fapi<unknown[][]>(
        `/klines?symbol=${symbol}USDT&interval=15m&startTime=${closeAt}&limit=1`,
    );
    const open = k?.[0]?.[1];
    const n = Number(open);
    return Number.isFinite(n) ? n : null;
}

export async function getStockDetail(symbol: string, market: StockMarket): Promise<StockDetail> {
    const pair = `${symbol}USDT`;
    const closeAt = getLastSessionCloseMs(market);

    const [ticker, premium, oi, usdKrw, sessionClosePrice] = await Promise.all([
        fapi<RawTicker>(`/ticker/24hr?symbol=${pair}`),
        fapi<{ markPrice: string }>(`/premiumIndex?symbol=${pair}`),
        fapi<{ openInterest: string }>(`/openInterest?symbol=${pair}`),
        getUsdKrw(),
        getSessionClosePrice(symbol, market, closeAt),
    ]);

    const quote = ticker && ticker.symbol ? toQuote(ticker) : null;
    const markPrice = premium ? Number(premium.markPrice) : null;

    return {
        quote,
        sessionClosePrice,
        sessionCloseAt: closeAt,
        markPrice,
        openInterestUsd: oi && markPrice ? Number(oi.openInterest) * markPrice : null,
        usdKrw,
    };
}
