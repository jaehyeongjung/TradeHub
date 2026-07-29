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

    // ── 한국 관련 ETF ────────────────────────────────────────────
    {
        slug: "koru",
        symbol: "KORU",
        koreanName: "한국 3배 레버리지 ETF",
        englishName: "Direxion Daily South Korea Bull 3X (KORU)",
        aliases: ["KORU", "한국 3배 레버리지", "코스피 3배", "한국 ETF 레버리지", "KORU 실시간"],
        market: "US",
        category: "ETF",
        listing: "NYSE Arca: KORU",
        summary:
            "KORU는 MSCI 한국 지수의 일간 수익률을 3배로 추종하는 미국 상장 레버리지 ETF입니다. 바이낸스는 이 ETF를 기초자산으로 하는 무기한 선물을 제공합니다.",
        angle:
            "한국 증시 전체에 레버리지로 베팅하는 상품이라, 개별 종목이 아니라 '오늘 한국 시장 분위기'를 하나의 숫자로 보고 싶을 때 참고하기 좋습니다. 3배 상품이라 변동성도 3배입니다.",
        watchPoints: [
            {
                title: "한국 시장 전체의 방향",
                body: "개별 종목 뉴스보다 코스피 전반의 흐름에 반응합니다. 지수 방향만 빠르게 확인하고 싶을 때 개별 종목보다 읽기 쉽습니다.",
            },
            {
                title: "3배 레버리지의 복리 손실",
                body: "일간 수익률을 3배로 추종하는 구조라 오르내림이 반복되는 횡보장에서는 지수가 제자리여도 가치가 깎입니다. 장기 보유 관점에서 보기에 적합하지 않습니다.",
            },
        ],
    },
    {
        slug: "ewy",
        symbol: "EWY",
        koreanName: "MSCI 한국 ETF",
        englishName: "iShares MSCI South Korea ETF (EWY)",
        aliases: ["EWY", "MSCI 한국", "한국 ETF", "코스피 ETF 미국", "EWY 실시간"],
        market: "US",
        category: "ETF",
        listing: "NYSE Arca: EWY",
        summary:
            "EWY는 삼성전자·SK하이닉스 등 한국 대형주를 담은 대표적인 한국 익스포저 ETF입니다. 외국인 투자자가 한국 시장을 사고팔 때 쓰는 대표 창구로 꼽힙니다.",
        angle:
            "외국인 수급의 대리 지표로 자주 인용됩니다. 한국 장이 닫힌 뒤 EWY가 크게 밀리면 다음 날 외국인 순매도로 이어지는 경우가 있어 함께 보는 투자자가 많습니다.",
        watchPoints: [
            {
                title: "외국인 수급의 대리 지표",
                body: "한국 장 마감 이후 미국 시간대에 EWY가 크게 밀리면, 다음 날 외국인 순매도로 이어지는 경우가 있습니다. 삼성전자·SK하이닉스 비중이 커 두 종목과 방향이 비슷하게 움직입니다.",
            },
            {
                title: "환율이 섞인 수익률",
                body: "달러로 거래되는 ETF라 원/달러 환율이 수익률에 함께 들어갑니다. 코스피가 올라도 원화가 약해지면 EWY는 덜 오르거나 하락할 수 있습니다.",
            },
        ],
    },

    // ── 반도체 ───────────────────────────────────────────────────
    {
        slug: "sandisk",
        symbol: "SNDK",
        koreanName: "샌디스크",
        englishName: "SanDisk",
        aliases: ["샌디스크", "SNDK", "샌디스크 주가", "낸드 관련주", "샌디스크 실시간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: SNDK",
        summary:
            "샌디스크는 웨스턴디지털에서 분사한 낸드플래시 메모리 전문 기업입니다. 주식 토큰 중 거래대금 1위를 기록할 만큼 거래가 활발합니다.",
        angle:
            "낸드 가격 사이클에 직결돼 삼성전자·SK하이닉스와 같은 방향으로 움직이는 경우가 많습니다. 국내 메모리주를 보는 투자자에게 선행 지표로 쓰입니다.",
        watchPoints: [
            {
                title: "낸드 고정거래가격",
                body: "낸드 가격 사이클이 실적을 좌우합니다. 가격 반등 신호는 삼성전자·SK하이닉스 낸드 사업에도 같은 방향으로 읽히기 때문에 국내 메모리주와 함께 보는 투자자가 많습니다.",
            },
            {
                title: "주식 토큰 중 최상위 거래대금",
                body: "토큰 시장에서 거래가 가장 활발한 종목 중 하나라 호가가 상대적으로 촘촘합니다. 다른 주식 토큰의 가격이 얇게 움직일 때 이 종목의 흐름을 기준으로 삼는 경우가 있습니다.",
            },
        ],
    },
    {
        slug: "micron",
        symbol: "MU",
        koreanName: "마이크론",
        englishName: "Micron Technology",
        aliases: ["마이크론", "MU 주가", "마이크론 실적", "메모리 반도체", "마이크론 실시간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: MU",
        summary:
            "마이크론은 미국의 대표 메모리 반도체 기업으로, DRAM과 낸드를 모두 생산합니다. 삼성전자·SK하이닉스와 함께 메모리 3강으로 불립니다.",
        angle:
            "실적 발표가 메모리 업황의 풍향계로 통합니다. 발표는 미국 장 마감 후에 나오므로, 그날 새벽 마이크론 토큰의 반응이 다음 날 국내 반도체주 시초가와 자주 연결됩니다.",
        watchPoints: [
            {
                title: "메모리 3사 중 첫 실적 발표",
                body: "분기 실적을 삼성전자·SK하이닉스보다 먼저 내놓기 때문에 업황 방향의 기준점이 됩니다. 발표 직후 새벽의 급등락은 KRX 종가에 담기지 않습니다.",
            },
            {
                title: "가이던스 문구",
                body: "실적 숫자보다 다음 분기 가이던스에 반응이 큽니다. 컨퍼런스콜이 진행되는 동안 가격이 방향을 바꾸는 일이 잦아 실시간으로 확인할 가치가 있는 종목입니다.",
            },
        ],
    },
    {
        slug: "nvidia",
        symbol: "NVDA",
        koreanName: "엔비디아",
        englishName: "NVIDIA",
        shortName: "엔비디아",
        aliases: [
            "엔비디아", "엔비디아 실시간", "NVDA 주가", "엔비디아 토큰", "엔비디아 야간",
            "엔비디아 새벽 주가", "엔비디아 시간외", "엔비디아 지금", "엔비디아 프리마켓",
        ],
        market: "US",
        category: "주식",
        listing: "NASDAQ: NVDA",
        summary:
            "엔비디아는 AI 가속기 시장을 사실상 독점하는 반도체 기업으로, 글로벌 시가총액 최상위권에 있습니다. 바이낸스 무기한 선물로 24시간 거래됩니다.",
        angle:
            "엔비디아 실적은 한국 반도체주 전체를 움직입니다. 발표 직후 한국 시간 새벽에 벌어지는 급등락을 실시간으로 볼 수 있다는 게 토큰의 가장 큰 실용성입니다.",
        watchPoints: [
            {
                title: "실적 발표는 한국 새벽 5~6시",
                body: "미국 장 마감 후에 발표되므로 한국에서는 새벽에 소식을 접합니다. 정규장 종가만 보면 이미 지나간 숫자를 보는 셈이고, 토큰 가격은 그 사이의 반응을 담고 있습니다.",
            },
            {
                title: "한국 반도체주의 선행 지표",
                body: "엔비디아가 크게 움직인 새벽 다음 날, 삼성전자·SK하이닉스 시초가가 같은 방향으로 열리는 패턴이 반복됩니다. 국내 반도체주를 보는 투자자가 함께 확인하는 이유입니다.",
            },
            {
                title: "데이터센터 매출과 공급 이슈",
                body: "차세대 가속기의 양산 일정, 주요 고객사의 발주 소식이 가격을 크게 흔듭니다. 이런 소식은 컨퍼런스나 외신 보도로 불규칙한 시각에 나옵니다.",
            },
        ],
        extraFaqs: [
            {
                question: "엔비디아 프리마켓·애프터마켓 가격과 같은 건가요?",
                answer:
                    "다릅니다. 프리마켓·애프터마켓은 미국 거래소의 정해진 시간대(현지 04:00~09:30, 16:00~20:00)에만 열리고 그 밖의 시간에는 멈춥니다. NVDA 토큰은 그 사이 시간과 주말에도 계속 거래되기 때문에, 애프터마켓이 닫힌 뒤부터 프리마켓이 열리기 전까지의 흐름은 토큰 가격에서만 볼 수 있습니다.",
            },
        ],
    },
    {
        slug: "intel",
        symbol: "INTC",
        koreanName: "인텔",
        englishName: "Intel",
        aliases: ["인텔", "INTC 주가", "인텔 실시간", "인텔 파운드리", "인텔 야간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: INTC",
        summary:
            "인텔은 CPU 시장의 전통 강자로, 최근에는 파운드리 사업 전환에 사활을 걸고 있습니다. 정책·보조금 뉴스에 크게 반응하는 종목입니다.",
        angle:
            "미국 정부의 반도체 지원책이나 대형 고객 수주 소식이 장외 시간에 나오는 일이 잦아, 정규장 종가만으로는 흐름을 놓치기 쉬운 종목입니다.",
        watchPoints: [
            {
                title: "정부 보조금·지분 참여 뉴스",
                body: "반도체 지원책 관련 발표는 정규장 시간과 무관하게 나옵니다. 정책 한 줄에 두 자릿수로 움직인 적이 있어 장외 시간 가격 확인이 유용한 종목입니다.",
            },
            {
                title: "파운드리 고객 확보",
                body: "대형 고객사 수주 여부가 사업 전환 성공의 척도로 읽힙니다. 관련 보도가 나오는 시각은 예측하기 어렵습니다.",
            },
        ],
    },
    {
        slug: "amd",
        symbol: "AMD",
        koreanName: "AMD",
        englishName: "Advanced Micro Devices",
        aliases: ["AMD", "AMD 주가", "AMD 실시간", "에이엠디", "AMD 야간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: AMD",
        summary:
            "AMD는 CPU와 AI 가속기 양쪽에서 인텔·엔비디아와 경쟁하는 반도체 기업입니다.",
        angle:
            "엔비디아의 유력한 대안으로 거론될 때마다 급등하는 패턴이 반복됩니다. AI 반도체 경쟁 구도를 볼 때 엔비디아와 함께 놓고 보는 종목입니다.",
        watchPoints: [
            {
                title: "AI 가속기 수주 소식",
                body: "대형 고객이 엔비디아 외 대안을 채택한다는 소식이 나올 때 가장 크게 반응합니다. 엔비디아 가격과 반대로 움직이는 구간이 생기기도 합니다.",
            },
            {
                title: "엔비디아 실적의 낙수 효과",
                body: "엔비디아 발표 직후 AI 반도체 섹터 전체가 함께 움직입니다. 그 시각은 한국 새벽이라 두 종목을 나란히 놓고 보기에 토큰이 편합니다.",
            },
        ],
    },
    {
        slug: "marvell",
        symbol: "MRVL",
        koreanName: "마벨",
        englishName: "Marvell Technology",
        aliases: ["마벨", "MRVL", "마벨 테크놀로지", "커스텀 ASIC", "마벨 실시간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: MRVL",
        summary:
            "마벨은 데이터센터용 커스텀 반도체와 네트워킹 칩을 만드는 기업입니다. 빅테크의 자체 AI 칩 설계를 돕는 역할로 주목받고 있습니다.",
        angle:
            "빅테크가 엔비디아 의존도를 낮추려 할수록 수혜를 보는 구조라, AI 반도체 판도 변화를 읽는 데 참고가 됩니다.",
        watchPoints: [
            {
                title: "커스텀 AI 칩 수주",
                body: "빅테크의 자체 칩 프로젝트를 수임했다는 소식이 주가의 핵심 변수입니다. 고객사 이름이 공개되지 않는 경우도 많아 추측성 보도에도 반응합니다.",
            },
            {
                title: "데이터센터 네트워킹 수요",
                body: "AI 서버 증설은 가속기뿐 아니라 광통신·네트워킹 칩 수요로도 이어집니다. 엔비디아 실적 발표 시간대에 함께 움직이는 이유입니다.",
            },
        ],
    },

    // ── 빅테크 ───────────────────────────────────────────────────
    {
        slug: "tesla",
        symbol: "TSLA",
        koreanName: "테슬라",
        englishName: "Tesla",
        shortName: "테슬라",
        aliases: [
            "테슬라", "테슬라 실시간", "테슬라 토큰", "TSLA 주가", "테슬라 야간", "테슬라 서학개미",
            "테슬라 지금 주가", "테슬라 새벽", "테슬라 프리마켓", "테슬라 시간외",
        ],
        market: "US",
        category: "주식",
        listing: "NASDAQ: TSLA",
        summary:
            "테슬라는 전기차와 자율주행·로보틱스를 아우르는 기업으로, 국내 서학개미가 가장 많이 보유한 해외 종목 중 하나입니다.",
        angle:
            "국내 보유자가 워낙 많아 '지금 테슬라 얼마'라는 질문이 24시간 나옵니다. 미국 장이 열리기 전에도 토큰 가격으로 방향을 가늠할 수 있습니다.",
        watchPoints: [
            {
                title: "분기 인도량 발표",
                body: "분기 첫 영업일에 발표되는 인도량 숫자가 단기 방향을 결정합니다. 발표 시각이 한국 밤~새벽이라 국내 보유자는 잠든 사이에 가격이 결정되는 셈입니다.",
            },
            {
                title: "일론 머스크의 발언",
                body: "실적 콜, 소셜 미디어 발언, 신제품 이벤트가 예고 없이 가격을 흔듭니다. 정해진 장 시간과 무관하게 터지는 이벤트가 가장 많은 종목입니다.",
            },
            {
                title: "서학개미 보유 비중",
                body: "국내 개인 보유 상위 종목이라 한국 시간대의 관심이 특히 높습니다. 미국 장이 닫힌 낮 시간에 '지금 얼마'를 확인할 수 있다는 점이 토큰의 실용성입니다.",
            },
        ],
        extraFaqs: [
            {
                question: "한국 낮 시간에 테슬라 가격을 보려면 어떻게 하나요?",
                answer:
                    "미국 정규장은 한국 시간 밤 22:30~다음 날 05:00(서머타임 기준)이라 낮에는 증권사 앱에 전일 종가만 남습니다. 이 페이지의 TSLA 토큰 가격은 한국 낮 시간에도 계속 갱신되므로, 미국 장이 열리기 전까지의 시장 분위기를 확인할 수 있습니다. 다만 정규장 시세가 아니라 선물 가격이라는 점은 감안해야 합니다.",
            },
        ],
    },
    {
        slug: "apple",
        symbol: "AAPL",
        koreanName: "애플",
        englishName: "Apple",
        aliases: ["애플", "애플 주가", "AAPL", "애플 실시간", "애플 토큰", "애플 야간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: AAPL",
        summary:
            "애플은 아이폰을 중심으로 한 글로벌 시가총액 최상위 기업입니다. 바이낸스 무기한 선물로 24시간 거래됩니다.",
        angle:
            "신제품 발표와 실적이 미국 시간 기준으로 나오기 때문에, 한국에서는 대부분 새벽에 소식을 접하게 됩니다.",
        watchPoints: [
            {
                title: "9월 신제품 이벤트",
                body: "아이폰 공개 행사는 한국 시간 새벽 2시경에 진행됩니다. 발표 내용에 따라 행사 중에도 가격이 방향을 바꾸는 종목입니다.",
            },
            {
                title: "중국 판매와 공급망",
                body: "중국 수요 부진이나 부품 공급 이슈가 실적 전망을 흔듭니다. 아시아 시간대 보도에도 반응하기 때문에 한국 낮에도 움직임이 나옵니다.",
            },
        ],
    },
    {
        slug: "microsoft",
        symbol: "MSFT",
        koreanName: "마이크로소프트",
        englishName: "Microsoft",
        aliases: ["마이크로소프트", "MSFT", "마소 주가", "마이크로소프트 실시간", "마소 실시간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: MSFT",
        summary:
            "마이크로소프트는 클라우드(애저)와 오피스, 그리고 OpenAI 파트너십을 통한 AI 사업을 가진 빅테크입니다.",
        angle:
            "애저 성장률이 AI 투자 사이클 전체의 체온계로 읽힙니다. 실적 발표 직후 반응이 반도체 섹터로 번지는 경우가 많습니다.",
        watchPoints: [
            {
                title: "애저 성장률",
                body: "클라우드 매출 증가율이 AI 설비투자 사이클의 체온계로 읽힙니다. 이 숫자가 시장 예상을 밑돌면 반도체 섹터까지 함께 밀립니다.",
            },
            {
                title: "AI 설비투자 계획",
                body: "데이터센터 투자 규모 발표는 엔비디아·SK하이닉스 같은 공급망 종목의 방향과 직결됩니다. 발표 시각은 한국 새벽입니다.",
            },
        ],
    },
    {
        slug: "alphabet",
        symbol: "GOOGL",
        koreanName: "알파벳(구글)",
        englishName: "Alphabet",
        aliases: ["구글 주가", "알파벳", "GOOGL", "구글 실시간", "구글 주식"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: GOOGL",
        summary:
            "알파벳은 구글 검색·유튜브·클라우드와 제미나이 AI를 보유한 기업입니다.",
        angle:
            "검색 광고 매출과 AI 경쟁력이 동시에 평가받는 종목이라, AI 관련 발표에 주가 반응이 양방향으로 크게 나옵니다.",
        watchPoints: [
            {
                title: "검색 광고 매출",
                body: "AI 챗봇이 검색 점유율을 잠식한다는 우려와 실제 광고 매출 숫자가 매 분기 부딪힙니다. 실적 발표 직후 변동이 큰 이유입니다.",
            },
            {
                title: "자체 AI 칩과 클라우드",
                body: "TPU 같은 자체 칩 소식은 엔비디아 의존도 논쟁과 맞물려 반도체 섹터 전반으로 파장이 번집니다.",
            },
        ],
    },
    {
        slug: "amazon",
        symbol: "AMZN",
        koreanName: "아마존",
        englishName: "Amazon",
        aliases: ["아마존", "AMZN", "아마존 주가", "아마존 실시간", "아마존 주식"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: AMZN",
        summary:
            "아마존은 이커머스와 세계 1위 클라우드 사업자 AWS를 함께 운영하는 기업입니다.",
        angle:
            "AWS 성장률이 실적의 핵심이라, 클라우드 지출 사이클을 보는 투자자가 함께 참고합니다.",
        watchPoints: [
            {
                title: "AWS 성장률",
                body: "이익의 대부분이 클라우드에서 나오기 때문에 AWS 증가율이 주가를 좌우합니다. 마이크로소프트 애저 숫자와 나란히 비교됩니다.",
            },
            {
                title: "연말 쇼핑 시즌 지표",
                body: "블랙프라이데이·프라임데이 실적과 물류 비용이 이커머스 부문 전망을 바꿉니다.",
            },
        ],
    },
    {
        slug: "meta",
        symbol: "META",
        koreanName: "메타",
        englishName: "Meta Platforms",
        aliases: ["메타", "META", "페이스북 주가", "메타 실시간", "메타 주식"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: META",
        summary:
            "메타는 페이스북·인스타그램을 운영하며 AI 인프라에 대규모로 투자하고 있는 기업입니다.",
        angle:
            "AI 설비투자 규모를 발표할 때마다 주가가 크게 흔들립니다. 투자 확대가 호재와 악재로 번갈아 해석되는 특이한 종목입니다.",
        watchPoints: [
            {
                title: "설비투자 가이던스",
                body: "AI 투자 확대가 어떤 해에는 성장 기대로, 어떤 해에는 비용 부담으로 해석됩니다. 같은 뉴스에 반대로 반응할 수 있는 종목입니다.",
            },
            {
                title: "광고 단가와 이용자 지표",
                body: "인스타그램 릴스 수익화, 광고 단가 회복 여부가 매출의 축입니다. 실적 발표는 한국 새벽에 나옵니다.",
            },
        ],
    },

    // ── 암호화폐 연관주 ──────────────────────────────────────────
    {
        slug: "coinbase",
        symbol: "COIN",
        koreanName: "코인베이스",
        englishName: "Coinbase Global",
        aliases: ["코인베이스", "COIN 주가", "코인베이스 실시간", "코인 관련주", "코인베이스 주식"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: COIN",
        summary:
            "코인베이스는 미국 최대 암호화폐 거래소로, 상장 주식으로 거래되는 대표적인 크립토 연관 기업입니다.",
        angle:
            "비트코인 가격과 상관관계가 높아, 주말에 코인 시장이 크게 움직였을 때 월요일 개장 전 방향을 미리 보여주는 역할을 합니다.",
        watchPoints: [
            {
                title: "주말 코인 시장",
                body: "비트코인은 주말에도 거래되지만 미국 증시는 닫혀 있습니다. COIN 토큰은 그 주말 흐름을 반영하므로 월요일 개장 방향을 가늠하는 데 쓰입니다.",
            },
            {
                title: "거래대금과 수수료 수익",
                body: "실적이 암호화폐 거래대금에 직결됩니다. 시장이 뜨거워질 때 매출이 급증하는 구조라 비트코인 가격과 함께 봅니다.",
            },
            {
                title: "규제·상장 뉴스",
                body: "미국 규제 당국의 결정이나 신규 상품 승인 소식이 큰 변동을 만듭니다. 발표 시각은 미국 업무 시간대입니다.",
            },
        ],
    },
    {
        slug: "microstrategy",
        symbol: "MSTR",
        koreanName: "마이크로스트래티지(스트래티지)",
        englishName: "Strategy (MicroStrategy)",
        aliases: ["마이크로스트래티지", "MSTR", "스트래티지 주가", "비트코인 관련주", "MSTR 실시간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: MSTR",
        summary:
            "마이크로스트래티지는 비트코인을 대규모로 보유한 기업으로, 사실상 비트코인 레버리지 주식으로 거래됩니다.",
        angle:
            "비트코인이 주말에 급등락해도 미국 증시는 닫혀 있습니다. 이 토큰은 그 시간에도 거래되기 때문에 괴리가 가장 극적으로 드러나는 종목입니다.",
        watchPoints: [
            {
                title: "비트코인 가격",
                body: "보유 비트코인 가치가 기업 가치의 핵심이라 코인 가격과 거의 같은 방향으로 움직입니다. 주말 코인 급등락 때 괴리가 가장 크게 벌어집니다.",
            },
            {
                title: "추가 매수 공시",
                body: "자금 조달과 비트코인 추가 매수 발표가 반복되는 패턴입니다. 공시 시각은 미국 업무 시간대에 몰려 있습니다.",
            },
        ],
    },
    {
        slug: "palantir",
        symbol: "PLTR",
        koreanName: "팔란티어",
        englishName: "Palantir Technologies",
        aliases: ["팔란티어", "PLTR", "팔란티어 주가", "팔란티어 실시간", "팔란티어 야간"],
        market: "US",
        category: "주식",
        listing: "NASDAQ: PLTR",
        summary:
            "팔란티어는 정부·기업용 데이터 분석 플랫폼 기업으로, AI 수혜주로 분류돼 국내 투자자 사이에서도 인지도가 높습니다.",
        angle:
            "정부 계약 수주 공시가 불규칙한 시간에 나와 장외 변동이 잦은 편입니다.",
        watchPoints: [
            {
                title: "정부 계약 수주",
                body: "국방·정부 부문 계약 공시가 주가의 큰 변수입니다. 공시 시각이 불규칙해 장외 시간 변동이 잦습니다.",
            },
            {
                title: "높은 밸류에이션",
                body: "성장 기대가 이미 가격에 반영돼 있어 실적이 예상에 부합해도 하락하는 경우가 있습니다. 변동성이 큰 종목입니다.",
            },
        ],
    },

    // ── 비상장 ───────────────────────────────────────────────────
    {
        slug: "spacex",
        symbol: "SPCX",
        koreanName: "스페이스X",
        englishName: "SpaceX",
        aliases: ["스페이스X", "SPCX", "스페이스엑스 주가", "스페이스x 투자", "일론머스크 우주", "스페이스x 상장"],
        market: "US",
        category: "비상장",
        listing: "비상장 (미국 증시 미상장)",
        summary:
            "스페이스X는 아직 증시에 상장되지 않은 비상장 기업입니다. 바이낸스는 장외 가치평가를 기초로 한 무기한 선물(SPCXUSDT)을 제공합니다.",
        angle:
            "상장 주식이 아니기 때문에 참조할 정규장 종가 자체가 없습니다. 다른 종목과 달리 '괴리'라는 개념이 성립하지 않으며, 가격은 전적으로 장외 평가와 수급으로 결정됩니다. 그만큼 변동성과 괴리 위험이 큽니다.",
        watchPoints: [
            {
                title: "기준 가격이 없다",
                body: "비교할 정규장 종가가 존재하지 않습니다. 가격이 적정한지 검증할 공개 시세가 없다는 점이 다른 종목과 결정적으로 다릅니다.",
            },
            {
                title: "장외 가치평가와 스타링크",
                body: "직원 주식 매수 프로그램에서 매겨지는 기업가치, 스타링크 사업 성과, 상장 추진 보도가 가격을 움직이는 재료입니다.",
            },
        ],
        extraFaqs: [
            {
                question: "스페이스X 토큰을 사면 상장할 때 주식으로 바뀌나요?",
                answer:
                    "아닙니다. 무기한 선물 계약이라 실제 지분과 아무 연결이 없고, 상장 시 주식으로 전환되지도 않습니다. 상장 추진 소식으로 가격이 움직일 수는 있지만, 그것은 시장 참여자들의 기대가 반영된 것일 뿐입니다.",
            },
        ],
    },

    // ── 지수·섹터 ETF ────────────────────────────────────────────
    {
        slug: "soxl",
        symbol: "SOXL",
        koreanName: "반도체 3배 레버리지 ETF",
        englishName: "Direxion Daily Semiconductor Bull 3X (SOXL)",
        aliases: ["SOXL", "속슬", "반도체 3배", "소셜 ETF", "SOXL 실시간", "SOXL 야간", "속슬 지금"],
        market: "US",
        category: "ETF",
        listing: "NYSE Arca: SOXL",
        summary:
            "SOXL은 미국 반도체 지수(ICE Semiconductor)를 3배로 추종하는 레버리지 ETF입니다. 국내 투자자에게도 익숙한 고위험 상품입니다.",
        angle:
            "반도체 섹터 전체의 심리를 3배로 증폭해 보여줍니다. 다만 일간 수익률을 3배로 추종하는 구조라 횡보장에서는 원금이 녹는 점을 반드시 감안해야 합니다.",
        watchPoints: [
            {
                title: "반도체 섹터 심리를 3배로",
                body: "개별 종목보다 섹터 전체의 방향과 강도를 보기 좋습니다. 엔비디아 실적 발표 같은 이벤트에서 반응 폭이 가장 큽니다.",
            },
            {
                title: "횡보장에서 녹는 구조",
                body: "일간 수익률 3배 추종이라 오르내림이 반복되면 지수가 제자리여도 가치가 깎입니다. 국내 투자자 손실 사례가 많은 상품입니다.",
            },
        ],
    },
    {
        slug: "soxs",
        symbol: "SOXS",
        koreanName: "반도체 인버스 3배 ETF",
        englishName: "Direxion Daily Semiconductor Bear 3X (SOXS)",
        aliases: ["SOXS", "반도체 인버스", "반도체 하락 베팅", "SOXS 실시간"],
        market: "US",
        category: "ETF",
        listing: "NYSE Arca: SOXS",
        summary:
            "SOXS는 미국 반도체 지수를 -3배로 추종하는 인버스 레버리지 ETF입니다. 반도체 하락에 베팅하는 상품입니다.",
        angle:
            "SOXL과 정확히 반대로 움직입니다. 둘을 나란히 보면 반도체 섹터의 방향성 쏠림을 가늠할 수 있습니다.",
        watchPoints: [
            {
                title: "SOXL의 거울",
                body: "같은 지수를 -3배로 추종하므로 SOXL과 반대로 움직입니다. 두 종목의 거래대금을 비교하면 시장의 방향성 쏠림이 보입니다.",
            },
            {
                title: "장기 보유에 특히 불리",
                body: "인버스에 레버리지가 겹쳐 시간이 갈수록 가치가 깎이는 구조입니다. 단기 헤지 용도 외에는 위험이 큽니다.",
            },
        ],
    },
    {
        slug: "qqq",
        symbol: "QQQ",
        koreanName: "나스닥100 ETF",
        englishName: "Invesco QQQ Trust",
        aliases: ["QQQ", "나스닥100", "나스닥 ETF", "나스닥 실시간", "큐큐큐", "나스닥 지수 실시간", "나스닥 야간"],
        market: "US",
        category: "ETF",
        listing: "NASDAQ: QQQ",
        summary:
            "QQQ는 나스닥100 지수를 추종하는 세계에서 가장 거래가 활발한 ETF 중 하나입니다.",
        angle:
            "미국 기술주 시장 전체의 온도계입니다. 한국 새벽 시간에 QQQ 토큰이 급락하면 그날 아침 코스피 기술주도 약세로 출발하는 경우가 많습니다.",
        watchPoints: [
            {
                title: "미국 기술주 전체의 온도계",
                body: "개별 종목 뉴스에 흔들리지 않고 시장 전체의 방향을 보여줍니다. 한국 새벽에 크게 밀리면 그날 아침 코스피 기술주도 약세로 출발하는 경우가 많습니다.",
            },
            {
                title: "금리와 물가 지표",
                body: "CPI 발표, 연준 회의 결과가 나오는 시각은 한국 시간 밤 21:30~새벽 3시입니다. 지표 발표 순간의 반응은 정규장 종가에 남지 않습니다.",
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
