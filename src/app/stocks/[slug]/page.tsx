import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    getStockToken,
    getRelatedStockTokens,
    searchName,
    type StockToken,
} from "@/shared/lib/stock-tokens";
import { getStockDetail, type StockDetail } from "@/shared/lib/stock-tokens.server";
import { getMarketStatus } from "@/shared/lib/market-hours";
import { fmtPrice, fmtCompactKrw } from "../format";

import { AdSenseUnit } from "@/shared/ui/AdSenseUnit";
import { StockRoom } from "@/features/floors/StockRoom";
import { StockLiveData } from "./StockLiveData";
import { MarketStatusNote } from "./MarketStatusNote";

// 첫 요청 때 렌더하고 60초간 캐시한다(ISR).
//
// generateStaticParams로 빌드 때 미리 만들면 안 된다 — 빌드는 미국 빌드 머신에서 돌고
// 바이낸스는 그 IP를 451로 차단하므로, 가격이 빈 HTML이 그대로 굳는다. 트래픽이 없는
// 종목은 구글봇이 첫 방문자가 되어 그 빈 HTML을 색인해 간다.
// 서울 리전(vercel.json regions)에서 요청 시점에 렌더하면 시세가 HTML에 박힌다.
export const revalidate = 60;
export const preferredRegion = "icn1";

const SITE = "https://www.tradehub.kr";

/** "7월 29일 11:24" (KST). 검색 결과에 노출되는 신선도 신호로 쓴다. */
function kstStamp(d: Date): string {
    const parts = new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("month")}월 ${get("day")}일 ${get("hour")}:${get("minute")}`;
}

function signedPct(pct: number): string {
    return `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(2)}%`;
}

/** "KOSPI 005930" → "005930", "NASDAQ: TSLA" → "TSLA". 비상장은 null. */
function tickerOf(token: StockToken): string | null {
    const m = /(?::\s*|\s)([A-Z0-9]{2,6})$/.exec(token.listing);
    return m ? m[1] : null;
}

/**
 * 제목 앞머리에 검색어(줄임말 + "실시간 가격")와 현재가를 함께 넣는다.
 * 가격이 제목에 있으면 시세 질의에서 클릭률이 오르고, 60초마다 갱신돼 신선도 신호도 된다.
 */
function pageTitle(token: StockToken, priceLabel: string | null) {
    const name = searchName(token);
    const head = priceLabel
        ? `${name} 실시간 가격 ${priceLabel}`
        : `${name} 실시간 가격`;
    const tail =
        name === token.koreanName
            ? `${token.symbol} 토큰 24시간 시세`
            : `${token.koreanName} 토큰 24시간 시세`;
    return `${head} — ${tail}`;
}

function pageDescription(
    token: StockToken,
    priceLabel: string | null,
    changePercent: number | null,
    stamp: string | null,
) {
    const name = searchName(token);
    const where = token.market === "KR" ? "한국 증시" : "미국 증시";

    const lead =
        priceLabel !== null
            ? `${name} 토큰(${token.symbol}USDT) 실시간 가격은 ${priceLabel}${
                  changePercent !== null ? `, 24시간 ${signedPct(changePercent)}` : ""
              }입니다.${stamp ? ` ${stamp} 기준.` : ""} `
            : `${name}(${token.englishName}) 주식 토큰의 실시간 가격을 원화로 확인하세요. `;

    return `${lead}${where}가 문을 닫은 새벽과 주말에도 바이낸스 무기한 선물로 24시간 거래됩니다. 원화 환산 가격, 24시간 고가·저가·거래대금, 정규장 마감 이후 변동률과 함께 같은 종목 투자자 대화방도 무료로 제공합니다.`;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const token = getStockToken(slug);
    if (!token) return {};

    // 페이지 본문과 같은 fetch를 쓴다 — Next가 메모이즈하므로 추가 호출이 아니다
    const detail = await getStockDetail(token.symbol, token.market);
    const priceLabel =
        detail.quote !== null ? fmtPrice(detail.quote.price, detail.usdKrw) : null;
    const stamp = detail.quote !== null ? kstStamp(new Date()) : null;

    const url = `${SITE}/stocks/${token.slug}`;
    const title = pageTitle(token, priceLabel);
    const description = pageDescription(
        token,
        priceLabel,
        detail.quote?.changePercent ?? null,
        stamp,
    );
    const name = searchName(token);

    return {
        // 시세가 들어가 제목이 길어졌다. " | TradeHub" 접미사를 빼서 잘리는 부분을 줄인다.
        title: { absolute: title },
        description,
        keywords: [
            ...token.aliases,
            `${name} 실시간 가격`,
            `${name} 지금 얼마`,
            `${token.koreanName} 주식 토큰`,
            `${token.symbol} 가격`,
            `${token.koreanName} 종토방`,
            `${token.koreanName} 토론방`,
            token.market === "KR" ? `${name} 시간외 가격` : `${name} 프리마켓`,
            "주식 토큰",
            "토큰화 주식",
            "24시간 주식 거래",
            "장 마감 후 주가",
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
    const name = searchName(token);

    const faqs: { question: string; answer: string }[] = [
        {
            question: `${name} 지금 얼마인가요?`,
            answer: `이 페이지 상단의 큰 숫자가 ${token.symbol} 토큰의 현재 가격입니다. 바이낸스 시세를 원화로 환산해 실시간으로 갱신하며, ${status.marketName} 정규장(${status.hours})이 닫힌 새벽과 주말에도 멈추지 않습니다. 다만 이 값은 ${token.koreanName}의 공식 주가가 아니라 주가를 추종하는 무기한 선물 가격입니다.`,
        },
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

    if (token.extraFaqs) faqs.push(...token.extraFaqs);

    return faqs;
}

function buildJsonLd(
    token: StockToken,
    detail: StockDetail,
    faqs: { question: string; answer: string }[],
    title: string,
    description: string,
    now: Date,
) {
    const url = `${SITE}/stocks/${token.slug}`;
    const ticker = tickerOf(token);

    const product = {
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        name: `${token.koreanName} 토큰 (${token.symbol}USDT)`,
        description,
        url,
        category: "무기한 선물",
        provider: { "@type": "Organization", name: "Binance" },
        ...(ticker && token.category === "주식"
            ? {
                  // 기초자산이 되는 실제 기업. 검색엔진이 종목 엔티티와 이 페이지를 연결하는 단서다.
                  about: {
                      "@type": "Corporation",
                      name: token.koreanName,
                      alternateName: token.englishName,
                      tickerSymbol: ticker,
                  },
              }
            : {}),
        ...(detail.quote
            ? {
                  offers: {
                      "@type": "Offer",
                      price: detail.quote.price,
                      // USDT는 ISO 통화 코드가 아니라 달러 표시로 기재한다 (본문에 USDT 체결임을 명시)
                      priceCurrency: "USD",
                      url,
                  },
              }
            : {}),
    };

    // 시세 페이지는 "언제 기준 숫자인가"가 곧 품질이다. 갱신 시각을 명시한다.
    const webPage = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url,
        inLanguage: "ko-KR",
        dateModified: now.toISOString(),
        isPartOf: { "@type": "WebSite", name: "TradeHub", url: SITE },
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

    return [product, webPage, faqPage, breadcrumb];
}



const CARD = "rounded-3xl bg-[var(--surface-card)] ring-1 ring-[var(--border-subtle)]";


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

    const detail = await getStockDetail(token.symbol, token.market);
    const status = getMarketStatus(token.market);
    const faqs = buildFaqs(token, status);
    const now = new Date();
    const stamp = kstStamp(now);
    const priceLabel = detail.quote !== null ? fmtPrice(detail.quote.price, detail.usdKrw) : null;
    const title = pageTitle(token, priceLabel);
    const description = pageDescription(
        token,
        priceLabel,
        detail.quote?.changePercent ?? null,
        detail.quote !== null ? stamp : null,
    );
    const jsonLdItems = buildJsonLd(token, detail, faqs, title, description, now);
    const related = getRelatedStockTokens(token);
    const isUnlisted = token.category === "비상장";
    const name = searchName(token);

    // 정규장 마감 이후 얼마나 움직였나 — 이 페이지만 답할 수 있는 숫자를 문장으로도 남긴다
    const sinceClosePct =
        detail.quote !== null && detail.sessionClosePrice !== null && detail.sessionClosePrice > 0
            ? ((detail.quote.price - detail.sessionClosePrice) / detail.sessionClosePrice) * 100
            : null;

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
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--surface-input)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                            {token.market === "KR" ? "한국" : "해외"} {token.category}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {token.symbol}USDT
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            · {token.listing}
                        </span>
                    </div>

                    <h1 className="mt-3 text-[17px] font-bold tracking-tight text-[var(--text-secondary)]">
                        {name === token.koreanName
                            ? `${token.koreanName} 토큰 실시간 가격`
                            : `${token.koreanName}(${name}) 토큰 실시간 가격`}
                    </h1>

                    <div className="mt-4">
                        <StockLiveData
                            symbol={token.symbol}
                            usdKrw={detail.usdKrw}
                            initial={{
                                price: detail.quote?.price ?? null,
                                changePercent: detail.quote?.changePercent ?? null,
                                high: detail.quote?.high ?? null,
                                low: detail.quote?.low ?? null,
                                quoteVolume: detail.quote?.quoteVolume ?? null,
                                openInterestUsd: detail.openInterestUsd,
                                sessionClosePrice: detail.sessionClosePrice,
                            }}
                            sessionCloseAt={detail.sessionCloseAt}
                            marketIsOpen={status.isOpen}
                            marketName={status.marketName}
                            isUnlisted={isUnlisted}
                        />
                    </div>
                </div>

                {/* 장 마감 시간대에 이 페이지의 존재 이유를 그대로 말해준다 */}
                {!isUnlisted && (
                    <div
                        className={`border-t border-[var(--border-subtle)] px-5 sm:px-6 py-4 ${
                            status.isOpen ? "bg-transparent" : "bg-[var(--surface-input)]"
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
                        {/* 새벽엔 "N명이 아직 안 잤습니다"로 바뀐다 */}
                        <MarketStatusNote
                            roomId={`stock:${token.slug}`}
                            isOpen={status.isOpen}
                            marketName={status.marketName}
                            hours={status.hours}
                        />
                    </div>
                )}
            </section>

            <p className="mt-3 px-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                {stamp} 기준 시세로 페이지를 만들었고, 이후 값은 브라우저에서 실시간으로 갱신됩니다.
                {detail.usdKrw !== null && (
                    <>
                        {" "}1달러 ={" "}
                        {detail.usdKrw.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원 기준으로
                        환산했어요. 실제 체결은 USDT로 이루어집니다.
                    </>
                )}
            </p>

            {/* ── 층 단면도 + 대화방 ──
                가격 다음 자리를 서술형 본문이 아니라 방에 준다. 가격만 확인하고 이탈하는
                흐름을 끊는 게 이 페이지의 목적이고, 서술형 본문은 아래에 그대로 남아 있어
                크롤러가 읽는 내용은 달라지지 않는다. */}
            <StockRoom
                slug={token.slug}
                symbol={token.symbol}
                koreanName={token.koreanName}
                market={token.market}
                floorUnit={token.floorUnit}
                usdKrw={detail.usdKrw}
                initialPrice={detail.quote?.price ?? null}
            />

            {/* ── 검색 질의 그대로를 제목으로: "삼전 지금 얼마?" ── */}
            {detail.quote !== null && (
                <section className="mt-12">
                    {/* 제목·본문은 템플릿 문자열로 만들어 한 텍스트 노드가 되게 한다
                    (JSX에서 표현식과 문자열을 섞으면 사이에 주석 노드가 끼어 문장이 쪼개진다) */}
                <SectionTitle>{`${name} 지금 얼마인가요?`}</SectionTitle>
                    <div className="space-y-3.5 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                        <p>
                            {stamp} 기준 {token.symbol} 토큰 가격은{" "}
                            <strong className="font-bold text-[var(--text-primary)]">
                                {priceLabel}
                            </strong>
                            , 24시간 변동률은 {signedPct(detail.quote.changePercent)}입니다. 같은
                            기간 고가는 {fmtPrice(detail.quote.high, detail.usdKrw)}, 저가는{" "}
                            {fmtPrice(detail.quote.low, detail.usdKrw)}이고 거래대금은{" "}
                            {fmtCompactKrw(detail.quote.quoteVolume, detail.usdKrw)}입니다.
                        </p>
                        {sinceClosePct !== null && !isUnlisted && (
                            <p>
                                직전 {status.marketName} 정규장 마감 시점과 비교하면{" "}
                                <strong className="font-bold text-[var(--text-primary)]">
                                    {signedPct(sinceClosePct)}
                                </strong>{" "}
                                움직였습니다. {status.marketName}가 닫혀 있는 동안 시장이{" "}
                                {token.koreanName}를 다시 평가한 폭이라고 볼 수 있습니다. 다만 기준값은
                                마감 시점의 토큰 가격이며 {token.koreanName}의 정규장 종가가 아닙니다.
                            </p>
                        )}
                        <p>
                            위 숫자는 {token.listing}
                            {token.category === "비상장"
                                ? " 기업의 장외 가치평가를 기초자산으로 삼는"
                                : "을 기초자산으로 삼는"}{" "}
                            바이낸스 무기한 선물({token.symbol}USDT)의 가격이며, 해당 종목의 공식
                            시세가 아닙니다.
                        </p>
                    </div>
                </section>
            )}

            {/* ── 설명 ── */}
            <section className="mt-14">
                <SectionTitle>{`${token.koreanName} 토큰이란?`}</SectionTitle>
                <div className="space-y-3.5 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                    <p>{token.summary}</p>
                    <p>{token.angle}</p>
                </div>
            </section>

            {/* ── 종목별 고유 본문: 이 가격을 움직이는 것들 ── */}
            <section className="mt-12">
                <SectionTitle hint={`가격이 크게 움직였다면 아래 중 하나가 원인일 가능성이 높습니다.`}>
                    {`${token.koreanName} 가격을 움직이는 것들`}
                </SectionTitle>
                <div className={`${CARD} overflow-hidden`}>
                    {token.watchPoints.map((w, i) => (
                        <div
                            key={w.title}
                            className={`px-4 py-4 sm:px-5 ${
                                i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                            }`}
                        >
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)]">
                                {w.title}
                            </h3>
                            <p className="mt-1.5 text-[13px] leading-[1.75] text-[var(--text-secondary)]">
                                {w.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 시간외·프리마켓 질의를 정면으로 받는 섹션 ── */}
            {!isUnlisted && (
                <section className="mt-12">
                    <SectionTitle>
                        {token.market === "KR"
                            ? `${name} 시간외 가격은 어디서 보나요?`
                            : `${name} 프리마켓·애프터마켓 가격은 어디서 보나요?`}
                    </SectionTitle>
                    <div className="space-y-3.5 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                        {token.market === "KR" ? (
                            <>
                                <p>
                                    한국거래소의 시간외 거래는 정규장이 끝난 뒤 장후 시간외 종가매매와
                                    시간외 단일가매매로 이어지고, 18시가 지나면 그날의 가격은 더 이상
                                    갱신되지 않습니다. 그래서 밤에 해외 증시가 크게 움직여도 국내
                                    증권사 앱에는 반영될 자리가 없습니다.
                                </p>
                                <p>
                                    {token.symbol} 토큰은 이 공백을 메우는 용도로 보면 정확합니다.
                                    시간외 거래가 끝난 뒤부터 다음 날 09시 개장 전까지도 계속 체결되기
                                    때문에, 새벽에 나온 뉴스에 시장이 어떻게 반응하는지 이 페이지에서
                                    확인할 수 있습니다. 시간외 단일가와는 참여자도 가격 결정 방식도
                                    다른, 별개의 시장이라는 점만 기억하면 됩니다.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    미국 주식의 프리마켓·애프터마켓은 정해진 시간대에만 열립니다. 그
                                    시간이 지나면 호가가 멈추고, 한국 시간으로 낮에는 대부분 전일
                                    종가만 남습니다.
                                </p>
                                <p>
                                    {token.symbol} 토큰은 그 사이 시간과 주말에도 끊기지 않습니다. 한국
                                    낮 시간에 {name} 가격을 확인하고 싶을 때, 또는 애프터마켓이 닫힌
                                    뒤 프리마켓이 열리기 전까지의 흐름을 보고 싶을 때 참고할 수 있는
                                    거의 유일한 실시간 값입니다. 다만 정규장 시세가 아니라 선물
                                    가격이라 괴리가 생길 수 있습니다.
                                </p>
                            </>
                        )}
                    </div>
                </section>
            )}

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
                            className={`px-4 py-3 text-[13px] sm:grid sm:grid-cols-[6rem_1fr_1fr] sm:gap-2 ${
                                i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                            }`}
                        >
                            <span className="font-semibold text-[var(--text-tertiary)]">{k}</span>
                            {/* 모바일에선 3열이 너무 좁아 라벨 아래로 값 두 개를 나란히 놓는다 */}
                            <span className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-0 sm:contents">
                                <span className="text-[var(--text-tertiary)]">{a}</span>
                                <span className="font-medium text-[var(--text-primary)]">{b}</span>
                            </span>
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
                <SectionTitle>다른 종목 실시간 가격</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                    {related.map((r) => (
                        <Link
                            key={r.slug}
                            href={`/stocks/${r.slug}`}
                            className={`${CARD} p-4 transition-colors hover:ring-[var(--border-strong)]`}
                        >
                            <div className="text-[11px] font-medium text-[var(--text-muted)]">
                                {r.market === "KR" ? "한국" : "해외"} {r.category}
                            </div>
                            {/* 앵커 텍스트에 핵심 키워드를 담는다 — 내부 링크가 곧 순위 신호다 */}
                            <div className="mt-1 text-[14px] font-bold leading-snug text-[var(--text-primary)]">
                                {searchName(r)} 실시간 가격
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/stocks"
                    className="mt-4 inline-block text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--color-up)]"
                >
                    주식 토큰 실시간 가격 전체 보기 →
                </Link>
            </section>

            <p className="mt-14 px-1 text-[12px] leading-[1.7] text-[var(--text-muted)]">
                본 페이지의 시세는 바이낸스 선물 시장 데이터로, {token.koreanName}의 정규장 주가나
                공식 시세가 아닙니다. 무기한 선물은 레버리지와 청산 위험이 있는 고위험 파생상품이며
                국가별로 거래가 제한될 수 있습니다. 본 정보는 투자 권유가 아니며 투자 판단과 그
                결과에 대한 책임은 이용자 본인에게 있습니다.
            </p>
        </main>
    );
}
