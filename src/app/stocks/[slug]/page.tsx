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
    return `${token.koreanName}(${token.englishName}) 주식 토큰의 실시간 가격을 원화로 확인하세요. ${where}가 문을 닫은 새벽과 주말에도 바이낸스 무기한 선물로 24시간 거래됩니다. 실시간 시세, 24시간 변동률과 함께 같은 종목 투자자 대화방도 무료로 제공합니다.`;
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


function fmtUsd(n: number | null, digits = 2) {
    if (n === null || !Number.isFinite(n)) return "—";
    return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
}

/** 원화 우선. 환율을 못 가져왔으면 달러로 폴백. */
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
    if (krw >= 1e12) return `${(krw / 1e12).toFixed(1)}조원`;
    if (krw >= 1e8) return `${Math.round(krw / 1e8).toLocaleString("ko-KR")}억원`;
    if (krw >= 1e4) return `${Math.round(krw / 1e4).toLocaleString("ko-KR")}만원`;
    return formatKrw(krw);
}

const CARD = "rounded-3xl bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]";

/** 큰 숫자 하나 + 라벨. 통계 카드 안에서 hairline으로 구분된다. */
function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="px-5 py-4">
            <div className="text-[11px] font-medium text-[var(--text-tertiary)]">{label}</div>
            <div className="mt-1 text-[15px] sm:text-base font-bold tabular-nums text-[var(--text-primary)]">
                {value}
            </div>
            {sub && <div className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">{sub}</div>}
        </div>
    );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{children}</h2>
            {hint && <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-tertiary)]">{hint}</p>}
        </div>
    );
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
        <main className="mx-auto max-w-2xl px-4 sm:px-5 pt-16 pb-20 text-[var(--text-primary)]">
            {jsonLdItems.map((item, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}

            <nav aria-label="breadcrumb" className="mb-5 text-[12px] text-[var(--text-muted)]">
                <ol className="flex items-center gap-1.5">
                    <li><Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">홈</Link></li>
                    <li aria-hidden>·</li>
                    <li><Link href="/stocks" className="hover:text-[var(--text-secondary)] transition-colors">주식 토큰</Link></li>
                </ol>
            </nav>

            {/* ── 히어로: 이 페이지에 온 이유(지금 얼마?)를 첫 화면에서 끝낸다 ── */}
            <section className={`${CARD} overflow-hidden`}>
                <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--surface-input)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                            {token.market === "KR" ? "한국" : "해외"} {token.category}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {token.symbol}USDT
                        </span>
                    </div>

                    <h1 className="mt-3 text-[17px] font-bold tracking-tight text-[var(--text-secondary)]">
                        {token.koreanName} 토큰 실시간 가격
                    </h1>

                    <div className="mt-4">
                        <StockLivePrice
                            symbol={token.symbol}
                            initialPrice={detail.quote?.price ?? null}
                            initialChangePercent={detail.quote?.changePercent ?? null}
                            usdKrw={detail.usdKrw}
                        />
                    </div>
                </div>

                {/* 장 마감 시간대에 이 페이지의 존재 이유를 그대로 말해준다 */}
                {!isUnlisted && (
                    <div
                        className={`border-t border-[var(--border-subtle)] px-5 sm:px-6 py-4 ${
                            status.isOpen ? "bg-transparent" : "bg-[var(--color-up-muted)]"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span
                                    className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${
                                        status.isOpen ? "bg-[var(--color-accent)]" : "bg-amber-400"
                                    }`}
                                />
                                <span
                                    className={`relative inline-flex h-2 w-2 rounded-full ${
                                        status.isOpen ? "bg-[var(--color-accent)]" : "bg-amber-400"
                                    }`}
                                />
                            </span>
                            <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                {status.label}
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                            {status.isOpen ? (
                                <>
                                    지금은 {status.marketName} 정규장({status.hours})입니다. 토큰
                                    가격과 실제 주가가 가깝게 움직이는 시간대예요.
                                </>
                            ) : (
                                <>
                                    {status.marketName}는 닫혔지만{" "}
                                    <strong className="font-bold text-[var(--text-primary)]">
                                        토큰은 계속 거래 중
                                    </strong>
                                    이에요. 위 가격은 종가가 아니라 마감 이후 매겨진 최신
                                    가격입니다.
                                </>
                            )}
                        </p>
                    </div>
                )}
            </section>

            {/* ── 통계: 박스 4개 대신 카드 하나 안에서 hairline으로 나눈다 ── */}
            <section className={`${CARD} mt-3 overflow-hidden`}>
                <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border-subtle)]">
                    <Cell
                        label="24시간 고가"
                        value={fmtPrice(detail.quote?.high ?? null, detail.usdKrw)}
                        sub={detail.usdKrw !== null ? fmtUsd(detail.quote?.high ?? null) : undefined}
                    />
                    <Cell
                        label="24시간 저가"
                        value={fmtPrice(detail.quote?.low ?? null, detail.usdKrw)}
                        sub={detail.usdKrw !== null ? fmtUsd(detail.quote?.low ?? null) : undefined}
                    />
                    <Cell
                        label="24시간 거래대금"
                        value={fmtCompactKrw(detail.quote?.quoteVolume ?? null, detail.usdKrw)}
                    />
                    <Cell
                        label="미결제약정"
                        value={fmtCompactKrw(detail.openInterestUsd, detail.usdKrw)}
                        sub="열려 있는 계약 규모"
                    />
                </div>
            </section>

            {detail.usdKrw !== null && (
                <p className="mt-3 px-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    1달러 ={" "}
                    {detail.usdKrw.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원 기준으로
                    환산했어요. 실제 체결은 USDT로 이루어집니다.
                </p>
            )}

            {/* ── 대화방: 가격 보러 온 사람을 머물게 하는 자리 ── */}
            <section id="chat" className="mt-12">
                <SectionTitle hint={`${token.koreanName}를 보고 있는 사람들과 지금 바로 이야기해보세요. 롱·숏 투표로 이 방의 분위기도 함께 보입니다.`}>
                    {token.koreanName} 투자자 대화방
                </SectionTitle>
                <div className={`${CARD} h-[560px] sm:h-[620px] p-3 sm:p-4`}>
                    <Chat roomId={`stock:${token.slug}`} />
                </div>
            </section>

            {/* ── 설명 ── */}
            <section className="mt-14">
                <SectionTitle>{token.koreanName} 토큰이란?</SectionTitle>
                <div className="space-y-3.5 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                    <p>{token.summary}</p>
                    <p>{token.angle}</p>
                </div>
            </section>

            <section className="mt-12">
                <SectionTitle hint={`가장 흔한 오해는 이 가격을 ${token.koreanName}의 정규장 주가로 그대로 받아들이는 것입니다. 주식이 아니라 주가를 추종하는 무기한 선물이에요.`}>
                    실제 주식과 무엇이 다른가
                </SectionTitle>
                <div className={`${CARD} overflow-hidden`}>
                    {[
                        ["거래 시간", isUnlisted ? "거래 불가(비상장)" : status.hours, "24시간 · 주말 포함"],
                        ["표시 통화", token.market === "KR" ? "원(KRW)" : "달러(USD)", "USDT"],
                        ["소유권", "주주 지위 있음", "없음(파생상품)"],
                        ["배당·의결권", "있음", "없음"],
                        ["레버리지", "제한적", "가능(청산 위험)"],
                        ["추가 비용", "거래 수수료·세금", "수수료 + 펀딩비"],
                    ].map(([k, a, b], i) => (
                        <div
                            key={k}
                            className={`grid grid-cols-[5.5rem_1fr_1fr] gap-2 px-4 py-3 text-[13px] ${
                                i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                            }`}
                        >
                            <span className="font-semibold text-[var(--text-tertiary)]">{k}</span>
                            <span className="text-[var(--text-tertiary)]">{a}</span>
                            <span className="font-medium text-[var(--text-primary)]">{b}</span>
                        </div>
                    ))}
                </div>
                <p className="mt-2.5 px-1 text-[11px] text-[var(--text-muted)]">
                    왼쪽이 실제 {token.koreanName} 주식, 오른쪽이 {token.symbol} 토큰입니다.
                </p>
            </section>

            <AdSenseUnit slot="7318540125" className="my-12" />

            <section className="mt-12">
                <SectionTitle>자주 묻는 질문</SectionTitle>
                <div className="space-y-2">
                    {faqs.map((faq) => (
                        <details key={faq.question} className={`${CARD} group overflow-hidden`}>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 text-[14px] font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--text-primary)]">
                                {faq.question}
                                <span className="shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-45 text-lg leading-none">
                                    +
                                </span>
                            </summary>
                            <p className="px-4 sm:px-5 pb-5 text-[13px] leading-[1.75] text-[var(--text-secondary)]">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="mt-12">
                <div className="rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/15 to-transparent p-6 ring-1 ring-[var(--color-accent)]/25">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">차트로도 보고 싶다면</h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                        TradeHub 대시보드에서 실시간 차트와 청산 데이터를 함께 확인하세요.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-[13px] font-bold text-black transition-colors hover:opacity-90"
                    >
                        실시간 대시보드 열기
                        <span aria-hidden>→</span>
                    </Link>
                </div>
            </section>

            <section className="mt-12">
                <SectionTitle>다른 종목도 보기</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                    {related.map((r) => (
                        <Link
                            key={r.slug}
                            href={`/stocks/${r.slug}`}
                            className={`${CARD} p-4 transition-colors hover:ring-[var(--color-accent)]/40`}
                        >
                            <div className="text-[11px] font-medium text-[var(--text-muted)]">
                                {r.market === "KR" ? "한국" : "해외"} {r.category}
                            </div>
                            <div className="mt-1 truncate text-[14px] font-bold text-[var(--text-primary)]">
                                {r.koreanName}
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/stocks"
                    className="mt-4 inline-block text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--color-up)]"
                >
                    주식 토큰 전체 보기 →
                </Link>
            </section>

            <p className="mt-14 px-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                본 페이지의 시세는 바이낸스 선물 시장 데이터로, {token.koreanName}의 정규장 주가나
                공식 시세가 아닙니다. 무기한 선물은 레버리지와 청산 위험이 있는 고위험 파생상품이며
                국가별로 거래가 제한될 수 있습니다. 본 정보는 투자 권유가 아니며 투자 판단과 그
                결과에 대한 책임은 이용자 본인에게 있습니다.
            </p>
        </main>
    );
}
