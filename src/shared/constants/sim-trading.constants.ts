// 바이낸스에서 상장폐지된 심볼은 넣지 않는다. 시세 스트림(현물 combined stream)이
// 없는 이름을 조용히 무시하기 때문에, 목록에만 남아 있으면 값이 영원히 안 채워지는
// 종목을 사용자에게 고르게 하는 꼴이 된다.
// 2026-09-06 MATIC·EOS·MKR·TON·FTM 제거 — 현물·선물 양쪽에서 폐지됐다.
export const SUPPORTED_SYMBOLS = [
    "BTCUSDT",   "ETHUSDT",   "BNBUSDT",   "SOLUSDT",   "XRPUSDT",
    "DOGEUSDT",  "ADAUSDT",   "AVAXUSDT",  "LINKUSDT",  "DOTUSDT",
    "LTCUSDT",   "ATOMUSDT",  "UNIUSDT",   "NEARUSDT",  "APTUSDT",
    "ARBUSDT",   "OPUSDT",    "INJUSDT",   "SUIUSDT",   "TRXUSDT",
    "BCHUSDT",   "ETCUSDT",   "FILUSDT",   "ALGOUSDT",  "VETUSDT",
    "HBARUSDT",  "QTUMUSDT",  "FLOWUSDT",  "AAVEUSDT",  "LDOUSDT",
    "CRVUSDT",   "SNXUSDT",   "RUNEUSDT",  "GRTUSDT",   "PENDLEUSDT",
    "KAVAUSDT",  "IMXUSDT",   "SANDUSDT",  "MANAUSDT",  "GALAUSDT",
    "AXSUSDT",   "ENJUSDT",   "SEIUSDT",   "TIAUSDT",   "WLDUSDT",
    "ORDIUSDT",  "JUPUSDT",   "FETUSDT",   "STXUSDT",   "WIFUSDT",
    "HYPEUSDT",
] as const;

export const SYMBOL_NAMES: Record<string, string> = {
    BTCUSDT: "Bitcoin",           ETHUSDT: "Ethereum",          BNBUSDT: "BNB",
    SOLUSDT: "Solana",            XRPUSDT: "XRP",               DOGEUSDT: "Dogecoin",
    ADAUSDT: "Cardano",           AVAXUSDT: "Avalanche",        LINKUSDT: "Chainlink",
    DOTUSDT: "Polkadot",          LTCUSDT: "Litecoin",          ATOMUSDT: "Cosmos",
    UNIUSDT: "Uniswap",           NEARUSDT: "NEAR",             APTUSDT: "Aptos",
    ARBUSDT: "Arbitrum",          OPUSDT: "Optimism",           INJUSDT: "Injective",
    SUIUSDT: "Sui",               TRXUSDT: "TRON",              BCHUSDT: "Bitcoin Cash",
    ETCUSDT: "Ethereum Classic",  FILUSDT: "Filecoin",          ALGOUSDT: "Algorand",
    VETUSDT: "VeChain",           HBARUSDT: "Hedera",           QTUMUSDT: "QTUM",
    FLOWUSDT: "Flow",             AAVEUSDT: "Aave",             LDOUSDT: "Lido DAO",
    CRVUSDT: "Curve",             SNXUSDT: "Synthetix",         RUNEUSDT: "THORChain",
    GRTUSDT: "The Graph",         PENDLEUSDT: "Pendle",         KAVAUSDT: "Kava",
    IMXUSDT: "Immutable X",       SANDUSDT: "Sandbox",          MANAUSDT: "Decentraland",
    GALAUSDT: "Gala",             AXSUSDT: "Axie Infinity",     ENJUSDT: "Enjin",
    SEIUSDT: "Sei",               TIAUSDT: "Celestia",          WLDUSDT: "Worldcoin",
    ORDIUSDT: "ORDI",             JUPUSDT: "Jupiter",           FETUSDT: "Fetch.ai",
    STXUSDT: "Stacks",            WIFUSDT: "dogwifhat",         HYPEUSDT: "Hyperliquid",
};

export const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 75, 100, 125] as const;

/** 시장가 수수료율. 주문 명목가(notional) 기준으로 뗀다. */
export const TAKER_FEE = 0.0004;

/**
 * 잔고에서 쓸 수 있는 최대 주문 명목가(notional).
 *
 * 주문 하나가 잡아먹는 돈은 증거금만이 아니라 `증거금 + 수수료`다:
 *   비용 = N/leverage + N*TAKER_FEE  ≤  balance
 *   →  N ≤ balance * leverage / (1 + leverage * TAKER_FEE)
 *
 * 예전엔 `balance * leverage`를 그대로 넣어서 증거금이 잔고 전액이 되고
 * 수수료 낼 돈이 안 남아, "최대"를 누르면 항상 잔고 부족으로 튕겼다.
 * 내림으로 자르는 건 반올림이 위로 튀면 다시 1원 초과가 나기 때문이다.
 */
export function maxNotional(balance: number, leverage: number, pct = 1): number {
    if (balance <= 0 || leverage <= 0) return 0;
    const n = (balance * pct * leverage) / (1 + leverage * TAKER_FEE);
    return Math.floor(n * 100) / 100;
}
