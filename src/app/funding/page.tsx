import type { Metadata } from "next";
import Script from "next/script";
import FundingClient from "./FundingClient";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "코인 펀딩비 순위 실시간 | 바이낸스 선물 펀딩비 | TradeHub",
    description:
        "바이낸스 선물 거래소 실시간 펀딩비 순위. 극단적 펀딩비 코인, 롱 과열·숏 과열 신호를 한눈에 확인하세요. 8시간마다 업데이트되는 무기한 계약 펀딩비.",
    keywords: [
        "코인 펀딩비 순위",
        "바이낸스 펀딩비 실시간",
        "펀딩비 높은 코인",
        "마이너스 펀딩비 코인",
        "코인 펀딩비 의미",
        "선물 펀딩비",
        "암호화폐 펀딩비",
        "비트코인 펀딩비",
        "롱 과열 코인",
        "숏 과열 코인",
        "펀딩비 매매",
    ],
    alternates: { canonical: "/funding" },
    openGraph: {
        title: "코인 펀딩비 순위 실시간 | 바이낸스 선물 | TradeHub",
        description: "바이낸스 선물 실시간 펀딩비 순위. 극단 펀딩비, 롱/숏 과열 코인을 한눈에.",
        url: `${SITE}/funding`,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 펀딩비 순위 실시간 | TradeHub",
        description: "바이낸스 선물 실시간 펀딩비 순위. 극단 펀딩비, 롱/숏 과열 코인을 한눈에.",
    },
};

const JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "코인 펀딩비 순위 | TradeHub",
    description: "바이낸스 선물 거래소 실시간 펀딩비 순위 및 극단 펀딩비 코인 목록",
    url: `${SITE}/funding`,
    inLanguage: "ko",
    isPartOf: { "@type": "WebSite", url: SITE, name: "TradeHub" },
    breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
            { "@type": "ListItem", position: 2, name: "코인 펀딩비 순위", item: `${SITE}/funding` },
        ],
    },
};

export default function FundingPage() {
    return (
        <>
            <Script id="ld-funding" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(JSONLD)}
            </Script>
            <main className="pt-12">
                <FundingClient />
            </main>
        </>
    );
}
