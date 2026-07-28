// USD/KRW 환율. 주식 토큰 가격을 원화로 환산해 보여주는 데 쓴다.
// kimchi 라우트와 같은 소스를 쓰되, 여기선 페이지 ISR에 맞춰 캐시한다.

const UA = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" };

function isNum(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v) && v > 0;
}

async function withTimeout(url: string, ms: number, revalidate: number) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { headers: UA, next: { revalidate }, signal: ctrl.signal })
        .finally(() => clearTimeout(id));
}

/**
 * 실패 시 null. 환율을 못 가져오면 원화 표기를 숨기고 달러만 보여준다
 * — 틀린 환율로 계산한 원화를 노출하는 것보다 낫다.
 */
export async function getUsdKrw(revalidate = 600): Promise<number | null> {
    const sources: { url: string; pick: (j: unknown) => unknown }[] = [
        {
            url: "https://api.frankfurter.app/latest?from=USD&to=KRW",
            pick: (j) => (j as { rates?: { KRW?: number } })?.rates?.KRW,
        },
        {
            url: "https://api.exchangerate-api.com/v4/latest/USD",
            pick: (j) => (j as { rates?: { KRW?: number } })?.rates?.KRW,
        },
        {
            url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
            pick: (j) => (j as { usd?: { krw?: number } })?.usd?.krw,
        },
    ];

    for (const { url, pick } of sources) {
        try {
            const r = await withTimeout(url, 3500, revalidate);
            if (!r.ok) continue;
            const value = pick(await r.json());
            if (isNum(value)) return value;
        } catch {
            // 다음 소스로 폴백
        }
    }
    return null;
}

/** 1,234,567원 형태 */
export function formatKrw(n: number): string {
    return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
