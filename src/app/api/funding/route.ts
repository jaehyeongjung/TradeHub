import { NextResponse } from "next/server";

type PremiumItem = {
    symbol: string;
    markPrice: string;
    lastFundingRate: string;
    nextFundingTime: number;
};

export type FundingCoin = {
    symbol: string;
    base: string;
    markPrice: number;
    fundingRate: number;       // raw decimal  e.g. 0.0003
    fundingRatePct: number;    // percentage   e.g. 0.03
    annualizedPct: number;     // rate * 3 * 365 * 100
    nextFundingTime: number;   // unix ms
};

export async function GET() {
    const r = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex", {
        next: { revalidate: 30 },
    });
    if (!r.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });

    const raw = (await r.json()) as PremiumItem[];

    const coins: FundingCoin[] = raw
        .filter(
            (item) =>
                item.symbol.endsWith("USDT") &&
                !/\d{6}/.test(item.symbol), // 날짜 만기 계약 제외
        )
        .map((item) => {
            const rate = parseFloat(item.lastFundingRate);
            return {
                symbol: item.symbol,
                base: item.symbol.replace("USDT", "").toLowerCase(),
                markPrice: parseFloat(item.markPrice),
                fundingRate: rate,
                fundingRatePct: rate * 100,
                annualizedPct: rate * 3 * 365 * 100,
                nextFundingTime: item.nextFundingTime,
            };
        })
        .filter((c) => !isNaN(c.fundingRate));

    return NextResponse.json(coins, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
}
