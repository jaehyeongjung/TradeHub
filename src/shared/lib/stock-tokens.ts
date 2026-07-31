// 바이낸스 주식 토큰(TRADIFI_PERPETUAL) 메타데이터.
// 가격/거래량은 전부 런타임에 API로 가져오고, 여기엔 검색 유입에 필요한 텍스트만 둔다.
//
// 기초자산 이름을 확정하지 못한 심볼(SNXX, DRAM 등)은 개별 페이지를 만들지 않는다.
// 허브 테이블에는 심볼 그대로 노출된다.

export type StockMarket = "KR" | "US";

export type StockCategory = "주식" | "ETF" | "비상장";

export type StockToken = {
    slug: string;
    symbol: string;          // 바이낸스 심볼 (USDT 제외) 예: "SAMSUNG"
    koreanName: string;      // 페이지 H1에 쓰이는 정식 한글명
    englishName: string;
    /**
     * 사람들이 실제로 검색창에 치는 짧은 이름. title·h1 앞머리에 쓴다.
     * ("삼전 실시간 가격"처럼 정식명보다 줄임말로 검색되는 종목만 채운다)
     */
    shortName?: string;
    /** 검색 유입 키워드. 줄임말·구어체 포함 (예: "삼전") */
    aliases: string[];
    market: StockMarket;
    category: StockCategory;
    /** 원장 상장 정보. 예: "KOSPI 005930" — 종목 식별 정보로 페이지 고유성을 만든다. */
    listing: string;
    /** 도입부 2~3문장. 종목이 뭔지 + 왜 토큰으로 거래되는지. */
    summary: string;
    /** 이 종목만의 관전 포인트 1~2문장. 템플릿 문구와 겹치지 않게. */
    angle: string;
    /**
     * 이 종목 가격을 움직이는 요인. 종목마다 다른 본문을 만드는 축이다.
     * 템플릿 문장만 반복하면 24개 페이지가 서로 중복으로 판정된다.
     */
    watchPoints: { title: string; body: string }[];
    /** 종목별 추가 FAQ. 공통 FAQ 뒤에 붙는다. */
    extraFaqs?: { question: string; answer: string }[];
    /**
     * "층" 하나의 크기 (표시 통화 기준). 생략하면 한국 종목은 10,000원,
     * 해외 종목은 층수가 두 자리로 떨어지는 단위를 가격에서 자동으로 고른다.
     * 자동 규칙이 어색한 종목만 여기서 덮어쓴다. → features/floors/floor.ts
     */
    floorUnit?: number;
};

/** 한국 거래소(KRX) 정규장 — Asia/Seoul 09:00~15:30 */
export const KRX_HOURS = { open: "09:00", close: "15:30", tz: "Asia/Seoul" } as const;
/** 미국 정규장 — America/New_York 09:30~16:00 */
export const US_HOURS = { open: "09:30", close: "16:00", tz: "America/New_York" } as const;

export const stockTokens: StockToken[] = [
    // ── 한국 주식 ────────────────────────────────────────────────
    {
        slug: "samsung",
        symbol: "SAMSUNG",
        koreanName: "삼성전자",
        englishName: "Samsung Electronics",
        shortName: "삼전",
        aliases: [
            "삼전", "삼성전자 토큰", "삼전 실시간주가", "삼전 실시간가격", "삼성전자 코인", "삼전 야간",
            "삼전 시간외", "삼성전자 시간외 가격", "삼전 새벽 가격", "삼성전자 야간 거래", "삼전 지금",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 005930",
        summary:
            "삼성전자는 메모리 반도체와 스마트폰을 중심으로 하는 한국 시가총액 1위 기업입니다. 바이낸스는 삼성전자 주가를 추종하는 무기한 선물(SAMSUNGUSDT)을 상장해, 한국 증시가 닫힌 시간에도 24시간 가격이 움직입니다.",
        angle:
            "국내 투자자에게 가장 실용적인 쓰임은 '장 마감 후 삼성전자'입니다. KRX가 15시 30분에 닫힌 뒤 미국 반도체 섹터가 급등락하면, 다음 날 09시 시초가가 어디서 열릴지를 이 토큰 가격이 먼저 반영합니다.",
        watchPoints: [
            {
                title: "미국 반도체 섹터의 밤",
                body: "엔비디아·마이크론·샌디스크가 움직이는 시간은 한국 시간으로 밤 22:30~다음 날 05:00입니다. KRX 종가는 그 흐름을 담고 있지 않지만, 삼성전자 토큰은 그 시간에도 계속 거래되며 반응합니다.",
            },
            {
                title: "HBM·메모리 가격 뉴스",
                body: "D램·낸드 고정거래가격 발표나 HBM 공급 계약 소식은 발표 시점이 정해져 있지 않습니다. 장 마감 뒤에 나온 소식은 토큰 가격에 먼저 반영되고, 다음 날 아침 시초가로 넘어옵니다.",
            },
            {
                title: "원/달러 환율",
                body: "토큰은 USDT로 체결되고 이 페이지는 원화로 환산해 보여줍니다. 달러 가격이 그대로여도 환율이 오르면 원화 표시가 올라가므로, KRX 주가와 비교할 때는 환율 변동을 함께 봐야 합니다.",
            },
        ],
        extraFaqs: [
            {
                question: "삼전 시간외 단일가와 이 토큰 가격은 같나요?",
                answer:
                    "다릅니다. KRX 시간외 단일가는 정규장 마감 후 16:00~18:00에 10분 단위로 체결되는 국내 제도이고, 하루가 지나면 더 이상 갱신되지 않습니다. 반면 SAMSUNG 토큰은 새벽과 주말을 포함해 끊기지 않고 거래되므로, 시간외 종료 이후의 흐름은 토큰 가격에서만 확인할 수 있습니다.",
            },
            {
                question: "삼성전자 다음 날 시초가를 이 가격으로 예측할 수 있나요?",
                answer:
                    "참고 지표일 뿐 예측은 아닙니다. 토큰 가격은 소수의 참여자와 펀딩비, 레버리지 청산에 영향을 받아 KRX 시초가와 벌어지는 일이 흔합니다. 방향성의 힌트로 보는 정도가 적절하고, 수치 그대로를 시초가로 받아들이면 안 됩니다.",
            },
        ],
    },
    {
        slug: "sk-hynix",
        symbol: "SKHYNIX",
        koreanName: "SK하이닉스",
        englishName: "SK Hynix",
        shortName: "하이닉스",
        aliases: [
            "하이닉스", "하이닉스 실시간가격", "SK하이닉스 토큰", "하이닉스 코인", "하이닉스 야간",
            "sk하이닉스 실시간", "하이닉스 시간외", "SK하이닉스 새벽 가격", "하이닉스 지금",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 000660",
        summary:
            "SK하이닉스는 HBM(고대역폭 메모리)을 앞세운 글로벌 2위 메모리 반도체 기업입니다. 바이낸스 무기한 선물(SKHYNIXUSDT)로 거래되며, 주식 토큰 중 거래대금이 가장 큰 축에 속합니다.",
        angle:
            "AI 서버 수요에 직결된 종목이라 엔비디아·마이크론 실적 발표 직후 가장 크게 반응합니다. 그 발표는 대부분 미국 장 마감 후, 즉 한국 시간 새벽에 나오기 때문에 KRX 종가로는 확인할 수 없습니다.",
        watchPoints: [
            {
                title: "엔비디아 실적 발표 직후",
                body: "엔비디아 실적은 한국 시간 새벽 5~6시에 나옵니다. HBM 최대 공급사인 SK하이닉스는 그 발표에 가장 먼저 반응하는 종목이고, 그 반응은 KRX가 열리는 오전 9시까지 4시간 가까이 토큰 가격에만 남아 있습니다.",
            },
            {
                title: "HBM 공급 계약과 증설",
                body: "HBM3E·HBM4 공급 배분 소식은 업황 전체의 방향을 바꿉니다. 경쟁사 수율 이슈처럼 해외 매체에서 먼저 나오는 뉴스는 국내 장 시간과 무관하게 터집니다.",
            },
            {
                title: "마이크론 가이던스",
                body: "마이크론은 메모리 3사 중 실적을 가장 먼저 발표해 업황 풍향계로 쓰입니다. 그 가이던스가 나온 새벽의 SK하이닉스 토큰 움직임은 다음 날 국내 반도체주 시초가와 자주 연결됩니다.",
            },
        ],
        extraFaqs: [
            {
                question: "하이닉스 토큰 거래대금이 삼성전자보다 큰 이유가 뭔가요?",
                answer:
                    "AI·HBM 테마에 더 직접적으로 연결돼 있어 단기 트레이더의 관심이 몰리기 때문입니다. 주식 시장의 시가총액 순서와 토큰 시장의 거래대금 순서는 일치하지 않습니다. 이 페이지의 24시간 거래대금 수치로 지금 어느 종목에 관심이 쏠려 있는지 확인할 수 있습니다.",
            },
        ],
    },
    {
        slug: "hyundai",
        symbol: "HYUNDAI",
        koreanName: "현대차",
        englishName: "Hyundai Motor",
        shortName: "현대차",
        aliases: [
            "현대차 토큰", "현대차 실시간가격", "현대자동차 주가", "현대차 코인",
            "현대차 야간", "현대차 시간외", "현대자동차 실시간",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 005380",
        summary:
            "현대차는 한국을 대표하는 완성차 기업으로, 전기차와 로보틱스로 사업을 넓히고 있습니다. 바이낸스 무기한 선물(HYUNDAIUSDT)로 24시간 거래됩니다.",
        angle:
            "미국 관세·환율 뉴스에 민감한 수출주라, 워싱턴발 발표가 나오는 한국 새벽 시간대에 토큰 가격이 먼저 움직이는 경우가 많습니다.",
        watchPoints: [
            {
                title: "미국 관세·통상 발표",
                body: "자동차 관세와 보조금 정책은 워싱턴 시간에 발표됩니다. 한국은 대부분 자정 이후라, 정책 뉴스에 대한 시장의 첫 반응은 KRX가 아니라 토큰 가격에 남습니다.",
            },
            {
                title: "원/달러 환율",
                body: "수출 비중이 큰 완성차 업종은 환율에 실적이 직결됩니다. 환율이 급하게 움직이는 새벽 시간대에 토큰 가격도 함께 흔들리는 경우가 많습니다.",
            },
            {
                title: "미국 판매 실적과 전기차 수요",
                body: "월별 미국 판매량, 전기차 수요 둔화 같은 지표는 현지 발표 시각을 따릅니다. 국내 장 시간과 어긋나는 발표가 잦은 종목입니다.",
            },
        ],
    },
];

export const stockTokensBySlug = new Map(stockTokens.map((t) => [t.slug, t]));
export const stockTokensBySymbol = new Map(stockTokens.map((t) => [t.symbol, t]));

export function getStockToken(slug: string): StockToken | undefined {
    return stockTokensBySlug.get(slug);
}

export function getAllStockSlugs(): string[] {
    return stockTokens.map((t) => t.slug);
}

/** 검색창에 실제로 치는 이름. 줄임말이 있으면 그걸 쓴다. */
export function searchName(token: StockToken): string {
    return token.shortName ?? token.koreanName;
}

/** 같은 시장·카테고리 우선으로 관련 종목 추천 */
export function getRelatedStockTokens(token: StockToken, limit = 4): StockToken[] {
    const others = stockTokens.filter((t) => t.slug !== token.slug);
    const score = (t: StockToken) =>
        (t.market === token.market ? 2 : 0) + (t.category === token.category ? 1 : 0);
    return [...others].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
