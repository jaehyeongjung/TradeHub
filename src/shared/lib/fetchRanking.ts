import type { RankingCoin } from "@/app/api/ranking/route";
import { cgHeaders } from "@/shared/lib/coingecko";

const CG_URL =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h";

export async function fetchRankingData(): Promise<RankingCoin[] | null> {
    try {
        const r = await fetch(CG_URL, {
            next: { revalidate: 300 }, // Demo 키 월 1만 회 한도 안에 들어오도록 5분
            headers: cgHeaders(),
        });
        if (!r.ok) return null;
        return r.json();
    } catch {
        return null;
    }
}
