export const SUPPORTED_SYMBOLS = [
    "BTCUSDT",  "ETHUSDT",  "BNBUSDT",  "SOLUSDT",  "XRPUSDT",
    "DOGEUSDT", "ADAUSDT",  "AVAXUSDT", "LINKUSDT", "DOTUSDT",
    "MATICUSDT","LTCUSDT",  "ATOMUSDT", "UNIUSDT",  "NEARUSDT",
    "APTUSDT",  "ARBUSDT",  "OPUSDT",   "INJUSDT",  "SUIUSDT",
    "TRXUSDT",  "BCHUSDT",  "ETCUSDT",  "FILUSDT",  "ALGOUSDT",
    "VETUSDT",  "EOSUSDT",  "HBARUSDT", "QTUMUSDT", "FLOWUSDT",
    "AAVEUSDT", "LDOUSDT",  "CRVUSDT",  "MKRUSDT",  "SNXUSDT",
    "RUNEUSDT", "GRTUSDT",  "PENDLEUSDT","KAVAUSDT", "IMXUSDT",
    "SANDUSDT", "MANAUSDT", "GALAUSDT", "AXSUSDT",  "ENJUSDT",
    "TONUSDT",  "SEIUSDT",  "TIAUSDT",  "WLDUSDT",  "ORDIUSDT",
    "JUPUSDT",  "FETUSDT",  "STXUSDT",  "FTMUSDT",  "WIFUSDT",
] as const;

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

export const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 75, 100, 125] as const;
