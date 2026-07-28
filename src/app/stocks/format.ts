// 서버 페이지와 클라이언트 컴포넌트가 같은 숫자 포맷을 쓰도록 모아둔 순수 함수들.
// (fx.ts는 fetch를 포함하므로 포맷터만 필요한 곳에서는 이 모듈을 쓴다)

export function formatKrw(n: number): string {
    return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function fmtUsd(n: number | null, digits = 2): string {
    if (n === null || !Number.isFinite(n)) return "—";
    return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
}

/** 원화 우선. 환율을 못 가져왔으면 달러로 폴백. */
export function fmtPrice(usd: number | null, usdKrw: number | null): string {
    if (usd === null || !Number.isFinite(usd)) return "—";
    return usdKrw === null ? fmtUsd(usd) : formatKrw(usd * usdKrw);
}

/** 큰 금액을 조/억/만원으로 줄여 쓴다. 환율이 없으면 달러 축약. */
export function fmtCompactKrw(usd: number | null, usdKrw: number | null): string {
    if (usd === null || !Number.isFinite(usd)) return "—";
    if (usdKrw === null) {
        if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
        if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
        return `$${usd.toFixed(0)}`;
    }
    const krw = usd * usdKrw;
    if (krw >= 1e12) return `${(krw / 1e12).toFixed(1)}조원`;
    if (krw >= 1e8) return `${Math.round(krw / 1e8).toLocaleString("ko-KR")}억원`;
    if (krw >= 1e4) return `${Math.round(krw / 1e4).toLocaleString("ko-KR")}만원`;
    return formatKrw(krw);
}
