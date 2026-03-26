/**
 * 공유 포맷 유틸리티
 * USD 금액, 가격, 상대 시간 등 여러 컴포넌트에서 공통으로 쓰는 포맷 함수 모음
 */

/** $500K / $1.2M 형태 — 고래 거래·청산 금액 표시용 */
export function fmtUsdCompact(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
}

/** $0.000123 / $1.23 / $12,345 형태 — 코인 개별 가격 표시용 */
export function fmtPrice(n: number): string {
    if (n >= 10_000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (n >= 1)      return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 0.01)   return `$${n.toFixed(4)}`;
    return `$${n.toFixed(6)}`;
}

/** $1.2T / $500B / $3.4M 형태 — 시가총액·거래대금 표시용 */
export function fmtLarge(n: number): string {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
}

/** "방금" / "3분" / "2시간" — Unix ms 타임스탬프 기준 상대 시간 */
export function fmtRelativeTime(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "방금";
    const m = Math.floor(s / 60);
    return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간`;
}
