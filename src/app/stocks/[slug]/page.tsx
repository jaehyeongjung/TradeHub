import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    getStockToken,
    getAllStockSlugs,
    getRelatedStockTokens,
    type StockToken,
} from "@/shared/lib/stock-tokens";
import { getStockDetail, type StockDetail } from "@/shared/lib/stock-tokens.server";
import { getMarketStatus } from "@/shared/lib/market-hours";
import { formatKrw } from "@/shared/lib/fx";
import { AdSenseUnit } from "@/shared/ui/AdSenseUnit";
import { Chat } from "@/features/chat/Chat";
import { StockLivePrice } from "./StockLivePrice";

// 가격이 HTML에 박혀야 하므로 정적 생성 + 60초 재검증
export const revalidate = 60;

const SITE = "https://www.tradehub.kr";

export function generateStaticParams() {
    return getAllStockSlugs().map((slug) => ({ slug }));
}

function pageTitle(token: StockToken) {
    return `${token.koreanName} 토큰(${token.symbol}) 실시간 가격 — 24시간 시세`;
}

function pageDescription(token: StockToken) {
    const where = token.market === "KR" ? "한국 증시" : "미국 증시";
    return `${token.koreanName}(${token.englishName}) 주식 토큰의 실시간 가격을 확인하세요. ${where}가 문을 닫은 시간에도 바이낸스 무기한 선물로 24시간 거래됩니다. 실시간 시세, 24시간 변동률, 펀딩비, 미결제약정을 무료로 제공합니다.`;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const token = getStockToken(slug);
    if (!token) return {};

    const url = `${SITE}/stocks/${token.slug}`;
    const title = pageTitle(token);
    const description = pageDescription(token);

    return {
        title,
        description,
        keywords: [
            ...token.aliases,
            `${token.koreanName} 실시간`,
            `${token.koreanName} 주식 토큰`,
            `${token.symbol} 가격`,
            `${token.koreanName} 종토방`,
            `${token.koreanName} 토론방`,
            "주식 토큰",
            "토큰화 주식",
            "24시간 주식 거래",
        ],
        alternates: { canonical: url },
        openGraph: {
            title: `${title} | TradeHub`,
            description,
            url,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | TradeHub`,
            description,
        },
    };
}

function buildFaqs(token: StockToken, status: ReturnType<typeof getMarketStatus>) {
    const isUnlisted = token.category === "비상장";

    const faqs: { question: string; answer: string }[] = [
        {
            question: `${token.koreanName} 토큰 가격은 실제 ${token.koreanName} 주가와 같나요?`,
            answer: isUnlisted
                ? `${token.koreanName}는 상장 기업이 아니라서 비교할 정규장 주가 자체가 없습니다. ${token.symbol} 토큰 가격은 장외 가치평가와 선물 시장의 수급으로 결정되며, 실제 지분 가치와 크게 벌어질 수 있습니다.`
                : `추종하지만 같지는 않습니다. ${token.symbol} 토큰은 ${token.koreanName} 주가를 기초자산으로 하는 USDT 표시 무기한 선물입니다. 펀딩비와 수급에 따른 베이시스가 붙고, ${status.marketName}가 닫힌 시간에도 계속 거래되기 때문에 정규장 종가와 차이가 생깁니다. 실제 주식을 보유하는 것도 아니어서 의결권과 배당은 없습니다.`,
        },
        {
            question: `${status.marketName}가 마감한 뒤에도 ${token.koreanName} 가격을 볼 수 있나요?`,
            answer: `네. ${token.symbol} 무기한 선물은 정규장 시간(${status.hours})과 무관하게 24시간 거래됩니다. 이 페이지의 가격은 바이낸스 시세를 실시간으로 반영하므로, 장 마감 후나 주말에도 시장이 ${token.koreanName}를 어떻게 평가하고 있는지 확인할 수 있습니다.`,
        },
        {
            question: `${token.koreanName} 토큰을 사면 실제 주주가 되나요?`,
            answer: `아닙니다. 무기한 선물 계약이라 기초자산을 실제로 보유하지 않습니다. 배당, 의결권, 주주 권리가 모두 없으며 만기 없이 포지션만 유지되는 파생상품입니다.`,
        },
        {
            question: `이 페이지의 원화 가격은 어떻게 계산하나요?`,
            answer: `바이낸스 ${token.symbol}USDT 체결가에 실시간 USD/KRW 환율을 곱해 환산한 값입니다. 실제 체결은 USDT로 이루어지므로 원화는 참고용 표기이며, 환율이 움직이면 달러 가격이 그대로여도 원화 표시가 달라질 수 있습니다.`,
        },
    ];

    if (token.market === "KR") {
        faqs.push({
            question: `${token.koreanName} 토큰 가격이 KRX 종가보다 높거나 낮으면 무슨 뜻인가요?`,
            answer: `한국 장이 닫힌 뒤 나온 뉴스나 해외 증시 흐름이 반영됐다는 뜻입니다. 예를 들어 미국 반도체주가 급등한 새벽에 토큰 가격이 KRX 종가보다 높다면, 다음 날 시초가가 높게 열릴 가능성을 시장이 반영하고 있는 것입니다. 다만 이는 참고 지표일 뿐 실제 시초가를 보장하지 않습니다.`,
        });
    }

    return faqs;
}

function buildJsonLd(
    token: StockToken,
    detail: StockDetail,
    faqs: { question: string; answer: string }[],
) {
    const url = `${SITE}/stocks/${token.slug}`;

    const product = {
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        name: `${token.koreanName} 토큰 (${token.symbol}USDT)`,
        description: pageDescription(token),
        url,
        category: "무기한 선물",
        provider: { "@type": "Organization", name: "Binance" },
        ...(detail.quote
            ? {
                  offers: {
                      "@type": "Offer",
                      price: detail.quote.price,
                      priceCurrency: "USDT",
                      url,
                  },
              }
            : {}),
    };

    const faqPage = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "홈", item: SITE },
            { "@type": "ListItem", position: 2, name: "주식 토큰", item: `${SITE}/stocks` },
            {
                "@type": "ListItem",
                position: 3,
                name: `${token.koreanName} 토큰`,
                item: url,
            },
        ],
    };

    return [product, faqPage, breadcrumb];
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-xl bg-zinc-900/60 p-3.5 sm:p-4 ring-1 ring-zinc-800">
            <div className="text-[11px] sm:text-xs text-zinc-500">{label}</div>
            <div className="mt-1 text-base sm:text-lg font-bold tabular-nums text-zinc-100 break-keep">
                {value}
            </div>
            {sub && <div className="mt-0.5 text-[11px] text-zinc-600 tabular-nums">{sub}</div>}
        </div>
    );
}

function fmtUsd(n: number | null, digits = 2) {
    if (n === null || !Number.isFinite(n)) return "—";
    return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
}

/** 원화 우선. 환율이 없으면 달러로 폴백. */
function fmtPrice(usd: number | null, usdKrw: number | null) {
    if (usd === null || !Number.isFinite(usd)) return "—";
    return usdKrw === null ? fmtUsd(usd) : formatKrw(usd * usdKrw);
}

function fmtCompactKrw(usd: number | null, usdKrw: number | null) {
    if (usd === null || !Number.isFinite(usd)) return "—";
    if (usdKrw === null) {
        if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
        if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
        return `$${usd.toFixed(0)}`;
    }
    const krw = usd * usdKrw;
    if (krw >= 1e12) return `${(krw / 1e12).toFixed(2)}조원`;
    if (krw >= 1e8) return `${(krw / 1e8).toFixed(0)}억원`;
    if (krw >= 1e4) return `${(krw / 1e4).toFixed(0)}만원`;
    return formatKrw(krw);
}

export default async function StockTokenPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const token = getStockToken(slug);
    if (!token) notFound();

    const detail = await getStockDetail(token.symbol);
    const status = getMarketStatus(token.market);
    const faqs = buildFaqs(token, status);
    const jsonLdItems = buildJsonLd(token, detail, faqs);
    const related = getRelatedStockTokens(token);
    const isUnlisted = token.category === "비상장";

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
                    <li><Link href="/" className="hover:text-zinc-300">홈</Link></li>
                    <li>/</li>
                    <li><Link href="/stocks" className="hover:text-zinc-300">주식 토큰</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">{token.koreanName}</li>
                </ol>
            </nav>

            <header>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#02C076] tracking-wide">
                        {token.market === "KR" ? "한국 " : "해외 "}
                        {token.category}
                    </span>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{token.symbol}USDT</span>
                </div>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight leading-snug">
                    {token.koreanName} 토큰 실시간 가격
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    {token.englishName} · 바이낸스 무기한 선물
                </p>

                <div className="mt-6">
                    <StockLivePrice
                        symbol={token.symbol}
                        initialPrice={detail.quote?.price ?? null}
                        initialChangePercent={detail.quote?.changePercent ?? null}
                        usdKrw={detail.usdKrw}
                    />
                </div>

                {/* 이 페이지의 존재 이유 — 원장이 닫혀도 여기선 가격이 움직인다 */}
                {!isUnlisted && (
                    <div
                        className={`mt-6 rounded-xl p-4 ring-1 ${
                            status.isOpen
                                ? "bg-zinc-900/60 ring-zinc-800"
                                : "bg-[#02C076]/10 ring-[#02C076]/30"
                        }`}
                    >
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    status.isOpen ? "bg-[#02C076]" : "bg-amber-400"
                                }`}
                            />
                            {status.label}
                        </div>
                        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                            {status.isOpen ? (
                                <>
                                    지금은 {status.marketName} 정규장({status.hours})이 열려 있습니다.
                                    토큰 가격과 실제 주가가 대체로 가깝게 움직이는 시간대입니다.
                                </>
                            ) : (
                                <>
                                    지금 {status.marketName}는 문을 닫았지만({status.hours} 기준),{" "}
                                    <strong className="text-zinc-200">
                                        {token.symbol} 토큰은 계속 거래되고 있습니다.
                                    </strong>{" "}
                                    위 가격은 정규장 종가가 아니라, 마감 이후 시장이 매긴 최신
                                    가격입니다.
                                </>
                            )}
                        </p>
                    </div>
                )}
            </header>

            <section className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                <Stat
                    label="24시간 고가"
                    value={fmtPrice(detail.quote?.high ?? null, detail.usdKrw)}
                    sub={detail.usdKrw !== null ? fmtUsd(detail.quote?.high ?? null) : undefined}
                />
                <Stat
                    label="24시간 저가"
                    value={fmtPrice(detail.quote?.low ?? null, detail.usdKrw)}
                    sub={detail.usdKrw !== null ? fmtUsd(detail.quote?.low ?? null) : undefined}
                />
                <Stat
                    label="24시간 거래대금"
                    value={fmtCompactKrw(detail.quote?.quoteVolume ?? null, detail.usdKrw)}
                />
                <Stat
                    label="미결제약정"
                    value={fmtCompactKrw(detail.openInterestUsd, detail.usdKrw)}
                    sub="열려 있는 계약 규모"
                />
            </section>

            {detail.usdKrw !== null && (
                <p className="mt-3 text-[11px] text-zinc-600">
                    원화 환산 기준 환율 1달러 = {detail.usdKrw.toLocaleString("ko-KR", {
                        maximumFractionDigits: 2,
                    })}
                    원 · 실제 체결은 USDT로 이루어집니다.
                </p>
            )}

            {/* 같은 종목을 보는 사람끼리 모이는 곳. 대시보드에서 쓰는 채팅을 종목별 방으로 재사용한다. */}
            <section id="chat" className="mt-12">
                <h2 className="text-xl font-bold tracking-tight">
                    {token.koreanName} 투자자 대화방
                </h2>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                    {token.koreanName}를 보고 있는 사람들과 실시간으로 이야기하세요. 롱·숏 투표로
                    지금 이 방의 분위기도 함께 확인할 수 있습니다.
                </p>
                <div className="mt-4 h-[560px] sm:h-[620px] rounded-2xl">
                    <Chat roomId={`stock:${token.slug}`} />
                </div>
            </section>

            <article className="mt-14 space-y-12">
                <section id="what-is">
                    <h2 className="text-xl font-bold tracking-tight">
                        {token.koreanName} 토큰이란?
                    </h2>
                    <p className="mt-3 text-zinc-300 leading-relaxed">{token.summary}</p>
                    <p className="mt-3 text-zinc-300 leading-relaxed">{token.angle}</p>
                </section>

                <section id="vs-stock">
                    <h2 className="text-xl font-bold tracking-tight">
                        실제 주식과 무엇이 다른가
                    </h2>
                    <p className="mt-3 text-zinc-300 leading-relaxed">
                        가장 흔한 오해는 이 가격을 {token.koreanName}의 정규장 주가로 그대로
                        받아들이는 것입니다. {token.symbol} 토큰은 주식이 아니라 주가를 추종하는
                        USDT 표시 무기한 선물이며, 아래 차이를 알고 봐야 합니다.
                    </p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="py-2 pr-4 font-semibold text-zinc-300">구분</th>
                                    <th className="py-2 pr-4 font-semibold text-zinc-300">
                                        실제 {token.koreanName} 주식
                                    </th>
                                    <th className="py-2 pr-4 font-semibold text-zinc-300">
                                        {token.symbol} 토큰
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["거래 시간", isUnlisted ? "거래 불가(비상장)" : status.hours, "24시간 · 주말 포함"],
                                    ["표시 통화", token.market === "KR" ? "원(KRW)" : "달러(USD)", "USDT"],
                                    ["소유권", "주주 지위 있음", "없음(파생상품)"],
                                    ["배당·의결권", "있음", "없음"],
                                    ["레버리지", "제한적", "가능(청산 위험)"],
                                    ["추가 비용", "거래 수수료·세금", "거래 수수료 + 펀딩비"],
                                ].map(([k, a, b]) => (
                                    <tr key={k} className="border-b border-zinc-800 last:border-0">
                                        <td className="py-2 pr-4 text-zinc-400">{k}</td>
                                        <td className="py-2 pr-4 text-zinc-400">{a}</td>
                                        <td className="py-2 pr-4 text-zinc-300">{b}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="how-to-read">
                    <h2 className="text-xl font-bold tracking-tight">
                        이 페이지를 보는 법
                    </h2>
                    <ul className="mt-4 space-y-2 text-zinc-300">
                        {[
                            `가격: 바이낸스 ${token.symbol}USDT 최신 체결가를 원화로 환산한 값입니다. 정규장이 닫혀 있어도 계속 갱신됩니다.`,
                            "24시간 고가·저가: 정규장 시간이 아니라 최근 24시간 전체 기준입니다.",
                            "미결제약정: 청산되지 않고 열려 있는 계약 규모입니다. 급증하면 변동성이 커질 수 있습니다.",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </article>

            <AdSenseUnit slot="7318540125" className="my-10" />

            <section className="mt-14">
                <h2 className="text-xl font-bold tracking-tight">자주 묻는 질문</h2>
                <div className="mt-4 space-y-3">
                    {faqs.map((faq) => (
                        <details
                            key={faq.question}
                            className="group rounded-xl bg-zinc-900/60 ring-1 ring-zinc-800 overflow-hidden"
                        >
                            <summary className="cursor-pointer p-5 text-sm font-semibold text-zinc-200 hover:text-white transition-colors list-none flex items-center justify-between gap-3">
                                {faq.question}
                                <span className="text-zinc-500 group-open:rotate-180 transition-transform shrink-0">
                                    ▼
                                </span>
                            </summary>
                            <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            <div className="mt-14 rounded-xl bg-gradient-to-r from-[#02C076]/20 to-transparent p-8 ring-1 ring-[#02C076]/30">
                <h2 className="text-lg font-bold">실시간 차트로 보기</h2>
                <p className="mt-2 text-sm text-zinc-400">
                    TradeHub 대시보드에서 {token.koreanName} 토큰의 차트와 청산 데이터를 함께
                    확인하세요.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#02C076] px-6 py-3 text-sm font-bold text-black hover:bg-[#02A666] transition-colors"
                >
                    실시간 대시보드 열기
                    <span>→</span>
                </Link>
            </div>

            <section className="mt-14">
                <h2 className="text-lg font-bold">다른 주식 토큰</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {related.map((r) => (
                        <Link
                            key={r.slug}
                            href={`/stocks/${r.slug}`}
                            className="rounded-xl bg-zinc-900/60 p-5 ring-1 ring-zinc-800 hover:ring-[#02C076]/50 transition-colors"
                        >
                            <span className="text-xs text-[#02C076]">
                                {r.market === "KR" ? "한국" : "해외"} {r.category}
                            </span>
                            <h3 className="mt-1 text-sm font-semibold text-white">
                                {r.koreanName} 토큰 실시간 가격
                            </h3>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/stocks"
                    className="mt-4 inline-block text-sm text-zinc-400 hover:text-[#02C076] transition-colors"
                >
                    주식 토큰 전체 보기 →
                </Link>
            </section>

            <p className="mt-14 text-xs leading-relaxed text-zinc-600">
                본 페이지의 시세는 바이낸스 선물 시장 데이터를 제공하는 것으로, {token.koreanName}
                의 정규장 주가나 공식 시세가 아닙니다. 무기한 선물은 레버리지와 청산 위험이 있는
                고위험 파생상품이며, 국가별로 거래가 제한될 수 있습니다. 본 정보는 투자 권유가
                아니며 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.
            </p>
        </main>
    );
}
