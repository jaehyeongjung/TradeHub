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

/**
 * 여러 심볼을 한 소켓으로 받는 combined stream의 베이스.
 *
 * 선물은 현물과 경로가 다르다 — `/market`을 빼면 소켓은 정상으로 열리고 close도 안 되는데
 * 메시지만 영원히 안 온다. 2026-09-06 실측: fstream.binance.com/stream?streams=hypeusdt@ticker는
 * 6초간 0건, /market/stream?streams=...는 같은 조건에서 3건이 왔다.
 */
export function getBinanceCombinedStreamUrl(symbols: readonly string[], futures: boolean): string {
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
    return futures
        ? `wss://fstream.binance.com/market/stream?streams=${streams}`
        : `wss://stream.binance.com:9443/stream?streams=${streams}`;
}
