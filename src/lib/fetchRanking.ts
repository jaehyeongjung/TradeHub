import type { RankingCoin } from "@/app/api/ranking/route";

const CG_URL =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h";

/** 서버 컴포넌트(SSR/generateMetadata)에서 직접 호출하는 함수 */
export async function fetchRankingData(): Promise<RankingCoin[] | null> {
    try {
        const r = await fetch(CG_URL, {
            next: { revalidate: 60 },
            headers: { Accept: "application/json" },
        });
        if (!r.ok) return null;
        return r.json();
    } catch {
        return null;
    }
}
