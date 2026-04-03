"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/shared/hooks/useTheme";

export function SeoFooter() {
    const isLight  = useTheme();
    const pathname = usePathname();
    const isEn     = pathname.startsWith("/en/");

    const borderColor   = isLight ? "border-neutral-200"  : "border-neutral-800";
    const cardBg        = isLight ? "bg-white border border-neutral-200" : "bg-neutral-900 border border-neutral-800";
    const cardHover     = isLight ? "hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300" : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-neutral-700";
    const titleColor    = isLight ? "text-neutral-900"    : "text-neutral-100";
    const bodyColor     = isLight ? "text-neutral-500"    : "text-neutral-400";
    const labelColor    = isLight ? "text-neutral-400"    : "text-neutral-600";
    const subTitleColor = isLight ? "text-neutral-700"    : "text-neutral-200";
    const linkColor     = isLight ? "text-teal-600 hover:text-teal-500" : "text-teal-400 hover:text-teal-300";
    const moreColor     = isLight ? "text-neutral-400 hover:text-teal-600" : "text-neutral-500 hover:text-teal-400";
    const taglineColor  = isLight ? "text-neutral-400"    : "text-neutral-600";
    const pillBg        = isLight ? "bg-neutral-100 text-neutral-500 border border-neutral-200" : "bg-neutral-800 text-neutral-400 border border-neutral-800";
    const emailBtnClass = isLight
        ? "inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-all text-[11px] text-neutral-600 cursor-pointer"
        : "inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750 transition-all text-[11px] text-neutral-300 cursor-pointer";

    const GuideLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
        <Link href={href} className={`group flex items-center justify-between py-1.5 text-[11px] transition-colors ${linkColor}`}>
            <span>{children}</span>
            <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );

    const tags = isEn
        ? ["Liquidations", "Whale Trades", "Heatmap", "Kimchi Premium", "Sim Trading", "Funding Rate", "Chart Analysis", "Rankings", "Free"]
        : ["실시간 청산", "고래 거래", "트리맵", "김치프리미엄", "모의투자", "펀딩비", "차트분석", "코인랭킹", "무료"];

    return (
        <section aria-labelledby="seo-footer-heading" className={`border-t ${borderColor} mt-5`}>
            <div className="mx-auto w-full max-w-screen-xl px-5 py-10">

                <div className="flex items-start gap-4 mb-8">
                    <Image
                        src={isLight ? "/favicon-light.png" : "/favicon.png"}
                        alt="TradeHub logo"
                        width={40} height={40}
                        className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h2 id="seo-footer-heading" className={`text-sm font-bold leading-tight mb-1 ${titleColor}`}>
                            TradeHub
                        </h2>
                        <p className={`text-xs leading-relaxed mb-3 ${bodyColor}`}>
                            {isEn ? "All-in-one dashboard for crypto traders" : "코인 트레이더를 위한 올인원 대시보드"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <span key={tag} className={`text-[9px] font-medium px-2 py-[3px] rounded-full ${pillBg}`}>{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

                    <article className={`rounded-2xl p-5 transition-all duration-200 ${cardBg} ${cardHover}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-3 ${labelColor}`}>
                            {isEn ? "Real-time Data" : "실시간 데이터"}
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            {isEn ? "Liquidations · Whale Trades" : "실시간 청산 · 고래 거래"}
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            {isEn
                                ? "Track Binance futures liquidations and whale trades over $50K to read market flow in real time."
                                : "바이낸스 선물 실시간 청산과 $50K 이상 고래 거래를 추적해 시장 흐름을 파악하세요."}
                        </p>
                    </article>

                    <article className={`rounded-2xl p-5 transition-all duration-200 ${cardBg} ${cardHover}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-3 ${labelColor}`}>
                            {isEn ? "Market Analysis" : "시장 분석"}
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            {isEn ? "Heatmap · Kimchi Premium · Fear & Greed" : "트리맵 · 김프 · 공포탐욕"}
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            {isEn
                                ? "150-coin volume heatmap, Kimchi Premium, and Fear & Greed Index — market sentiment at a glance."
                                : "150개 코인 거래량 트리맵, 김치프리미엄, 공포탐욕지수로 시장 심리를 한눈에 확인하세요."}
                        </p>
                        <div className={`mt-3 pt-3 border-t flex flex-col gap-0.5 ${isLight ? "divide-neutral-100 border-neutral-100" : "divide-neutral-800 border-neutral-800"}`}>
                            <GuideLink href="/ranking">{isEn ? "Coin Market Cap Rankings" : "코인 시가총액 순위"}</GuideLink>
                            <GuideLink href="/funding">{isEn ? "Funding Rate Rankings" : "코인 펀딩비 순위"}</GuideLink>
                            <GuideLink href={isEn ? "/en/analysis" : "/analysis"}>{isEn ? "Chart Technical Analysis" : "차트 기술 분석"}</GuideLink>
                        </div>
                    </article>

                    <article className={`rounded-2xl p-5 transition-all duration-200 ${cardBg} ${cardHover}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-3 ${labelColor}`}>
                            {isEn ? "Free Practice" : "무료 연습"}
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            <Link href="/trading" className={`transition-colors ${isLight ? "hover:text-teal-600" : "hover:text-teal-400"}`}>
                                {isEn ? "Bitcoin Sim Trading" : "비트코인 모의투자"}
                            </Link>
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            {isEn ? (
                                <>Practice long/short with up to 125x leverage on real-time Binance prices — completely free.</>
                            ) : (
                                <>실시간 바이낸스 가격 기반{" "}<Link href="/trading" className={`transition-colors ${linkColor}`}>모의투자</Link>로 롱/숏, 최대 125배 레버리지를 무료로 연습하세요.</>
                            )}
                        </p>
                    </article>

                    <article className={`rounded-2xl p-5 transition-all duration-200 ${cardBg} ${cardHover}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-3 ${labelColor}`}>
                            {isEn ? "Trading Guide" : "투자 가이드"}
                        </div>
                        <ul className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800"}`}>
                            <li><GuideLink href="/guide/kimchi-premium">{isEn ? "What is Kimchi Premium?" : "김치프리미엄이란?"}</GuideLink></li>
                            <li><GuideLink href="/guide/fear-greed-index">{isEn ? "How to Read Fear & Greed" : "공포탐욕지수 보는법"}</GuideLink></li>
                            <li><GuideLink href="/guide/bitcoin-paper-trading">{isEn ? "How to Sim Trade Bitcoin" : "비트코인 모의투자 하는법"}</GuideLink></li>
                        </ul>
                        <div className="pt-2">
                            <Link href="/guide" className={`group flex items-center gap-1 text-[10px] font-medium transition-colors ${moreColor}`}>
                                {isEn ? "All Guides" : "전체 가이드"}
                                <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </article>

                    <article className={`rounded-2xl p-5 transition-all duration-200 ${cardBg} ${cardHover}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-3 ${labelColor}`}>Contact</div>
                        <p className={`text-[11px] leading-relaxed ${bodyColor} mb-1`}>
                            {isEn ? "Send us feedback or bug reports." : "피드백이나 버그 제보를 보내주세요."}
                        </p>
                        <a href="mailto:whird398@naver.com" className={emailBtnClass}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="whitespace-nowrap">whird398@naver.com</span>
                        </a>
                    </article>

                </div>

                <div className={`mt-8 pt-5 border-t ${borderColor} flex flex-col gap-1 md:flex-row md:items-center md:justify-between`}>
                    <p className={`text-[11px] leading-relaxed ${taglineColor}`}>
                        {isEn ? (
                            <>TradeHub is a crypto trader dashboard offering real-time liquidations, whale trades, heatmap, funding rates, news, and{" "}
                            <Link href="/trading" className={`transition-colors ${moreColor}`}>Bitcoin sim trading</Link> — all in one place.</>
                        ) : (
                            <>TradeHub는 실시간 청산·고래 거래·트리맵·김프·공포탐욕지수·뉴스·채팅·{" "}
                            <Link href="/trading" className={`transition-colors ${moreColor}`}>비트코인 모의투자</Link>를 한 화면에서 제공하는 코인 트레이더 대시보드입니다.</>
                        )}
                    </p>
                    <span className={`text-[11px] shrink-0 md:ml-4 ${taglineColor}`}>© 2026 TradeHub</span>
                </div>

            </div>
        </section>
    );
}
