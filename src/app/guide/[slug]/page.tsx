import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, getGuideBySlug, getAllGuideSlugs } from "@/shared/lib/guides";
import type { Guide } from "@/shared/lib/guides";
import { AdSenseUnit } from "@/shared/ui/AdSenseUnit";

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: `https://www.tradehub.kr/guide/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.title} | TradeHub`,
      description: guide.description,
      url: `https://www.tradehub.kr/guide/${guide.slug}`,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | TradeHub`,
      description: guide.description,
    },
  };
}

const SITE = "https://www.tradehub.kr";

function buildJsonLd(guide: Guide) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { "@type": "Organization", name: "TradeHub", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "TradeHub",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/favicon-512.png` },
    },
    mainEntityOfPage: `${SITE}/guide/${guide.slug}`,
    inLanguage: "ko",
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: SITE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "투자 가이드",
        item: `${SITE}/guide`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${SITE}/guide/${guide.slug}`,
      },
    ],
  };

  return [article, faq, breadcrumb];
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const jsonLdItems = buildJsonLd(guide);
  const relatedGuides = guide.relatedSlugs
    .map((s) => guides.find((g) => g.slug === s))
    .filter(Boolean) as Guide[];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 xl:max-w-5xl xl:pt-20">
      {jsonLdItems.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <nav aria-label="breadcrumb" className="text-footnote text-text-tertiary">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="transition-colors hover:text-text-secondary">홈</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/guide" className="transition-colors hover:text-text-secondary">가이드</Link></li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-text-secondary">{guide.title}</li>
        </ol>
      </nav>

      {/* 본문 폭은 읽기 좋은 42rem으로 묶고, 남는 자리에만 목차를 세운다.
          목차를 본문 위에 카드로 얹어두면 스크롤을 내릴 때마다 지나쳐야 하는
          벽이 하나 더 생긴다 — 긴 글일수록 옆에 붙어 따라오는 편이 낫다. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] xl:gap-12">
        <div className="min-w-0">
          {/* <header>로 감싸면 안 된다 — globals.css의
              `body:has([data-mobile-chrome]) header:not([data-mobile-header]) { display:none }`가
              전역 헤더를 감추려고 <header>를 싸잡아 잡기 때문에, 좁은 화면에서
              제목·설명·날짜가 통째로 사라진다. */}
          <div className="mt-7">
            <span className="text-caption font-bold tracking-wide text-[var(--color-accent-text)]">
              {guide.category}
            </span>
            <h1 className="mt-2 text-title2 font-extrabold leading-tight tracking-tight text-text-primary sm:text-title1">
              {guide.title}
            </h1>
            <p className="mt-3 text-body text-text-secondary">{guide.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote text-text-tertiary">
              <time dateTime={guide.updatedAt}>최종 업데이트 {guide.updatedAt}</time>
              <span aria-hidden="true">·</span>
              <span>{guide.readingTime}분 읽기</span>
            </div>
          </div>

          {/* 좁은 화면용 목차. 접어두는 이유는 화면 한 판을 목차가 차지하면
              본문 첫 줄까지 스크롤을 한 번 더 해야 하기 때문이다. */}
          <details className="group mt-8 rounded-card border border-border-subtle bg-surface-card xl:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-label font-bold text-text-primary">
              목차
              <Chevron className="transition-transform group-open:rotate-180" />
            </summary>
            <ol className="space-y-1 border-t border-border-subtle px-4 py-3 text-label">
              {guide.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block py-1 text-text-secondary transition-colors hover:text-[var(--color-accent-text)]">
                    <span className="mr-1.5 tabular-nums text-text-tertiary">{i + 1}</span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>

          <article className="mt-10 space-y-10 sm:mt-12">
            {guide.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="text-headline font-bold tracking-tight text-text-primary sm:text-title3">
                  {section.heading}
                </h2>
                <div className="mt-3 whitespace-pre-line text-body text-text-secondary">
                  {section.content}
                </div>

                {section.list && (
                  <ul className="mt-4 space-y-2 text-body text-text-secondary">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-text)]" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-4 overflow-x-auto rounded-card border border-border-subtle">
                    <table className="w-full min-w-[26rem] border-collapse text-label">
                      <thead>
                        <tr className="border-b border-border-subtle bg-surface-sunken">
                          {section.table.head.map((h) => (
                            <th key={h} scope="col" className="px-3 py-2.5 text-left font-bold text-text-tertiary">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-border-subtle last:border-0">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                /* 첫 열은 대개 짧은 라벨이다. 줄바꿈을 허용하면 3열 표에서
                                   폭을 뺏겨 "레버리 지"처럼 갈라진다. 넘치면 표가 가로로 스크롤된다. */
                                className={`px-3 py-2.5 align-top ${ci === 0 ? "whitespace-nowrap font-bold text-text-primary" : "text-text-secondary"}`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </article>

          {/* 구분선을 두르지 않는다 — 광고가 안 채워지면 globals.css가 ins를 접는데
              테두리와 여백은 남아서 본문 사이에 빈 줄만 뜬 것처럼 보인다.
              아래 FAQ 제목이 이미 구획을 나눠준다. */}
          <AdSenseUnit slot="7318540125" className="mt-12" />

          {guide.faqs.length > 0 && (
            <section className="mt-14">
              <h2 className="text-headline font-bold tracking-tight text-text-primary sm:text-title3">
                자주 묻는 질문
              </h2>
              {/* 카드를 하나씩 띄우지 않고 한 덩어리 안에서 줄로 나눈다 —
                  질문이 늘어날수록 낱개 카드는 화면을 잘게 부순다. */}
              <div className="mt-4 divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-surface-card">
                {guide.faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-label font-bold text-text-primary transition-colors hover:bg-surface-hover">
                      <span className="min-w-0">{faq.question}</span>
                      <Chevron className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-4 pb-4 text-label leading-[1.75] text-text-secondary">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <aside className="mt-14 rounded-card border border-border-subtle bg-surface-sunken px-5 py-6">
            <h2 className="text-headline font-bold text-text-primary">직접 확인해보세요</h2>
            <p className="mt-1.5 text-label text-text-secondary">
              지금까지 읽은 내용을 TradeHub에서 실제 화면으로 볼 수 있습니다.
            </p>
            {/* 채움 버튼에 흰 글씨를 얹을 때는 --color-accent가 아니라
                --color-accent-strong을 써야 한다 (명도비 2.54:1 → 4.5:1 이상).
                글자색은 text-white가 아니라 text-on-fill — globals.css의
                `html.light .text-white { color:#191F28 }`가 라이트 모드에서
                버튼 글씨를 어둡게 뒤집어 버린다. */}
            <Link
              href={guide.ctaTarget}
              className="mt-4 inline-flex items-center gap-2 rounded-control bg-[var(--color-accent-strong)] px-5 py-2.5 text-label font-bold text-text-on-fill transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              {guide.ctaText}
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </aside>

          {relatedGuides.length > 0 && (
            <section className="mt-14">
              <h2 className="text-headline font-bold tracking-tight text-text-primary">관련 가이드</h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {relatedGuides.map((rg) => (
                  <Link
                    key={rg.slug}
                    href={`/guide/${rg.slug}`}
                    className="group rounded-card border border-border-subtle bg-surface-card px-4 py-3.5 transition-colors hover:border-border-default hover:bg-surface-hover"
                  >
                    <span className="text-caption font-bold text-[var(--color-accent-text)]">{rg.category}</span>
                    <h3 className="mt-1 text-label font-bold text-text-primary">{rg.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 넓은 화면에서만 따라오는 목차. 전역 헤더가 살아나는 지점(xl)과 같은
            브레이크포인트를 쓴다 — 그 아래는 모바일 헤더라 사이드바를 세울 폭이 없다. */}
        <aside className="hidden xl:block">
          <nav aria-label="목차" className="sticky top-20">
            <h2 className="text-caption font-bold tracking-wide text-text-tertiary">목차</h2>
            <ol className="mt-3 space-y-0.5 border-l border-border-subtle">
              {guide.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-3 text-label text-text-tertiary transition-colors hover:border-[var(--color-accent-text)] hover:text-text-primary"
                  >
                    <span className="mr-1.5 tabular-nums">{i + 1}</span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </main>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-text-tertiary ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
