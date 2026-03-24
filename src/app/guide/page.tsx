import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { guides } from "@/lib/guides";

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
  alternates: { canonical: "/guide" },
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
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: guides.filter((g) => g.category === cat),
  }));

  return (
    <>
      <Script id="ld-guide-list" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(GUIDE_LIST_JSONLD)}
      </Script>
      <Script id="ld-guide-bc" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(BREADCRUMB_JSONLD)}
      </Script>
    <main className="mx-auto max-w-3xl px-5 py-16 text-white">
      <h1 className="text-3xl font-extrabold tracking-tight">투자 가이드</h1>
      <p className="mt-3 text-zinc-400">
        코인 투자에 필요한 핵심 개념과 전략을 쉽게 설명합니다.
      </p>

      {grouped.map(({ category, items }) => (
        <section key={category} className="mt-12">
          <h2 className="text-lg font-bold text-[#02C076]">{category}</h2>
          <ul className="mt-4 space-y-3">
            {items.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guide/${g.slug}`}
                  className="group flex items-start gap-4 rounded-xl bg-zinc-900/60 p-5 ring-1 ring-zinc-800 transition-colors hover:ring-[#02C076]/50"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white group-hover:text-[#02C076] transition-colors">
                      {g.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                      {g.description}
                    </p>
                    <span className="mt-2 inline-block text-xs text-zinc-500">
                      {g.readingTime}분 읽기
                    </span>
                  </div>
                  <span className="mt-1 text-zinc-600 group-hover:text-[#02C076] transition-colors">
                    →
                  </span>
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
