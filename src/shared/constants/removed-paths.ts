// ceae70c에서 개별 페이지를 없앤 해외 종목. 구글 색인에 7월 크롤 기록 그대로 남아 있어
// middleware가 404 대신 410을 주고, sitemap-removed.xml에도 올린다.
export const REMOVED_STOCK_SLUGS = [
    "koru", "ewy", "sandisk", "micron", "nvidia", "intel", "amd", "marvell", "tesla",
    "apple", "microsoft", "alphabet", "amazon", "meta", "coinbase", "microstrategy",
    "palantir", "spacex", "soxl", "soxs", "qqq",
    // 2026-11-15 한국 종목도 삼성전자·SK하이닉스 두 개만 남기고 정리
    "hyundai", "samsung-electro-mechanics", "hanmi-semiconductor", "lg-electronics", "naver", "kodex-200",
] as const;
