import type { Metadata } from "next";
import RankingClient from "@/app/ranking/RankingClient";
import { fetchRankingData } from "@/shared/lib/fetchRanking";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "Crypto Rankings — Real-time Market Cap, 24h Gainers & Losers | TradeHub",
    description:
        "Live rankings of 100 cryptocurrencies by market cap. Track BTC, ETH prices, 24h change, ATH drawdown, and find undervalued coins at a glance.",
    keywords: [
        "crypto market cap rankings", "bitcoin price live",
        "ethereum price live", "top crypto by market cap",
        "crypto 24h gainers losers", "altcoin performance ranking",
        "ath drawdown crypto", "undervalued crypto finder",
        "crypto volume ranking", "real time coin rankings",
    ],
    alternates: {
        canonical: "https://www.tradehub.kr/en/ranking",
        languages: { "ko": `${SITE}/ranking`, "en": `${SITE}/en/ranking` },
    },
    openGraph: {
        title: "Crypto Rankings — Real-time Market Cap, 24h Gainers & Losers | TradeHub",
        description: "Live market cap rankings for 100 coins. BTC, ETH prices, 24h change, ATH drawdown — free.",
        url: `${SITE}/en/ranking`,
        type: "website",
        locale: "en_US",
        siteName: "TradeHub",
    },
    twitter: {
        card: "summary_large_image",
        title: "Crypto Rankings — Real-time Market Cap | TradeHub",
        description: "Live market cap rankings for 100 coins. BTC, ETH prices, 24h change, ATH drawdown — free.",
    },
};

export default async function Page() {
    const coins = await fetchRankingData();
    return (
        <main className="pt-12">
            <RankingClient initialData={coins ?? []} />
        </main>
    );
}
