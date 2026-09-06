import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { guides } from "@/shared/lib/guides";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
  title: "코인 투자 가이드 — 선물거래·지표·용어 쉽게 배우기",
  description:
    "코인 선물거래 방법, 레버리지 뜻, 청산이란, 김치프리미엄 계산, 공포탐욕지수 활용까지. 암호화폐 투자 초보도 이해하는 핵심 개념 가이드.",
  keywords: [
    "코인 선물거래 방법", "레버리지 뜻 코인", "청산이란 코인",
    "김치프리미엄 뜻", "공포탐욕지수 활용", "코인 고래 거래란",
    "코인 트리맵이란", "알트코인 시즌 뜻", "코인 투자 용어 정리",
    "코인 초보 가이드", "암호화폐 투자 공부", "선물거래 용어",
    "롱 숏 뜻", "격리마진 뜻", "모의투자란",
  ],
  alternates: {
    canonical: "https://www.tradehub.kr/guide",
  },
  openGraph: {
    title: "코인 투자 가이드 — 선물거래·지표·용어 쉽게 배우기 | TradeHub",
    description:
      "코인 선물거래 방법, 레버리지 뜻, 청산이란, 김치프리미엄 계산, 공포탐욕지수 활용까지. 암호화폐 투자 초보도 이해하는 핵심 개념 가이드.",
    url: `${SITE}/guide`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "코인 투자 가이드 — 선물거래·지표·용어 쉽게 배우기 | TradeHub",
    description:
      "코인 선물거래 방법, 레버리지, 청산, 김치프리미엄, 공포탐욕지수 등 핵심 개념을 쉽게 설명합니다.",
  },
};

const categoryOrder = ["시장 지표", "선물 거래", "투자 도구"] as const;

const GUIDE_LIST_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "코인 투자 가이드 목록",
  description: "암호화폐 선물거래, 시장 지표, 투자 도구에 관한 핵심 개념 가이드",
  numberOfItems: guides.length,
  itemListElement: guides.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.title,
    description: g.description,
    url: `${SITE}/guide/${g.slug}`,
  })),
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
    { "@type": "ListItem", position: 2, name: "투자 가이드", item: `${SITE}/guide` },
  ],
};

export default function GuidesIndex() {
  const grouped = categoryOrder
    .map((cat) => ({ category: cat, items: guides.filter((g) => g.category === cat) }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <Script id="ld-guide-list" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(GUIDE_LIST_JSONLD)}
      </Script>
      <Script id="ld-guide-bc" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(BREADCRUMB_JSONLD)}
      </Script>

      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 xl:pt-20">
        {/* globals.css가 좁은 화면에서 <header>를 싸잡아 감춘다 — div로 둔다 */}
        <div>
          <h1 className="text-title2 font-extrabold tracking-tight text-text-primary sm:text-title1">
            투자 가이드
          </h1>
          <p className="mt-3 text-body text-text-secondary">
            코인 선물거래와 시장 지표를 처음 보는 사람도 이해할 수 있게 정리했습니다.
            화면에 뜨는 숫자가 무슨 뜻인지부터, 그 숫자를 보고 무엇을 판단할 수 있는지까지.
          </p>
          <p className="mt-3 text-footnote text-text-tertiary">
            전체 {guides.length}편
          </p>
        </div>

        {grouped.map(({ category, items }) => (
          <section key={category} className="mt-12">
            {/* 카테고리 제목을 카드 위에 그냥 얹으면 목록이 길어질수록
                어디서 갈리는지 안 보인다. 줄을 하나 그어 구간을 만든다. */}
            <h2 className="flex items-center gap-3 text-caption font-bold tracking-wide text-text-tertiary">
              {category}
              <span className="h-px flex-1 bg-border-subtle" aria-hidden="true" />
              <span className="tabular-nums font-normal">{items.length}</span>
            </h2>

            <ul className="mt-4 space-y-2.5">
              {items.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guide/${g.slug}`}
                    className="group flex items-start gap-4 rounded-card border border-border-subtle bg-surface-card px-4 py-4 transition-colors hover:border-border-default hover:bg-surface-hover sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-headline font-bold text-text-primary">{g.title}</h3>
                      <p className="mt-1.5 text-label leading-[1.7] text-text-secondary">
                        {g.description}
                      </p>
                      <span className="mt-2.5 inline-block text-footnote text-text-tertiary">
                        {g.readingTime}분 읽기
                      </span>
                    </div>
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-[var(--color-accent-text)]"
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
