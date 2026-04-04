import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guidesEn, getGuideBySlugEn } from "@/shared/lib/guides-en";
import type { Guide } from "@/shared/lib/guides";
import { getAllGuideSlugs } from "@/shared/lib/guides";

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlugEn(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `/en/guide/${guide.slug}` },
    openGraph: {
      title: `${guide.title} | TradeHub`,
      description: guide.description,
      url: `https://www.tradehub.kr/en/guide/${guide.slug}`,
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
    mainEntityOfPage: `${SITE}/en/guide/${guide.slug}`,
    inLanguage: "en",
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
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/en/dashboard` },
      { "@type": "ListItem", position: 2, name: "Guide", item: `${SITE}/en/guide` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE}/en/guide/${guide.slug}` },
    ],
  };

  return [article, faq, breadcrumb];
}

export default async function EnGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlugEn(slug);
  if (!guide) notFound();

  const jsonLdItems = buildJsonLd(guide);
  const relatedGuides = guide.relatedSlugs
    .map((s) => guidesEn.find((g) => g.slug === s))
    .filter(Boolean) as Guide[];

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-white">
      {jsonLdItems.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
        <ol className="flex items-center gap-1">
          <li><Link href="/en/dashboard" className="hover:text-zinc-300">Home</Link></li>
          <li>/</li>
          <li><Link href="/en/guide" className="hover:text-zinc-300">Guide</Link></li>
          <li>/</li>
          <li className="text-zinc-300 truncate max-w-[200px]">{guide.title}</li>
        </ol>
      </nav>

      <header>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight leading-snug">
          {guide.title}
        </h1>
        <p className="mt-3 text-zinc-400">{guide.description}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
          <time dateTime={guide.updatedAt}>Updated: {guide.updatedAt}</time>
          <span>{guide.readingTime} min read</span>
        </div>
      </header>

      <nav aria-label="Table of contents" className="mt-10 rounded-xl bg-zinc-900/60 p-5 ring-1 ring-zinc-800">
        <h2 className="text-sm font-bold text-zinc-300">Contents</h2>
        <ol className="mt-3 space-y-1 text-sm">
          {guide.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-zinc-400 hover:text-[#02C076] transition-colors">
                {i + 1}. {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="mt-12 space-y-12">
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-xl font-bold tracking-tight">{section.heading}</h2>
            <div className="mt-3 text-zinc-300 leading-relaxed whitespace-pre-line">{section.content}</div>

            {section.list && (
              <ul className="mt-4 space-y-2 text-zinc-300">
                {section.list.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      {section.table.head.map((h) => (
                        <th key={h} className="py-2 pr-4 font-semibold text-zinc-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-zinc-800 last:border-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-2 pr-4 text-zinc-400">{cell}</td>
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

      {guide.faqs.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {guide.faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl bg-zinc-900/60 ring-1 ring-zinc-800 overflow-hidden">
                <summary className="cursor-pointer p-5 text-sm font-semibold text-zinc-200 hover:text-white transition-colors list-none flex items-center justify-between">
                  {faq.question}
                  <span className="ml-2 text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 rounded-xl bg-gradient-to-r from-[#02C076]/20 to-transparent p-8 ring-1 ring-[#02C076]/30">
        <h2 className="text-lg font-bold">See it live</h2>
        <p className="mt-2 text-sm text-zinc-400">Check {guide.title} for free on TradeHub.</p>
        <Link
          href={`/en${guide.ctaTarget}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#02C076] px-6 py-3 text-sm font-bold text-black hover:bg-[#02A666] transition-colors"
        >
          {guide.ctaText}
          <span>→</span>
        </Link>
      </div>

      {relatedGuides.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-bold">Related Guides</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedGuides.map((rg) => (
              <Link
                key={rg.slug}
                href={`/en/guide/${rg.slug}`}
                className="rounded-xl bg-zinc-900/60 p-5 ring-1 ring-zinc-800 hover:ring-[#02C076]/50 transition-colors"
              >
                <h3 className="mt-1 text-sm font-semibold text-white">{rg.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
