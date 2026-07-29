import type { Metadata } from "next";
import Link from "next/link";
import { stockTokens } from "@/shared/lib/stock-tokens";
import { getAllTradfiRows, type TradfiRow } from "@/shared/lib/stock-tokens.server";
import { getUsdKrw } from "@/shared/lib/fx";
import { fmtUsd, formatKrw, fmtCompactKrw as fmtCompactKrwShared } from "./format";
import { getMarketStatus } from "@/shared/lib/market-hours";
import { StocksFallbackGrid } from "./StocksFallbackGrid";
import { AdSenseUnit } from "@/shared/ui/AdSenseUnit";

export const revalidate = 60;
// 바이낸스는 미국 IP를 지역 차단한다. 서울 리전에서 실행해 시세 fetch가 막히지 않게 한다.
export const preferredRegion = "icn1";

const SITE = "https://www.tradehub.kr";

const TITLE = "주식 토큰 실시간 가격 — 삼성전자·SK하이닉스·테슬라 24시간 시세";
const DESCRIPTION =
    "바이낸스에 상장된 주식 토큰(토큰화 주식) 전 종목의 실시간 가격을 한눈에. 삼성전자, SK하이닉스, 현대차부터 테슬라, 엔비디아까지 증시가 문을 닫은 시간에도 24시간 거래되는 시세를 무료로 확인하세요.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        "주식 토큰",
        "토큰화 주식",
        "삼전 실시간주가",
        "삼성전자 토큰",
        "하이닉스 실시간가격",
        "테슬라 실시간",
        "엔비디아 실시간",
        "24시간 주식 거래",
        "야간 주가",
        "장 마감 후 주가",
    ],
    alternates: { canonical: `${SITE}/stocks` },
    openGraph: {
        title: `${TITLE} | TradeHub`,
        description: DESCRIPTION,
        url: `${SITE}/stocks`,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: `${TITLE} | TradeHub`,
        description: DESCRIPTION,
    },
};



/**
 * 모바일에서 4열 테이블은 가로 스크롤이 생겨 읽기 나쁘다.
 * 카드 한 장에 종목·가격·등락을 담고, 화면이 넓어지면 2~3열 그리드로 펼친다.
 */
function StockCard({ row, usdKrw }: { row: TradfiRow; usdKrw: number | null }) {
    const isUp = row.changePercent >= 0;
    const name = row.koreanName ?? row.base;
    const price = usdKrw === null ? fmtUsd(row.price) : formatKrw(row.price * usdKrw);

    const inner = (
        <>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[var(--text-primary)]">{name}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{row.base}</div>
                </div>
                <span
                    className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                        isUp
                            ? "text-[var(--color-up)] bg-[var(--color-up-muted)]"
                            : "text-[var(--color-down)] bg-[var(--color-down-muted)]"
                    }`}
                >
                    {isUp ? "▲" : "▼"} {Math.abs(row.changePercent).toFixed(2)}%
                </span>
            </div>

            <div className="mt-3 text-[19px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--text-primary)]">
                {price}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                {usdKrw !== null && <span className="tabular-nums">{fmtUsd(row.price)}</span>}
                <span className="tabular-nums ml-auto">
                    거래 {fmtCompactKrwShared(row.quoteVolume, usdKrw)}
                </span>
            </div>
        </>
    );

    const cls = "block rounded-2xl bg-[var(--surface-card)] p-4 ring-1 ring-[var(--border-subtle)] transition-colors";

    return row.slug ? (
        <Link href={`/stocks/${row.slug}`} className={`${cls} hover:ring-[var(--border-strong)]`}>
            {inner}
        </Link>
    ) : (
        <div className={cls}>{inner}</div>
    );
}

function CardGrid({ rows, usdKrw }: { rows: TradfiRow[]; usdKrw: number | null }) {
    return (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {rows.map((r) => (
                <StockCard key={r.symbol} row={r} usdKrw={usdKrw} />
            ))}
        </div>
    );
}

export default async function StocksHubPage() {
    const [rows, usdKrw] = await Promise.all([getAllTradfiRows(), getUsdKrw()]);
    const krStatus = getMarketStatus("KR");
    const usStatus = getMarketStatus("US");

    const korean = rows.filter((r) => r.isKorean);
    const featured = rows.filter((r) => r.slug && !r.isKorean);
    const rest = rows.filter((r) => !r.slug && !r.isKorean);

    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "바이낸스 주식 토큰 실시간 가격",
        itemListElement: stockTokens.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${t.koreanName} 토큰`,
            url: `${SITE}/stocks/${t.slug}`,
        })),
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "홈", item: SITE },
            { "@type": "ListItem", position: 2, name: "주식 토큰", item: `${SITE}/stocks` },
        ],
    };

    return (
        <main className="mx-auto max-w-2xl px-4 sm:px-5 pt-16 pb-20 text-[var(--text-primary)]">
            {[itemList, breadcrumb].map((item, i) => (
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
                    <li className="text-[var(--text-tertiary)]">주식 토큰</li>
                </ol>
            </nav>

            <header>
                <h1 className="text-[26px] font-extrabold tracking-[-0.02em] leading-tight">
                    주식 토큰 실시간 가격
                </h1>
                <p className="mt-3 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                    바이낸스는 삼성전자·SK하이닉스 같은 개별 주식의 가격을 추종하는 무기한 선물을
                    상장해 두고 있습니다. 증시가 문을 닫아도 24시간 거래되기 때문에,{" "}
                    <strong className="text-[var(--text-primary)]">
                        장 마감 후와 주말에도 가격이 계속 움직입니다.
                    </strong>
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[krStatus, usStatus].map((s) => (
                        <div
                            key={s.marketName}
                            className="rounded-2xl bg-[var(--surface-card)] p-4 ring-1 ring-[var(--border-subtle)]"
                        >
                            <div className="flex items-center gap-2 text-[13px] font-bold">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        s.isOpen ? "bg-[var(--color-accent)]" : "bg-amber-400"
                                    }`}
                                />
                                {s.label}
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                                {s.marketName} · {s.hours}
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            {/* 서버 fetch가 막혔을 때(배포 리전 지역 차단 등) 브라우저에서 직접 받아 채운다 */}
            {rows.length === 0 && <StocksFallbackGrid usdKrw={usdKrw} />}

            {korean.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight">한국 주식 토큰</h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                        한국거래소 정규장은 {krStatus.hours}입니다. 그 밖의 시간에도 아래 가격은
                        갱신됩니다.
                    </p>
                    <CardGrid rows={korean} usdKrw={usdKrw} />
                </section>
            )}

            <AdSenseUnit slot="7318540125" className="my-10" />

            {featured.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-lg font-bold tracking-tight">주요 해외 종목</h2>
                    <CardGrid rows={featured} usdKrw={usdKrw} />
                </section>
            )}

            {rest.length > 0 && (
                <section className="mt-12">
                    {/* 100개 넘는 카드를 한 번에 펼치면 모바일에서 스크롤이 끝나지 않는다.
                        details를 쓰면 JS 없이 접히고, 내용은 HTML에 남아 크롤러도 읽는다. */}
                    <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                            <span>
                                <span className="text-lg font-bold tracking-tight">전체 종목</span>
                                <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                                    거래대금 순 · 총 {rows.length}개 종목
                                </span>
                            </span>
                            <span className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[var(--surface-input)] px-3 text-[12px] font-bold text-[var(--text-secondary)]">
                                <span className="group-open:hidden">펼치기</span>
                                <span className="hidden group-open:inline">접기</span>
                                <span className="transition-transform duration-200 group-open:rotate-180" aria-hidden>
                                    ▾
                                </span>
                            </span>
                        </summary>
                        <CardGrid rows={rest} usdKrw={usdKrw} />
                    </details>
                </section>
            )}

            <section className="mt-16">
                <h2 className="text-lg font-bold tracking-tight">주식 토큰이란?</h2>
                <p className="mt-3 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                    주식 토큰(토큰화 주식)은 실제 주식이 아니라, 주가를 기초자산으로 삼는 USDT 표시
                    무기한 선물입니다. 주식을 직접 보유하는 것이 아니므로 배당과 의결권이 없고,
                    포지션을 유지하는 동안 8시간마다 펀딩비를 주고받습니다. 대신 정규장 시간에
                    묶이지 않아 24시간 거래가 가능합니다.
                </p>
                <p className="mt-3 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                    그래서 이 페이지의 가격은 해당 종목의 공식 시세나 정규장 종가가 아닙니다.
                    특히 장이 닫힌 시간에는 정규장 종가와 차이가 벌어질 수 있는데, 그 차이 자체가
                    &ldquo;마감 이후 나온 뉴스를 시장이 어떻게 받아들이고 있는가&rdquo;를 보여주는
                    참고 지표가 됩니다.
                </p>
            </section>

            <p className="mt-14 text-xs leading-relaxed text-[var(--text-muted)]">
                본 페이지의 시세는 바이낸스 선물 시장 데이터이며, 각 종목의 공식 주가가 아닙니다.
                무기한 선물은 레버리지와 청산 위험이 있는 고위험 파생상품이고 국가별로 거래가
                제한될 수 있습니다. 본 정보는 투자 권유가 아니며 투자 판단과 그 결과에 대한 책임은
                이용자 본인에게 있습니다.
            </p>
        </main>
    );
}
