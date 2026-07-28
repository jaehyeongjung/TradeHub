export const FUTURES_ONLY = new Set(["HYPEUSDT"]);

export function getBinanceRestBase(symbol: string): string {
    return FUTURES_ONLY.has(symbol.toUpperCase())
        ? "https://fapi.binance.com/fapi/v1"
        : "https://api.binance.com/api/v3";
}

// kline 등 일반 마켓 스트림용 베이스. 선물은 /market 라우트를 붙여야 데이터가 push된다.
export function getBinanceWsBase(symbol: string): string {
    return FUTURES_ONLY.has(symbol.toUpperCase())
        ? "wss://fstream.binance.com/market/ws"
        : "wss://stream.binance.com:9443/ws";
}
