import type { Metadata } from "next";
import Script from "next/script";
import AltseasonClient from "./AltseasonClient";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "알트코인 시즌 지수 실시간 | 알트시즌인가 비트코인 시즌인가 | TradeHub",
    description:
        "알트코인 시즌 지수를 실시간으로 확인하세요. 상위 50개 알트코인의 30일 수익률을 BTC와 비교해 알트시즌 여부를 판단합니다.",
    keywords: [
        "알트코인 시즌 지수",
        "알트시즌 언제",
        "알트시즌 지수 실시간",
        "비트코인 시즌 알트코인 시즌",
        "알트시즌 확인",
        "알트코인 시즌 뜻",
        "알트시즌 지표",
        "알트코인 불장",
        "altcoin season index",
        "알트코인 시즌 2025",
    ],
    alternates: { canonical: "/altseason" },
    openGraph: {
        title: "알트코인 시즌 지수 실시간 | TradeHub",
        description: "알트코인 시즌 지수 실시간 확인. 알트시즌인가 비트코인 시즌인가 한눈에.",
        url: `${SITE}/altseason`,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "알트코인 시즌 지수 실시간 | TradeHub",
        description: "알트코인 시즌 지수 실시간 확인. 알트시즌인가 비트코인 시즌인가 한눈에.",
    },
};

const JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "알트코인 시즌 지수 | TradeHub",
    description: "알트코인 시즌 지수 실시간. 상위 50개 알트코인의 BTC 대비 30일 수익률 분석.",
    url: `${SITE}/altseason`,
    inLanguage: "ko",
    isPartOf: { "@type": "WebSite", url: SITE, name: "TradeHub" },
    breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
            { "@type": "ListItem", position: 2, name: "알트코인 시즌 지수", item: `${SITE}/altseason` },
        ],
    },
};

export default function AltseasonPage() {
    return (
        <>
            <Script id="ld-altseason" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(JSONLD)}
            </Script>
            <main className="pt-12">
                <AltseasonClient />
            </main>
        </>
    );
}
