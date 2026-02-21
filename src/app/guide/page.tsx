import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "투자 가이드 — 코인 용어 · 지표 · 전략 쉽게 배우기",
  description:
    "김치프리미엄, 공포탐욕지수, 청산, 레버리지, 모의투자 등 코인 투자에 필요한 핵심 개념과 전략을 쉽게 설명합니다.",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "투자 가이드 — 코인 용어 · 지표 · 전략 쉽게 배우기 | TradeHub",
    description:
      "김치프리미엄, 공포탐욕지수, 청산, 레버리지, 모의투자 등 코인 투자에 필요한 핵심 개념과 전략을 쉽게 설명합니다.",
    url: "https://www.tradehub.kr/guide",
    type: "website",
  },
};

const categoryOrder = ["시장 지표", "선물 거래", "투자 도구"] as const;

export default function GuidesIndex() {
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: guides.filter((g) => g.category === cat),
  }));

  return (
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
  );
}
