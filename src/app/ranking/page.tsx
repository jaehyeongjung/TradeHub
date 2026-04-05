import type { Metadata } from "next";
import Script from "next/script";
import RankingClient from "./RankingClient";
import { fetchRankingData } from "@/shared/lib/fetchRanking";
import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";

const SITE = "https://www.tradehub.kr";

export async function generateMetadata(): Promise<Metadata> {
    const coins = await fetchRankingData();
    const btc   = coins?.find((c) => c.id === "bitcoin");
    const eth   = coins?.find((c) => c.id === "ethereum");

    const btcStr = btc
        ? `BTC $${Math.round(btc.current_price).toLocaleString("en-US")}`
        : "코인 시세";
    const ethStr = eth
        ? `ETH $${Math.round(eth.current_price).toLocaleString("en-US")}`
        : "";

    const title =
        `코인 랭킹 — ${btcStr}${ethStr ? ` · ${ethStr}` : ""} | 실시간 시가총액 순위`;
    const desc =
        `비트코인·이더리움 등 100개 코인 시가총액 순위를 실시간으로 확인하세요. ` +
        (btc ? `현재 BTC ${btc.price_change_percentage_24h >= 0 ? "+" : ""}${btc.price_change_percentage_24h?.toFixed(2)}% · ` : "") +
        `저평가 코인, 역대 고점(ATH) 대비 낙폭, 24시간 급등락 코인을 한눈에.`;

    return {
        title,
        description: desc,
        keywords: [
            "코인 랭킹", "코인 시가총액 순위", "암호화폐 순위 실시간",
            "고점낙폭 코인 순위", "코인 역대 고점 대비 낙폭", "저평가 코인 찾기",
            "코인 급등 순위 오늘", "코인 급락 순위 오늘", "코인 거래대금 순위 실시간",
            "BTC 대비 알트코인 수익률", "알트코인 30일 수익률 순위",
            "비트코인 현재 가격", "이더리움 현재 가격",
            "코인 시세 실시간", "코인 ATH 얼마나 빠졌나", "코인 불장 수혜주",
        ],
        alternates: {
            canonical: "https://www.tradehub.kr/ranking",
            languages: {
                "ko": "https://www.tradehub.kr/ranking",
                "en": "https://www.tradehub.kr/en/ranking",
            },
        },
        openGraph: {
            title,
            description: desc,
            url: `${SITE}/ranking`,
            type: "website",
        },
        twitter: { card: "summary_large_image", title, description: desc },
    };
}

export default async function RankingPage() {
    const coins = await fetchRankingData();

const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "코인 시가총액 순위 TOP 100",
        description: "실시간 암호화폐 시가총액 기준 순위",
        numberOfItems: coins?.length ?? 100,
        itemListElement: coins?.slice(0, 10).map((coin, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${coin.name} (${coin.symbol.toUpperCase()})`,
            description:
                `시가총액 ${i + 1}위 | 현재가 $${Math.round(coin.current_price).toLocaleString("en-US")} | ` +
                `24h ${coin.price_change_percentage_24h >= 0 ? "+" : ""}${coin.price_change_percentage_24h?.toFixed(2)}%`,
        })) ?? [],
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
            { "@type": "ListItem", position: 2, name: "코인 랭킹", item: `${SITE}/ranking` },
        ],
    };

    const webPageJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "코인 시가총액 순위 | TradeHub",
        description: "비트코인, 이더리움 등 암호화폐 시가총액 순위 및 저평가 코인 랭킹",
        url: `${SITE}/ranking`,
        inLanguage: "ko",
        isPartOf: { "@type": "WebSite", url: SITE, name: "TradeHub" },
    };

    return (
        <>
            <Script id="ld-ranking-list" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(itemListJsonLd)}
            </Script>
            <Script id="ld-ranking-bc" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(breadcrumbJsonLd)}
            </Script>
            <Script id="ld-ranking-page" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(webPageJsonLd)}
            </Script>
            <main className="pt-12">
                <RankingClient initialData={coins ?? []} />
            </main>
            <SeoFooter />
        </>
    );
}
