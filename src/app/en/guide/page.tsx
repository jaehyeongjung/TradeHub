import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { guidesEn } from "@/shared/lib/guides-en";
import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
  title: "Crypto Investment Guide — Futures, Indicators & Key Terms | TradeHub",
  description:
    "Learn crypto futures trading, leverage meaning, liquidation explained, Kimchi Premium, Fear & Greed Index, and more. Clear guides for beginners and intermediate traders.",
  keywords: [
    "crypto futures trading guide", "leverage trading crypto", "what is liquidation crypto",
    "kimchi premium explained", "fear greed index crypto", "crypto whale trades",
    "crypto treemap explained", "altcoin season meaning", "crypto trading terms",
    "bitcoin paper trading", "crypto investment for beginners", "futures trading terms",
    "long short crypto", "isolated margin explained", "cross margin vs isolated",
  ],
  alternates: {
    canonical: "/en/guide",
    languages: { "ko": `${SITE}/guide`, "en": `${SITE}/en/guide` },
  },
  openGraph: {
    title: "Crypto Investment Guide — Futures, Indicators & Key Terms | TradeHub",
    description:
      "Learn crypto futures trading, leverage, liquidation, Kimchi Premium, Fear & Greed Index and more. Free guides for all levels.",
    url: `${SITE}/en/guide`,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Investment Guide — Futures, Indicators & Key Terms | TradeHub",
    description:
      "Futures trading, leverage, liquidation, Kimchi Premium, Fear & Greed Index explained simply.",
  },
};

const categoryMap: Record<string, string> = {
  "시장 지표": "Market Indicators",
  "선물 거래": "Futures Trading",
  "투자 도구": "Trading Tools",
};

const categoryOrder = ["시장 지표", "선물 거래", "투자 도구"] as const;

const GUIDE_LIST_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Crypto Investment Guide List",
  description: "Guides on crypto futures trading, market indicators, and trading tools",
  numberOfItems: guidesEn.length,
  itemListElement: guidesEn.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.title,
    description: g.description,
    url: `${SITE}/en/guide/${g.slug}`,
  })),
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
    { "@type": "ListItem", position: 2, name: "Investment Guide", item: `${SITE}/en/guide` },
  ],
};

export default function GuidesIndexEn() {
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    label: categoryMap[cat],
    items: guidesEn.filter((g) => g.category === cat),
  }));

  return (
    <>
      <Script id="ld-guide-list-en" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(GUIDE_LIST_JSONLD)}
      </Script>
      <Script id="ld-guide-bc-en" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(BREADCRUMB_JSONLD)}
      </Script>
      <main className="mx-auto max-w-3xl px-5 py-16 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight">Investment Guide</h1>
        <p className="mt-3 text-zinc-400">
          Clear explanations of the key concepts and strategies you need for crypto trading.
        </p>

        {grouped.map(({ category, label, items }) => (
          <section key={category} className="mt-12">
            <h2 className="text-lg font-bold text-[#02C076]">{label}</h2>
            <ul className="mt-4 space-y-3">
              {items.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/en/guide/${g.slug}`}
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
                        {g.readingTime} min read
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
      <SeoFooter />
    </>
  );
}
