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
    // 2026-08-14 바이낸스 추가 상장. 심볼만으로는 기초자산을 확정할 수 없어
    // (특히 HANMI) 야후 KRX 실시세와 토큰 원화 표시가를 대조해 1:1로 확인했다.
    {
        slug: "samsung-electro-mechanics",
        symbol: "SAMSUNGEM",
        koreanName: "삼성전기",
        englishName: "Samsung Electro-Mechanics",
        shortName: "삼성전기",
        aliases: [
            "삼성전기", "삼성전기 토큰", "삼성전기 실시간가격", "삼성전기 주가", "삼성전기 코인",
            "삼성전기 야간", "삼성전기 시간외", "MLCC 관련주", "삼성전기 지금",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 009150",
        summary:
            "삼성전기는 MLCC(적층세라믹콘덴서)와 반도체 패키지기판, 카메라모듈을 만드는 부품 회사입니다. 완제품이 아니라 부품을 팔기 때문에 전방 산업의 수요가 먼저 흔들리고 실적이 뒤따라 움직입니다. 바이낸스 무기한 선물(SAMSUNGEMUSDT)로 24시간 거래됩니다.",
        angle:
            "삼성전자·SK하이닉스와 같은 반도체 묶음으로 취급되지만 실제 매출은 스마트폰·전장·서버로 흩어져 있습니다. 그래서 새벽에 미국 반도체주가 오를 때 같이 오르다가도, 스마트폰 출하 지표 하나에 방향이 갈리는 종목입니다.",
        watchPoints: [
            {
                title: "AI 서버용 패키지기판(FC-BGA)",
                body: "고성능 칩일수록 기판 단가가 올라가 수익성에 직결됩니다. 관련 소식은 대부분 미국 반도체 업체 실적 발표와 함께 새벽에 나오고, KRX 종가에는 담기지 않습니다.",
            },
            {
                title: "MLCC의 전장 비중",
                body: "전기차 한 대에 들어가는 MLCC는 스마트폰의 수십 배입니다. 완성차 판매 지표나 전기차 수요 둔화 뉴스가 나오면 반도체가 아니라 자동차 업종과 함께 움직입니다.",
            },
            {
                title: "스마트폰 출하량 사이클",
                body: "카메라모듈은 최대 고객사의 신제품 주기를 그대로 탑니다. 출하량 전망치 조정은 해외 리서치에서 먼저 나오는 경우가 많아, 국내 장 시간과 어긋나 발표됩니다.",
            },
        ],
    },
    {
        slug: "hanmi-semiconductor",
        symbol: "HANMI",
        koreanName: "한미반도체",
        englishName: "Hanmi Semiconductor",
        shortName: "한미반도체",
        aliases: [
            "한미반도체", "한미반도체 토큰", "한미반도체 실시간가격", "한미반도체 주가",
            "한미반도체 코인", "한미반도체 야간", "한미반도체 시간외", "TC본더 관련주",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 042700",
        summary:
            "한미반도체는 HBM을 쌓아 올릴 때 쓰는 TC 본더(열압착 본딩 장비)를 만드는 반도체 후공정 장비 회사입니다. 메모리 회사가 생산능력을 늘리기로 결정하면 장비 발주가 먼저 나오기 때문에, 업황보다 앞서 움직이는 성격이 있습니다. 바이낸스 무기한 선물(HANMIUSDT)로 24시간 거래됩니다.",
        angle:
            "이름이 비슷한 한미약품·한미사이언스와는 전혀 다른 회사입니다. 바이낸스 심볼이 HANMI 하나뿐이라 헷갈리기 쉬운데, 이 토큰이 따라가는 건 KOSPI 042700 한미반도체입니다.",
        watchPoints: [
            {
                title: "HBM 증설 발표",
                body: "메모리 회사가 HBM 생산능력 확대를 발표하면 장비 수주 기대가 먼저 반영됩니다. 이런 발표는 해외 실적 발표와 함께 한국 새벽에 나오는 일이 잦습니다.",
            },
            {
                title: "장비 시장의 경쟁 구도",
                body: "TC 본더 시장에 경쟁사가 들어오는지, 고객사가 공급처를 나누는지가 밸류에이션을 크게 흔듭니다. 점유율 관련 소식 하나에 반응 폭이 큰 편입니다.",
            },
            {
                title: "AI 투자 사이클",
                body: "HBM 수요의 최종 출발점은 AI 가속기 수요입니다. 한국 시간 새벽에 나오는 해외 반도체 기업의 실적과 데이터센터 투자 계획이 장비주 전체의 방향을 결정합니다.",
            },
        ],
        extraFaqs: [
            {
                question: "HANMI 토큰은 한미약품인가요?",
                answer:
                    "아닙니다. 이 토큰은 KOSPI 042700 한미반도체를 추종합니다. 한미약품(128940)과 한미사이언스(008930)는 서로 다른 회사이며 바이낸스에 상장돼 있지 않습니다. 세 종목은 주가 수준이 크게 달라 가격만 비교해도 구분할 수 있습니다.",
            },
        ],
    },
    {
        slug: "lg-electronics",
        symbol: "LGELECTRONICS",
        koreanName: "LG전자",
        englishName: "LG Electronics",
        shortName: "LG전자",
        aliases: [
            "LG전자", "엘지전자", "LG전자 토큰", "LG전자 실시간가격", "LG전자 주가",
            "LG전자 코인", "LG전자 야간", "LG전자 시간외", "엘지전자 실시간",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 066570",
        summary:
            "LG전자는 생활가전과 TV로 알려져 있지만, 실적의 무게중심은 자동차 전장 부품과 냉난방공조(HVAC)로 옮겨가고 있습니다. 바이낸스 무기한 선물(LGELECTRONICSUSDT)로 24시간 거래됩니다.",
        angle:
            "소비재 회사로 보이지만 주가를 움직이는 건 소비 심리보다 B2B 수주입니다. 데이터센터 냉각 수요나 완성차 업체의 전장 발주처럼, 국내 장 시간과 무관하게 해외에서 나오는 소식에 반응합니다.",
        watchPoints: [
            {
                title: "데이터센터 냉각(HVAC) 수요",
                body: "AI 데이터센터가 늘수록 냉각 설비 수요가 커집니다. 관련 발표는 해외 빅테크의 투자 계획과 함께 나오는 경우가 많아, 한국 새벽 시간대에 반영됩니다.",
            },
            {
                title: "전장(VS) 수주잔고",
                body: "차량용 인포테인먼트와 전기차 부품 수주는 분기 실적에서 확인됩니다. 완성차 업황이 꺾이면 수주잔고에 대한 기대도 함께 내려갑니다.",
            },
            {
                title: "해외 가전 수요와 물류비",
                body: "북미·유럽 가전 수요와 해상 운임은 마진에 직접 영향을 줍니다. 운임 지표와 현지 소비 지표는 국내 장 시간과 어긋나 발표됩니다.",
            },
        ],
    },
    {
        slug: "naver",
        symbol: "NAVER",
        koreanName: "NAVER",
        englishName: "NAVER Corporation",
        shortName: "네이버",
        aliases: [
            "네이버", "네이버 주가", "NAVER 토큰", "네이버 실시간가격", "네이버 코인",
            "네이버 야간", "네이버 시간외", "naver 주가 실시간", "네이버 지금",
        ],
        market: "KR",
        category: "주식",
        listing: "KOSPI 035420",
        summary:
            "NAVER는 검색 포털에서 출발해 커머스·핀테크·웹툰·클라우드로 사업을 넓힌 인터넷 기업입니다. 반도체와 제조업이 대부분인 한국 주식 토큰 중에서 성격이 가장 다른 종목입니다. 바이낸스 무기한 선물(NAVERUSDT)로 24시간 거래됩니다.",
        angle:
            "수출 제조업과 달리 환율이나 반도체 업황에 직접 연동되지 않습니다. 대신 해외 인터넷·AI 기업의 주가 흐름과 국내 플랫폼 규제 뉴스에 반응해, 같은 날 다른 한국 토큰들과 방향이 갈리는 경우가 많습니다.",
        watchPoints: [
            {
                title: "AI와 검색 트래픽",
                body: "생성형 AI가 검색 트래픽을 가져가는지가 장기 성장의 핵심 쟁점입니다. 해외 AI 기업의 발표는 대부분 한국 시간 새벽에 나옵니다.",
            },
            {
                title: "커머스 경쟁 강도",
                body: "국내외 이커머스와의 경쟁이 커머스 부문 성장률을 좌우합니다. 경쟁사의 실적 발표가 NAVER 주가에 영향을 주는 구조입니다.",
            },
            {
                title: "해외 상장 자회사",
                body: "미국에 상장된 자회사 주가는 미국 장 시간에 움직입니다. 그 변동은 다음 날 국내 장이 열리기 전 토큰 가격에 먼저 반영됩니다.",
            },
        ],
    },
    {
        slug: "kodex-200",
        symbol: "KODEX200",
        koreanName: "KODEX 200",
        englishName: "KODEX 200 ETF",
        shortName: "코덱스200",
        aliases: [
            "코덱스200", "KODEX 200", "코스피200 ETF", "kodex200 토큰", "코스피 야간",
            "코스피200 실시간", "코덱스200 실시간가격", "코스피 지수 야간",
        ],
        market: "KR",
        category: "ETF",
        listing: "KOSPI 069500",
        summary:
            "KODEX 200은 코스피200 지수를 추종하는 국내 대표 ETF입니다. 개별 기업이 아니라 한국 증시 전체를 담고 있어, 이 토큰 가격은 사실상 '지금 이 순간의 코스피'에 가깝습니다. 바이낸스 무기한 선물(KODEX200USDT)로 24시간 거래됩니다.",
        angle:
            "다른 주식 토큰이 종목 하나의 야간 흐름을 보여준다면, 이건 시장 전체의 야간 흐름을 보여줍니다. KRX가 닫힌 밤사이 한국 증시가 어디로 향하는지 숫자 하나로 확인하려는 용도에 맞습니다.",
        watchPoints: [
            {
                title: "미국 증시 마감 방향",
                body: "S&P500과 나스닥이 마감하는 한국 시간 새벽의 결과는 다음 날 코스피 시초가와 상관이 높습니다. 그 반응이 이 토큰에 실시간으로 찍힙니다.",
            },
            {
                title: "지수 안의 반도체 비중",
                body: "코스피200은 대형 반도체주의 비중이 커서 사실상 반도체 업황의 영향을 크게 받습니다. 개별 반도체 토큰과 나란히 보면 상승이 시장 전체인지 특정 종목인지 구분할 수 있습니다.",
            },
            {
                title: "환율과 외국인 수급",
                body: "원/달러 환율이 급하게 오르면 외국인 자금 이탈 우려가 지수 전반을 누릅니다. 환율은 국내 장 시간과 무관하게 24시간 움직입니다.",
            },
        ],
        extraFaqs: [
            {
                question: "KODEX 200 토큰 가격은 실제 ETF 가격과 같나요?",
                answer:
                    "완전히 같지는 않습니다. 이 토큰은 KODEX 200을 추종하는 무기한 선물이라 펀딩비와 수급에 따라 실제 ETF 가격과 벌어질 수 있고, KRX가 닫힌 시간에는 비교 대상 자체가 멈춰 있습니다. 국내 장이 열려 있는 09:00~15:30에는 두 가격이 대체로 붙어서 움직입니다.",
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
