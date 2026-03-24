import type { Metadata } from "next";
import Script from "next/script";
import AltseasonClient from "./AltseasonClient";
import { fetchAltseasonData } from "@/lib/fetchAltseason";

const SITE = "https://www.tradehub.kr";

const ZONE_KO: Record<string, string> = {
    altcoin: "알트코인 시즌",
    bitcoin: "비트코인 시즌",
    neutral: "중립 구간",
};

/* ─── 동적 메타데이터 ─── */
export async function generateMetadata(): Promise<Metadata> {
    const data = await fetchAltseasonData();
    const score    = data?.score ?? 0;
    const zoneKo   = ZONE_KO[data?.zone ?? "neutral"];
    const outCount = data?.outperformedCount ?? 0;
    const total    = data?.total ?? 49;

    const title = `알트코인 시즌 지수 ${score}점 — 지금은 ${zoneKo} | TradeHub`;
    const desc  =
        `현재 알트코인 시즌 지수 ${score}점. ` +
        `상위 ${total}개 알트코인 중 ${outCount}개가 BTC 30일 수익률을 초과하고 있습니다. ` +
        `75점 이상이면 알트시즌, 25점 이하면 비트코인 시즌.`;

    return {
        title,
        description: desc,
        keywords: [
            "알트코인 시즌 지수", "알트시즌 지수 실시간", "알트시즌 언제 시작",
            "알트코인 시즌 계산법", "BTC 대비 알트코인 성과", "알트시즌 지수 75점 뜻",
            "비트코인 시즌 알트코인 시즌 차이", "알트시즌 확인하는 법",
            "알트코인 불장 신호", "알트시즌 언제 오나", "알트코인 시즌 2025",
            "코인 시즌 지수 확인", "알트시즌 조건", "altcoin season index 한국",
            "알트코인 30일 수익률 BTC 초과",
        ],
        alternates: { canonical: "/altseason" },
        openGraph: { title, description: desc, url: `${SITE}/altseason`, type: "website" },
        twitter: { card: "summary_large_image", title, description: desc },
    };
}

/* ─── SSR 페이지 ─── */
export default async function AltseasonPage() {
    const data = await fetchAltseasonData();
    const score  = data?.score ?? 0;
    const zoneKo = ZONE_KO[data?.zone ?? "neutral"];

    /* FAQ JSON-LD — Featured Snippet + 음성 검색 노림 */
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "알트코인 시즌이란 무엇인가요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "상위 50개 알트코인 중 75% 이상이 비트코인(BTC)의 30일 수익률을 초과할 때를 알트코인 시즌이라 합니다. 반대로 25% 이하면 비트코인 시즌입니다. Blockchain Center 방법론을 참고해 계산합니다.",
                },
            },
            {
                "@type": "Question",
                name: `지금 알트시즌인가요?`,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: `현재 알트코인 시즌 지수는 ${score}점으로 ${zoneKo}입니다. 지수는 상위 50개 알트코인의 BTC 대비 30일 수익률을 기준으로 30분마다 업데이트됩니다.`,
                },
            },
            {
                "@type": "Question",
                name: "알트코인 시즌 지수는 어떻게 계산하나요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "시가총액 상위 50개 알트코인(스테이블코인·래핑 토큰 제외)의 30일 수익률을 BTC와 비교합니다. BTC를 초과한 코인의 비율(%)이 지수가 됩니다. 75% 이상이면 알트코인 시즌, 25% 이하면 비트코인 시즌, 그 사이면 중립 구간입니다.",
                },
            },
            {
                "@type": "Question",
                name: "알트코인 시즌에 어떤 코인을 사야 하나요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "알트코인 시즌 지수가 75점 이상일 때는 BTC 대비 알트코인이 강세를 보이는 경향이 있습니다. 단, 투자는 항상 개인의 판단과 리스크 관리가 중요하며 본 지수는 참고용입니다.",
                },
            },
        ],
    };

    /* ItemList JSON-LD — BTC 초과 상위 코인 */
    const topAlts = data?.alts.filter((c) => c.outperformedBtc).slice(0, 10) ?? [];
    const altListJsonLd = topAlts.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "BTC 30일 수익률 초과 알트코인 TOP 10",
        numberOfItems: topAlts.length,
        itemListElement: topAlts.map((coin, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${coin.name} (${coin.symbol.toUpperCase()})`,
            description: `30일 수익률 ${coin.change30d >= 0 ? "+" : ""}${coin.change30d.toFixed(1)}% — BTC 초과`,
        })),
    } : null;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
            { "@type": "ListItem", position: 2, name: "알트코인 시즌 지수", item: `${SITE}/altseason` },
        ],
    };

    return (
        <>
            <Script id="ld-altseason-faq" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(faqJsonLd)}
            </Script>
            {altListJsonLd && (
                <Script id="ld-altseason-list" type="application/ld+json" strategy="afterInteractive">
                    {JSON.stringify(altListJsonLd)}
                </Script>
            )}
            <Script id="ld-altseason-bc" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(breadcrumbJsonLd)}
            </Script>
            <main className="pt-12">
                <AltseasonClient initialData={data ?? undefined} />
            </main>
        </>
    );
}
