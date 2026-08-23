"use client";

import { usePathname } from "next/navigation";

/**
 * 모바일 뷰 문구. /dashboard와 /en/dashboard가 같은 컴포넌트를 쓰므로
 * 문자열을 컴포넌트 안에 박아두면 영어 화면에 한글이 새어 나간다.
 */
const KO = {
    menu: "메뉴",
    openMenu: "메뉴 열기",
    mainMenu: "주요 메뉴",
    toLight: "라이트 모드로 전환",
    toDark: "다크 모드로 전환",
    navDashboard: "대시보드",
    navTrading: "모의투자",
    navRanking: "코인랭킹",
    navAnalysis: "차트분석",
    navStocks: "주식",
    navStocksHint: "24시간 시세",

    hotCoins: "실시간 핫코인",
    news: "코인 뉴스",
    newsEmpty: "표시할 뉴스가 없습니다",
    newsMore: (n: number) => `뉴스 ${n}개 더 보기`,
    newsCollapse: "접기",

    corePrices: "핵심 시세",
    marketGauges: "시장 지표",
    fearGreed: "공포탐욕",
    fearGreedAria: (v: number, label: string) => `공포탐욕지수 ${v}점, ${label}`,
    fgExtremeFear: "극단적 공포",
    fgFear: "공포",
    fgNeutral: "중립",
    fgGreed: "탐욕",
    fgExtremeGreed: "극단적 탐욕",

    kimchi: "김치프리미엄",
    upbit: "업비트",
    global: "글로벌",
    fx: "환율",

    liveTrades: "실시간 체결",
    waitingFeed: "체결을 기다리는 중",
    liquidations: "실시간 청산",
    whales: "고래 거래",
    longLiq: "롱 청산",
    shortLiq: "숏 청산",
    buy: "매수",
    sell: "매도",

    // 모의투자
    orderBook: "호가",
    positions: "포지션",
    openOrders: "미체결",
    tradeHistory: "거래내역",
    ranking: "랭킹",
    balance: "잔고",
    unrealizedPnl: "미실현 손익",
    long: "롱",
    short: "숏",
    longOrder: "롱 주문",
    shortOrder: "숏 주문",
    closeSheet: "닫기",
    chart: "차트",

    justNow: "방금",
    minsAgo: (n: number) => `${n}분 전`,
    hoursAgo: (n: number) => `${n}시간 전`,
    daysAgo: (n: number) => `${n}일 전`,
};

export type MobileCopy = typeof KO;

const EN: MobileCopy = {
    menu: "Menu",
    openMenu: "Open menu",
    mainMenu: "Main Menu",
    toLight: "Switch to light mode",
    toDark: "Switch to dark mode",
    navDashboard: "Dashboard",
    navTrading: "Sim Trading",
    navRanking: "Rankings",
    navAnalysis: "Chart Analysis",
    navStocks: "Stocks",
    navStocksHint: "24h quotes",

    hotCoins: "Hot Coins",
    news: "Crypto News",
    newsEmpty: "No news to show",
    newsMore: (n: number) => `Show ${n} more`,
    newsCollapse: "Show less",

    corePrices: "Prices",
    marketGauges: "Market indicators",
    fearGreed: "Fear & Greed",
    fearGreedAria: (v: number, label: string) => `Fear and Greed Index ${v}, ${label}`,
    fgExtremeFear: "Extreme Fear",
    fgFear: "Fear",
    fgNeutral: "Neutral",
    fgGreed: "Greed",
    fgExtremeGreed: "Extreme Greed",

    kimchi: "Kimchi Premium",
    upbit: "Upbit",
    global: "Global",
    fx: "USD/KRW",

    liveTrades: "Live trades",
    waitingFeed: "Waiting for trades",
    liquidations: "Liquidations",
    whales: "Whale Trades",
    longLiq: "Long liq.",
    shortLiq: "Short liq.",
    buy: "Buy",
    sell: "Sell",

    // 모의투자
    orderBook: "Order Book",
    positions: "Positions",
    openOrders: "Open Orders",
    tradeHistory: "History",
    ranking: "Rankings",
    balance: "Balance",
    unrealizedPnl: "Unrealized PnL",
    long: "Long",
    short: "Short",
    longOrder: "Long Order",
    shortOrder: "Short Order",
    closeSheet: "Close",
    chart: "Chart",

    justNow: "now",
    minsAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
};

export function useMobileCopy(): { t: MobileCopy; isEn: boolean } {
    const isEn = (usePathname() ?? "").startsWith("/en");
    return { t: isEn ? EN : KO, isEn };
}
