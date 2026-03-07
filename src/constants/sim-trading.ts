/** 모의투자에서 지원하는 심볼 목록 (Binance USDT 무기한 선물) */
export const SUPPORTED_SYMBOLS = [
    // Tier 1 — 최상위 유동성
    "BTCUSDT",  "ETHUSDT",  "BNBUSDT",  "SOLUSDT",  "XRPUSDT",
    "DOGEUSDT", "ADAUSDT",  "AVAXUSDT", "LINKUSDT", "DOTUSDT",
    // Tier 2 — 주요 알트
    "MATICUSDT","LTCUSDT",  "ATOMUSDT", "UNIUSDT",  "NEARUSDT",
    "APTUSDT",  "ARBUSDT",  "OPUSDT",   "INJUSDT",  "SUIUSDT",
    // Tier 3 — 레이어1 / 인프라
    "TRXUSDT",  "BCHUSDT",  "ETCUSDT",  "FILUSDT",  "ALGOUSDT",
    "VETUSDT",  "EOSUSDT",  "HBARUSDT", "QTUMUSDT", "FLOWUSDT",
    // Tier 4 — DeFi
    "AAVEUSDT", "LDOUSDT",  "CRVUSDT",  "MKRUSDT",  "SNXUSDT",
    "RUNEUSDT", "GRTUSDT",  "PENDLEUSDT","KAVAUSDT", "IMXUSDT",
    // Tier 5 — 메타버스 / 게임
    "SANDUSDT", "MANAUSDT", "GALAUSDT", "AXSUSDT",  "ENJUSDT",
    // Tier 6 — 신규 / 트렌드
    "TONUSDT",  "SEIUSDT",  "TIAUSDT",  "WLDUSDT",  "ORDIUSDT",
    "JUPUSDT",  "FETUSDT",  "STXUSDT",  "FTMUSDT",  "WIFUSDT",
] as const;

/** 심볼 → 정식 코인 이름 매핑 */
export const SYMBOL_NAMES: Record<string, string> = {
    BTCUSDT: "Bitcoin",         ETHUSDT: "Ethereum",          BNBUSDT: "BNB",
    SOLUSDT: "Solana",          XRPUSDT: "XRP",               DOGEUSDT: "Dogecoin",
    ADAUSDT: "Cardano",         AVAXUSDT: "Avalanche",        LINKUSDT: "Chainlink",
    DOTUSDT: "Polkadot",        MATICUSDT: "Polygon",         LTCUSDT: "Litecoin",
    ATOMUSDT: "Cosmos",         UNIUSDT: "Uniswap",           NEARUSDT: "NEAR",
    APTUSDT: "Aptos",           ARBUSDT: "Arbitrum",          OPUSDT: "Optimism",
    INJUSDT: "Injective",       SUIUSDT: "Sui",               TRXUSDT: "TRON",
    BCHUSDT: "Bitcoin Cash",    ETCUSDT: "Ethereum Classic",  FILUSDT: "Filecoin",
    ALGOUSDT: "Algorand",       VETUSDT: "VeChain",           EOSUSDT: "EOS",
    HBARUSDT: "Hedera",         QTUMUSDT: "QTUM",             FLOWUSDT: "Flow",
    AAVEUSDT: "Aave",           LDOUSDT: "Lido DAO",          CRVUSDT: "Curve",
    MKRUSDT: "Maker",           SNXUSDT: "Synthetix",         RUNEUSDT: "THORChain",
    GRTUSDT: "The Graph",       PENDLEUSDT: "Pendle",         KAVAUSDT: "Kava",
    IMXUSDT: "Immutable X",     SANDUSDT: "Sandbox",          MANAUSDT: "Decentraland",
    GALAUSDT: "Gala",           AXSUSDT: "Axie Infinity",     ENJUSDT: "Enjin",
    TONUSDT: "Toncoin",         SEIUSDT: "Sei",               TIAUSDT: "Celestia",
    WLDUSDT: "Worldcoin",       ORDIUSDT: "ORDI",             JUPUSDT: "Jupiter",
    FETUSDT: "Fetch.ai",        STXUSDT: "Stacks",            FTMUSDT: "Fantom",
    WIFUSDT: "dogwifhat",
};

/** 레버리지 프리셋 목록 */
export const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 75, 100, 125] as const;
