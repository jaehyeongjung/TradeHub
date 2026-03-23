import { NextResponse } from "next/server";

export type RankingCoin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    price_change_percentage_24h: number;
    ath: number;
    ath_change_percentage: number;
    sparkline_in_7d: { price: number[] };
};

export async function GET() {
    const url =
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h";

    try {
        const r = await fetch(url, {
            next: { revalidate: 60 },
            headers: { Accept: "application/json" },
        });

        if (!r.ok) {
            return NextResponse.json({ error: "upstream error" }, { status: 502 });
        }

        const data = (await r.json()) as RankingCoin[];
        return NextResponse.json(data, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
        });
    } catch {
        return NextResponse.json({ error: "fetch failed" }, { status: 500 });
    }
}
