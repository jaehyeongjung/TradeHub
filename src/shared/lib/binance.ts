export const FUTURES_ONLY = new Set(["HYPEUSDT"]);

export function getBinanceRestBase(symbol: string): string {
    return FUTURES_ONLY.has(symbol.toUpperCase())
        ? "https://fapi.binance.com/fapi/v1"
        : "https://api.binance.com/api/v3";
}

export function getBinanceWsBase(symbol: string): string {
    return FUTURES_ONLY.has(symbol.toUpperCase())
        ? "wss://fstream.binance.com/ws"
        : "wss://stream.binance.com:9443/ws";
}
