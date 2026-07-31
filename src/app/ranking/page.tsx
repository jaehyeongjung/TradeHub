import type { Metadata } from "next";
import Script from "next/script";
import RankingClient from "./RankingClient";
import { fetchRankingData } from "@/shared/lib/fetchRanking";
import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";
import { PageExplainer } from "@/widgets/shared-modals/PageExplainer";

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
            <PageExplainer
                heading="시가총액 순위, 어떻게 보나요?"
                lead="코인을 시가총액 순으로 줄 세운 표입니다. 가격이 비싼 순서가 아니라 '전체 규모'가 큰 순서라, 코인 하나의 가격만 보고 비싸다·싸다를 판단할 수 없는 이유가 여기 있습니다."
                items={[
                    {
                        term: "시가총액",
                        body: "현재가 × 유통량입니다. 1,000원짜리 코인이 100억 개 돌아다니면, 1억 원짜리 코인이 100개 있는 것보다 시장에서 훨씬 큽니다. 가격표가 아니라 규모를 보는 숫자입니다.",
                    },
                    {
                        term: "거래량과 시가총액의 관계",
                        body: "시가총액에 비해 거래량이 유난히 크면 지금 그 코인에 관심이 몰려 있다는 뜻입니다. 반대로 시가총액은 큰데 거래량이 적으면 사고팔기가 어려워 원하는 가격에 정리하기 힘들 수 있습니다.",
                    },
                    {
                        term: "비트코인 도미넌스",
                        body: "전체 암호화폐 시가총액에서 비트코인이 차지하는 비중입니다. 이 값이 오르면 자금이 비트코인으로 모이는 국면, 내려가면 알트코인으로 퍼지는 국면으로 해석하는 경우가 많습니다.",
                    },
                    {
                        term: "유통량과 총발행량",
                        body: "지금 시장에 풀린 물량과 앞으로 풀릴 전체 물량은 다릅니다. 아직 잠겨 있는 물량이 많으면 나중에 풀리면서 가격에 부담이 될 수 있어, 순위만 보고 판단하기 전에 함께 확인할 항목입니다.",
                    },
                ]}
                closing="순위가 높다고 안전한 자산이라는 뜻은 아닙니다. 여기 표시되는 수치는 정보 제공이 목적이며 투자 권유가 아닙니다."
            />
            <SeoFooter />
        </>
    );
}
