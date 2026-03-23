import type { Metadata } from "next";
import RankingClient from "./RankingClient";
import Script from "next/script";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "코인 시가총액 순위 2025 | 저평가 코인 · 급등 코인 · 고점낙폭 랭킹",
    description:
        "비트코인·이더리움 등 100개 코인 시가총액 순위를 실시간으로 확인하세요. 저평가 코인 순위, 역대 최고점(ATH) 대비 하락률, 24시간 급등락 코인을 한눈에 볼 수 있습니다.",
    keywords: [
        "코인 시가총액 순위",
        "저평가 코인 순위",
        "코인 랭킹",
        "급등 코인",
        "급락 코인",
        "코인 고점 대비 하락",
        "알트코인 순위",
        "비트코인 시가총액",
        "코인 거래대금 순위",
        "코인 ATH 낙폭",
        "암호화폐 순위",
        "코인 시세 순위",
    ],
    alternates: { canonical: "/ranking" },
    openGraph: {
        title: "코인 시가총액 순위 2025 | 저평가 코인 · 급등 코인 | TradeHub",
        description:
            "비트코인·이더리움 등 100개 코인 시가총액 순위. 저평가 코인, 고점 대비 낙폭, 급등락 코인을 한눈에.",
        url: `${SITE}/ranking`,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 시가총액 순위 2025 | 저평가 코인 · 급등 코인 | TradeHub",
        description:
            "비트코인·이더리움 등 100개 코인 시가총액 순위. 저평가 코인, 고점 대비 낙폭, 급등락 코인을 한눈에.",
    },
};

const LIST_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "코인 시가총액 순위 | TradeHub",
    description: "비트코인, 이더리움 등 암호화폐 시가총액 순위 및 저평가 코인 랭킹",
    url: `${SITE}/ranking`,
    inLanguage: "ko",
    isPartOf: { "@type": "WebSite", url: SITE, name: "TradeHub" },
    breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
            { "@type": "ListItem", position: 2, name: "코인 랭킹", item: `${SITE}/ranking` },
        ],
    },
};

export default function RankingPage() {
    return (
        <>
            <Script id="ld-ranking" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(LIST_JSONLD)}
            </Script>
            <main className="pt-12">
                <RankingClient />
            </main>
        </>
    );
}
