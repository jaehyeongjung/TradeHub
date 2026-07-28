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
    /** 검색 유입 키워드. 줄임말·구어체 포함 (예: "삼전") */
    aliases: string[];
    market: StockMarket;
    category: StockCategory;
    /** 도입부 2~3문장. 종목이 뭔지 + 왜 토큰으로 거래되는지. */
    summary: string;
    /** 이 종목만의 관전 포인트 1~2문장. 템플릿 문구와 겹치지 않게. */
    angle: string;
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
        aliases: ["삼전", "삼성전자 토큰", "삼전 실시간주가", "삼전 실시간가격", "삼성전자 코인", "삼전 야간"],
        market: "KR",
        category: "주식",
        summary:
            "삼성전자는 메모리 반도체와 스마트폰을 중심으로 하는 한국 시가총액 1위 기업입니다. 바이낸스는 삼성전자 주가를 추종하는 무기한 선물(SAMSUNGUSDT)을 상장해, 한국 증시가 닫힌 시간에도 24시간 가격이 움직입니다.",
        angle:
            "국내 투자자에게 가장 실용적인 쓰임은 '장 마감 후 삼성전자'입니다. KRX가 15시 30분에 닫힌 뒤 미국 반도체 섹터가 급등락하면, 다음 날 09시 시초가가 어디서 열릴지를 이 토큰 가격이 먼저 반영합니다.",
    },
    {
        slug: "sk-hynix",
        symbol: "SKHYNIX",
        koreanName: "SK하이닉스",
        englishName: "SK Hynix",
        aliases: ["하이닉스", "하이닉스 실시간가격", "SK하이닉스 토큰", "하이닉스 코인", "하이닉스 야간", "sk하이닉스 실시간"],
        market: "KR",
        category: "주식",
        summary:
            "SK하이닉스는 HBM(고대역폭 메모리)을 앞세운 글로벌 2위 메모리 반도체 기업입니다. 바이낸스 무기한 선물(SKHYNIXUSDT)로 거래되며, 주식 토큰 중 거래대금이 가장 큰 축에 속합니다.",
        angle:
            "AI 서버 수요에 직결된 종목이라 엔비디아·마이크론 실적 발표 직후 가장 크게 반응합니다. 그 발표는 대부분 미국 장 마감 후, 즉 한국 시간 새벽에 나오기 때문에 KRX 종가로는 확인할 수 없습니다.",
    },
    {
        slug: "hyundai",
        symbol: "HYUNDAI",
        koreanName: "현대차",
        englishName: "Hyundai Motor",
        aliases: ["현대차 토큰", "현대차 실시간가격", "현대자동차 주가", "현대차 코인"],
        market: "KR",
        category: "주식",
        summary:
            "현대차는 한국을 대표하는 완성차 기업으로, 전기차와 로보틱스로 사업을 넓히고 있습니다. 바이낸스 무기한 선물(HYUNDAIUSDT)로 24시간 거래됩니다.",
        angle:
            "미국 관세·환율 뉴스에 민감한 수출주라, 워싱턴발 발표가 나오는 한국 새벽 시간대에 토큰 가격이 먼저 움직이는 경우가 많습니다.",
    },

    // ── 한국 관련 ETF ────────────────────────────────────────────
    {
        slug: "koru",
        symbol: "KORU",
        koreanName: "한국 3배 레버리지 ETF",
        englishName: "Direxion Daily South Korea Bull 3X (KORU)",
        aliases: ["KORU", "한국 3배 레버리지", "코스피 3배", "한국 ETF 레버리지"],
        market: "US",
        category: "ETF",
        summary:
            "KORU는 MSCI 한국 지수의 일간 수익률을 3배로 추종하는 미국 상장 레버리지 ETF입니다. 바이낸스는 이 ETF를 기초자산으로 하는 무기한 선물을 제공합니다.",
        angle:
            "한국 증시 전체에 레버리지로 베팅하는 상품이라, 개별 종목이 아니라 '오늘 한국 시장 분위기'를 하나의 숫자로 보고 싶을 때 참고하기 좋습니다. 3배 상품이라 변동성도 3배입니다.",
    },
    {
        slug: "ewy",
        symbol: "EWY",
        koreanName: "MSCI 한국 ETF",
        englishName: "iShares MSCI South Korea ETF (EWY)",
        aliases: ["EWY", "MSCI 한국", "한국 ETF", "코스피 ETF 미국"],
        market: "US",
        category: "ETF",
        summary:
            "EWY는 삼성전자·SK하이닉스 등 한국 대형주를 담은 대표적인 한국 익스포저 ETF입니다. 외국인 투자자가 한국 시장을 사고팔 때 쓰는 대표 창구로 꼽힙니다.",
        angle:
            "외국인 수급의 대리 지표로 자주 인용됩니다. 한국 장이 닫힌 뒤 EWY가 크게 밀리면 다음 날 외국인 순매도로 이어지는 경우가 있어 함께 보는 투자자가 많습니다.",
    },

    // ── 반도체 ───────────────────────────────────────────────────
    {
        slug: "sandisk",
        symbol: "SNDK",
        koreanName: "샌디스크",
        englishName: "SanDisk",
        aliases: ["샌디스크", "SNDK", "샌디스크 주가", "낸드 관련주"],
        market: "US",
        category: "주식",
        summary:
            "샌디스크는 웨스턴디지털에서 분사한 낸드플래시 메모리 전문 기업입니다. 주식 토큰 중 거래대금 1위를 기록할 만큼 거래가 활발합니다.",
        angle:
            "낸드 가격 사이클에 직결돼 삼성전자·SK하이닉스와 같은 방향으로 움직이는 경우가 많습니다. 국내 메모리주를 보는 투자자에게 선행 지표로 쓰입니다.",
    },
    {
        slug: "micron",
        symbol: "MU",
        koreanName: "마이크론",
        englishName: "Micron Technology",
        aliases: ["마이크론", "MU 주가", "마이크론 실적", "메모리 반도체"],
        market: "US",
        category: "주식",
        summary:
            "마이크론은 미국의 대표 메모리 반도체 기업으로, DRAM과 낸드를 모두 생산합니다. 삼성전자·SK하이닉스와 함께 메모리 3강으로 불립니다.",
        angle:
            "실적 발표가 메모리 업황의 풍향계로 통합니다. 발표는 미국 장 마감 후에 나오므로, 그날 새벽 마이크론 토큰의 반응이 다음 날 국내 반도체주 시초가와 자주 연결됩니다.",
    },
    {
        slug: "nvidia",
        symbol: "NVDA",
        koreanName: "엔비디아",
        englishName: "NVIDIA",
        aliases: ["엔비디아", "엔비디아 실시간", "NVDA 주가", "엔비디아 토큰", "엔비디아 야간"],
        market: "US",
        category: "주식",
        summary:
            "엔비디아는 AI 가속기 시장을 사실상 독점하는 반도체 기업으로, 글로벌 시가총액 최상위권에 있습니다. 바이낸스 무기한 선물로 24시간 거래됩니다.",
        angle:
            "엔비디아 실적은 한국 반도체주 전체를 움직입니다. 발표 직후 한국 시간 새벽에 벌어지는 급등락을 실시간으로 볼 수 있다는 게 토큰의 가장 큰 실용성입니다.",
    },
    {
        slug: "intel",
        symbol: "INTC",
        koreanName: "인텔",
        englishName: "Intel",
        aliases: ["인텔", "INTC 주가", "인텔 실시간", "인텔 파운드리"],
        market: "US",
        category: "주식",
        summary:
            "인텔은 CPU 시장의 전통 강자로, 최근에는 파운드리 사업 전환에 사활을 걸고 있습니다. 정책·보조금 뉴스에 크게 반응하는 종목입니다.",
        angle:
            "미국 정부의 반도체 지원책이나 대형 고객 수주 소식이 장외 시간에 나오는 일이 잦아, 정규장 종가만으로는 흐름을 놓치기 쉬운 종목입니다.",
    },
    {
        slug: "amd",
        symbol: "AMD",
        koreanName: "AMD",
        englishName: "Advanced Micro Devices",
        aliases: ["AMD", "AMD 주가", "AMD 실시간", "에이엠디"],
        market: "US",
        category: "주식",
        summary:
            "AMD는 CPU와 AI 가속기 양쪽에서 인텔·엔비디아와 경쟁하는 반도체 기업입니다.",
        angle:
            "엔비디아의 유력한 대안으로 거론될 때마다 급등하는 패턴이 반복됩니다. AI 반도체 경쟁 구도를 볼 때 엔비디아와 함께 놓고 보는 종목입니다.",
    },
    {
        slug: "marvell",
        symbol: "MRVL",
        koreanName: "마벨",
        englishName: "Marvell Technology",
        aliases: ["마벨", "MRVL", "마벨 테크놀로지", "커스텀 ASIC"],
        market: "US",
        category: "주식",
        summary:
            "마벨은 데이터센터용 커스텀 반도체와 네트워킹 칩을 만드는 기업입니다. 빅테크의 자체 AI 칩 설계를 돕는 역할로 주목받고 있습니다.",
        angle:
            "빅테크가 엔비디아 의존도를 낮추려 할수록 수혜를 보는 구조라, AI 반도체 판도 변화를 읽는 데 참고가 됩니다.",
    },

    // ── 빅테크 ───────────────────────────────────────────────────
    {
        slug: "tesla",
        symbol: "TSLA",
        koreanName: "테슬라",
        englishName: "Tesla",
        aliases: ["테슬라", "테슬라 실시간", "테슬라 토큰", "TSLA 주가", "테슬라 야간", "테슬라 서학개미"],
        market: "US",
        category: "주식",
        summary:
            "테슬라는 전기차와 자율주행·로보틱스를 아우르는 기업으로, 국내 서학개미가 가장 많이 보유한 해외 종목 중 하나입니다.",
        angle:
            "국내 보유자가 워낙 많아 '지금 테슬라 얼마'라는 질문이 24시간 나옵니다. 미국 장이 열리기 전에도 토큰 가격으로 방향을 가늠할 수 있습니다.",
    },
    {
        slug: "apple",
        symbol: "AAPL",
        koreanName: "애플",
        englishName: "Apple",
        aliases: ["애플", "애플 주가", "AAPL", "애플 실시간", "애플 토큰"],
        market: "US",
        category: "주식",
        summary:
            "애플은 아이폰을 중심으로 한 글로벌 시가총액 최상위 기업입니다. 바이낸스 무기한 선물로 24시간 거래됩니다.",
        angle:
            "신제품 발표와 실적이 미국 시간 기준으로 나오기 때문에, 한국에서는 대부분 새벽에 소식을 접하게 됩니다.",
    },
    {
        slug: "microsoft",
        symbol: "MSFT",
        koreanName: "마이크로소프트",
        englishName: "Microsoft",
        aliases: ["마이크로소프트", "MSFT", "마소 주가", "마이크로소프트 실시간"],
        market: "US",
        category: "주식",
        summary:
            "마이크로소프트는 클라우드(애저)와 오피스, 그리고 OpenAI 파트너십을 통한 AI 사업을 가진 빅테크입니다.",
        angle:
            "애저 성장률이 AI 투자 사이클 전체의 체온계로 읽힙니다. 실적 발표 직후 반응이 반도체 섹터로 번지는 경우가 많습니다.",
    },
    {
        slug: "alphabet",
        symbol: "GOOGL",
        koreanName: "알파벳(구글)",
        englishName: "Alphabet",
        aliases: ["구글 주가", "알파벳", "GOOGL", "구글 실시간"],
        market: "US",
        category: "주식",
        summary:
            "알파벳은 구글 검색·유튜브·클라우드와 제미나이 AI를 보유한 기업입니다.",
        angle:
            "검색 광고 매출과 AI 경쟁력이 동시에 평가받는 종목이라, AI 관련 발표에 주가 반응이 양방향으로 크게 나옵니다.",
    },
    {
        slug: "amazon",
        symbol: "AMZN",
        koreanName: "아마존",
        englishName: "Amazon",
        aliases: ["아마존", "AMZN", "아마존 주가", "아마존 실시간"],
        market: "US",
        category: "주식",
        summary:
            "아마존은 이커머스와 세계 1위 클라우드 사업자 AWS를 함께 운영하는 기업입니다.",
        angle:
            "AWS 성장률이 실적의 핵심이라, 클라우드 지출 사이클을 보는 투자자가 함께 참고합니다.",
    },
    {
        slug: "meta",
        symbol: "META",
        koreanName: "메타",
        englishName: "Meta Platforms",
        aliases: ["메타", "META", "페이스북 주가", "메타 실시간"],
        market: "US",
        category: "주식",
        summary:
            "메타는 페이스북·인스타그램을 운영하며 AI 인프라에 대규모로 투자하고 있는 기업입니다.",
        angle:
            "AI 설비투자 규모를 발표할 때마다 주가가 크게 흔들립니다. 투자 확대가 호재와 악재로 번갈아 해석되는 특이한 종목입니다.",
    },

    // ── 암호화폐 연관주 ──────────────────────────────────────────
    {
        slug: "coinbase",
        symbol: "COIN",
        koreanName: "코인베이스",
        englishName: "Coinbase Global",
        aliases: ["코인베이스", "COIN 주가", "코인베이스 실시간", "코인 관련주"],
        market: "US",
        category: "주식",
        summary:
            "코인베이스는 미국 최대 암호화폐 거래소로, 상장 주식으로 거래되는 대표적인 크립토 연관 기업입니다.",
        angle:
            "비트코인 가격과 상관관계가 높아, 주말에 코인 시장이 크게 움직였을 때 월요일 개장 전 방향을 미리 보여주는 역할을 합니다.",
    },
    {
        slug: "microstrategy",
        symbol: "MSTR",
        koreanName: "마이크로스트래티지(스트래티지)",
        englishName: "Strategy (MicroStrategy)",
        aliases: ["마이크로스트래티지", "MSTR", "스트래티지 주가", "비트코인 관련주"],
        market: "US",
        category: "주식",
        summary:
            "마이크로스트래티지는 비트코인을 대규모로 보유한 기업으로, 사실상 비트코인 레버리지 주식으로 거래됩니다.",
        angle:
            "비트코인이 주말에 급등락해도 미국 증시는 닫혀 있습니다. 이 토큰은 그 시간에도 거래되기 때문에 괴리가 가장 극적으로 드러나는 종목입니다.",
    },
    {
        slug: "palantir",
        symbol: "PLTR",
        koreanName: "팔란티어",
        englishName: "Palantir Technologies",
        aliases: ["팔란티어", "PLTR", "팔란티어 주가", "팔란티어 실시간"],
        market: "US",
        category: "주식",
        summary:
            "팔란티어는 정부·기업용 데이터 분석 플랫폼 기업으로, AI 수혜주로 분류돼 국내 투자자 사이에서도 인지도가 높습니다.",
        angle:
            "정부 계약 수주 공시가 불규칙한 시간에 나와 장외 변동이 잦은 편입니다.",
    },

    // ── 비상장 ───────────────────────────────────────────────────
    {
        slug: "spacex",
        symbol: "SPCX",
        koreanName: "스페이스X",
        englishName: "SpaceX",
        aliases: ["스페이스X", "SPCX", "스페이스엑스 주가", "스페이스x 투자", "일론머스크 우주"],
        market: "US",
        category: "비상장",
        summary:
            "스페이스X는 아직 증시에 상장되지 않은 비상장 기업입니다. 바이낸스는 장외 가치평가를 기초로 한 무기한 선물(SPCXUSDT)을 제공합니다.",
        angle:
            "상장 주식이 아니기 때문에 참조할 정규장 종가 자체가 없습니다. 다른 종목과 달리 '괴리'라는 개념이 성립하지 않으며, 가격은 전적으로 장외 평가와 수급으로 결정됩니다. 그만큼 변동성과 괴리 위험이 큽니다.",
    },

    // ── 지수·섹터 ETF ────────────────────────────────────────────
    {
        slug: "soxl",
        symbol: "SOXL",
        koreanName: "반도체 3배 레버리지 ETF",
        englishName: "Direxion Daily Semiconductor Bull 3X (SOXL)",
        aliases: ["SOXL", "속슬", "반도체 3배", "소셜 ETF", "SOXL 실시간"],
        market: "US",
        category: "ETF",
        summary:
            "SOXL은 미국 반도체 지수(ICE Semiconductor)를 3배로 추종하는 레버리지 ETF입니다. 국내 투자자에게도 익숙한 고위험 상품입니다.",
        angle:
            "반도체 섹터 전체의 심리를 3배로 증폭해 보여줍니다. 다만 일간 수익률을 3배로 추종하는 구조라 횡보장에서는 원금이 녹는 점을 반드시 감안해야 합니다.",
    },
    {
        slug: "soxs",
        symbol: "SOXS",
        koreanName: "반도체 인버스 3배 ETF",
        englishName: "Direxion Daily Semiconductor Bear 3X (SOXS)",
        aliases: ["SOXS", "반도체 인버스", "반도체 하락 베팅"],
        market: "US",
        category: "ETF",
        summary:
            "SOXS는 미국 반도체 지수를 -3배로 추종하는 인버스 레버리지 ETF입니다. 반도체 하락에 베팅하는 상품입니다.",
        angle:
            "SOXL과 정확히 반대로 움직입니다. 둘을 나란히 보면 반도체 섹터의 방향성 쏠림을 가늠할 수 있습니다.",
    },
    {
        slug: "qqq",
        symbol: "QQQ",
        koreanName: "나스닥100 ETF",
        englishName: "Invesco QQQ Trust",
        aliases: ["QQQ", "나스닥100", "나스닥 ETF", "나스닥 실시간", "큐큐큐"],
        market: "US",
        category: "ETF",
        summary:
            "QQQ는 나스닥100 지수를 추종하는 세계에서 가장 거래가 활발한 ETF 중 하나입니다.",
        angle:
            "미국 기술주 시장 전체의 온도계입니다. 한국 새벽 시간에 QQQ 토큰이 급락하면 그날 아침 코스피 기술주도 약세로 출발하는 경우가 많습니다.",
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

/** 같은 시장·카테고리 우선으로 관련 종목 추천 */
export function getRelatedStockTokens(token: StockToken, limit = 4): StockToken[] {
    const others = stockTokens.filter((t) => t.slug !== token.slug);
    const score = (t: StockToken) =>
        (t.market === token.market ? 2 : 0) + (t.category === token.category ? 1 : 0);
    return [...others].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
