import { NextResponse } from "next/server";

export type ScoreBreakdown = {
    supply: number;    // 0-30
    liquidity: number; // 0-25
    usage: number;     // 0-30
    momentum: number;  // 0-15
};

export type ResearchCoin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    tvl: number | null;
    tvl_change_7d: number | null;
    score: number;
    score_breakdown: ScoreBreakdown;
};

type CoinMarket = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
};

type LlamaProtocol = {
    gecko_id: string | null;
    tvl: number;
    change_7d: number | null;
};

function calcScore(
    coin: CoinMarket,
    tvl: number | null,
): { breakdown: ScoreBreakdown; total: number } {
    // 공급 건전성 (0-30): 유통 비율 높을수록 미래 희석 위험 낮음
    let supply = 0;
    if (coin.max_supply && coin.max_supply > 0 && coin.circulating_supply > 0) {
        supply = Math.round((coin.circulating_supply / coin.max_supply) * 30);
    } else if (!coin.max_supply) {
        supply = 15; // 무제한 발행 = 중간
    } else {
        supply = 10;
    }

    // 유동성 (0-25): 거래량/시총 비율
    let liquidity = 0;
    if (coin.market_cap > 0) {
        const ratio = coin.total_volume / coin.market_cap;
        liquidity = Math.round(Math.min(25, (ratio / 0.1) * 25));
    }

    // 실사용 (0-30): TVL/시총 (DeFi), 없으면 중립
    let usage = 0;
    if (tvl && tvl > 0 && coin.market_cap > 0) {
        const ratio = tvl / coin.market_cap;
        usage = Math.round(Math.min(30, (ratio / 0.3) * 30));
    } else {
        usage = 12;
    }

    // 모멘텀 (0-15): 7일 가격 추세
    let momentum = 0;
    const change7d = coin.price_change_percentage_7d_in_currency ?? 0;
    if (change7d > 0) {
        momentum = Math.round(Math.min(15, (change7d / 30) * 15));
    } else {
        momentum = Math.max(0, Math.round(7 + (change7d / 30) * 7));
    }

    const total = Math.min(100, supply + liquidity + usage + momentum);
    return { breakdown: { supply, liquidity, usage, momentum }, total };
}

export async function GET() {
    try {
        const [cgRes, llamaRes] = await Promise.all([
            fetch(
                "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=7d",
                { next: { revalidate: 300 }, headers: { Accept: "application/json" } },
            ),
            fetch("https://api.llama.fi/protocols", {
                next: { revalidate: 3600 },
                headers: { Accept: "application/json" },
            }),
        ]);

        if (!cgRes.ok) {
            return NextResponse.json({ error: "CoinGecko error" }, { status: 502 });
        }

        const coins = (await cgRes.json()) as CoinMarket[];

        // DefiLlama gecko_id → tvl 매핑
        const tvlMap = new Map<string, { tvl: number; change_7d: number | null }>();
        if (llamaRes.ok) {
            const protocols = (await llamaRes.json()) as LlamaProtocol[];
            for (const p of protocols) {
                if (p.gecko_id) {
                    tvlMap.set(p.gecko_id, { tvl: p.tvl, change_7d: p.change_7d });
                }
            }
        }

        const result: ResearchCoin[] = coins.map((coin) => {
            const llamaData = tvlMap.get(coin.id) ?? null;
            const tvl = llamaData?.tvl ?? null;
            const { breakdown, total } = calcScore(coin, tvl);

            return {
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                image: coin.image,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                total_volume: coin.total_volume,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
                circulating_supply: coin.circulating_supply,
                total_supply: coin.total_supply,
                max_supply: coin.max_supply,
                tvl,
                tvl_change_7d: llamaData?.change_7d ?? null,
                score: total,
                score_breakdown: breakdown,
            };
        });

        return NextResponse.json(result, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
    } catch {
        return NextResponse.json({ error: "fetch failed" }, { status: 500 });
    }
}
