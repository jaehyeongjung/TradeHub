import type { Metadata } from "next";
import Link from "next/link";
import { stockTokens } from "@/shared/lib/stock-tokens";
import { getAllTradfiRows, type TradfiRow } from "@/shared/lib/stock-tokens.server";
import { getUsdKrw, formatKrw } from "@/shared/lib/fx";
import { getMarketStatus } from "@/shared/lib/market-hours";
import { AdSenseUnit } from "@/shared/ui/AdSenseUnit";

export const revalidate = 60;

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

function fmtUsd(n: number) {
    return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function fmtCompactKrw(usd: number, usdKrw: number | null) {
    if (usdKrw === null) {
        if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
        if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
        return `$${usd.toFixed(0)}`;
    }
    const krw = usd * usdKrw;
    if (krw >= 1e12) return `${(krw / 1e12).toFixed(2)}조`;
    if (krw >= 1e8) return `${(krw / 1e8).toFixed(0)}억`;
    return `${(krw / 1e4).toFixed(0)}만`;
}

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
                    <div className="truncate text-sm font-bold text-zinc-100">{name}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{row.base}</div>
                </div>
                <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                        isUp
                            ? "text-[#02C076] bg-[#02C076]/10"
                            : "text-[#F6465D] bg-[#F6465D]/10"
                    }`}
                >
                    {isUp ? "▲" : "▼"} {Math.abs(row.changePercent).toFixed(2)}%
                </span>
            </div>

            <div className="mt-3 text-lg font-extrabold tabular-nums text-white">{price}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-600">
                {usdKrw !== null && <span className="tabular-nums">{fmtUsd(row.price)}</span>}
                <span className="tabular-nums ml-auto">
                    거래 {fmtCompactKrw(row.quoteVolume, usdKrw)}
                </span>
            </div>
        </>
    );

    const cls =
        "block rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-zinc-800 transition-colors";

    return row.slug ? (
        <Link href={`/stocks/${row.slug}`} className={`${cls} hover:ring-[#02C076]/50`}>
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
        <main className="mx-auto max-w-4xl px-5 py-16 text-white">
            {[itemList, breadcrumb].map((item, i) => (
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
                    <li className="text-zinc-300">주식 토큰</li>
                </ol>
            </nav>

            <header>
                <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
                    주식 토큰 실시간 가격
                </h1>
                <p className="mt-3 text-zinc-400 leading-relaxed">
                    바이낸스는 삼성전자·SK하이닉스 같은 개별 주식의 가격을 추종하는 무기한 선물을
                    상장해 두고 있습니다. 증시가 문을 닫아도 24시간 거래되기 때문에,{" "}
                    <strong className="text-zinc-200">
                        장 마감 후와 주말에도 가격이 계속 움직입니다.
                    </strong>
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[krStatus, usStatus].map((s) => (
                        <div
                            key={s.marketName}
                            className="rounded-xl bg-zinc-900/60 p-4 ring-1 ring-zinc-800"
                        >
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        s.isOpen ? "bg-[#02C076]" : "bg-amber-400"
                                    }`}
                                />
                                {s.label}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                                {s.marketName} · {s.hours}
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            {korean.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold tracking-tight">한국 주식 토큰</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        한국거래소 정규장은 {krStatus.hours}입니다. 그 밖의 시간에도 아래 가격은
                        갱신됩니다.
                    </p>
                    <CardGrid rows={korean} usdKrw={usdKrw} />
                </section>
            )}

            <AdSenseUnit slot="7318540125" className="my-10" />

            {featured.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold tracking-tight">주요 해외 종목</h2>
                    <CardGrid rows={featured} usdKrw={usdKrw} />
                </section>
            )}

            {rest.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold tracking-tight">전체 종목</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        거래대금 순 · 총 {rows.length}개 종목
                    </p>
                    <CardGrid rows={rest} usdKrw={usdKrw} />
                </section>
            )}

            <section className="mt-16">
                <h2 className="text-xl font-bold tracking-tight">주식 토큰이란?</h2>
                <p className="mt-3 text-zinc-300 leading-relaxed">
                    주식 토큰(토큰화 주식)은 실제 주식이 아니라, 주가를 기초자산으로 삼는 USDT 표시
                    무기한 선물입니다. 주식을 직접 보유하는 것이 아니므로 배당과 의결권이 없고,
                    포지션을 유지하는 동안 8시간마다 펀딩비를 주고받습니다. 대신 정규장 시간에
                    묶이지 않아 24시간 거래가 가능합니다.
                </p>
                <p className="mt-3 text-zinc-300 leading-relaxed">
                    그래서 이 페이지의 가격은 해당 종목의 공식 시세나 정규장 종가가 아닙니다.
                    특히 장이 닫힌 시간에는 정규장 종가와 차이가 벌어질 수 있는데, 그 차이 자체가
                    &ldquo;마감 이후 나온 뉴스를 시장이 어떻게 받아들이고 있는가&rdquo;를 보여주는
                    참고 지표가 됩니다.
                </p>
            </section>

            <p className="mt-14 text-xs leading-relaxed text-zinc-600">
                본 페이지의 시세는 바이낸스 선물 시장 데이터이며, 각 종목의 공식 주가가 아닙니다.
                무기한 선물은 레버리지와 청산 위험이 있는 고위험 파생상품이고 국가별로 거래가
                제한될 수 있습니다. 본 정보는 투자 권유가 아니며 투자 판단과 그 결과에 대한 책임은
                이용자 본인에게 있습니다.
            </p>
        </main>
    );
}
