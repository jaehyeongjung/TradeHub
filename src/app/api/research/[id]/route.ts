import { NextResponse } from "next/server";

export type CoinDetail = {
    id: string;
    name: string;
    symbol: string;
    description: string;
    genesis_date: string | null;
    github_url: string | null;
    commit_count_4w: number;
    pr_contributors: number;
    stars: number;
    categories: string[];
};

type CoinGeckoDetail = {
    id: string;
    name: string;
    symbol: string;
    description: { en: string; ko?: string };
    genesis_date: string | null;
    links: {
        repos_url: { github: string[] };
    };
    developer_data: {
        commit_count_4_weeks: number;
        pull_request_contributors: number;
        subscribers: number;
        stars: number;
    };
    categories: string[];
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/${id}?localization=true&tickers=false&market_data=false&community_data=false&developer_data=true&sparkline=false`,
            { next: { revalidate: 3600 }, headers: { Accept: "application/json" } },
        );

        if (!res.ok) {
            return NextResponse.json({ error: "not found" }, { status: 404 });
        }

        const data = (await res.json()) as CoinGeckoDetail;

        const detail: CoinDetail = {
            id: data.id,
            name: data.name,
            symbol: data.symbol,
            description: data.description?.ko || data.description?.en || "",
            genesis_date: data.genesis_date,
            github_url: data.links?.repos_url?.github?.[0] ?? null,
            commit_count_4w: data.developer_data?.commit_count_4_weeks ?? 0,
            pr_contributors: data.developer_data?.pull_request_contributors ?? 0,
            stars: data.developer_data?.stars ?? 0,
            categories: data.categories ?? [],
        };

        return NextResponse.json(detail, {
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
        });
    } catch {
        return NextResponse.json({ error: "fetch failed" }, { status: 500 });
    }
}
