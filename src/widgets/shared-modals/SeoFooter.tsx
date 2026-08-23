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
    const titleColor    = isLight ? "text-neutral-900"    : "text-neutral-100";
    const bodyColor     = isLight ? "text-neutral-500"    : "text-neutral-400";
    const labelColor    = isLight ? "text-neutral-400"    : "text-neutral-600";
    const moreColor     = isLight ? "text-neutral-400 hover:text-teal-600" : "text-neutral-500 hover:text-teal-400";
    const taglineColor  = isLight ? "text-neutral-400"    : "text-neutral-600";
    const pillBg        = isLight ? "bg-neutral-100 text-neutral-500 border border-neutral-200" : "bg-neutral-800 text-neutral-400 border border-neutral-800";
    const emailBtnClass = isLight
        ? "inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-all text-[11px] text-neutral-600 cursor-pointer"
        : "inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750 transition-all text-[11px] text-neutral-300 cursor-pointer";


    const tags = isEn
        ? ["Liquidations", "Whale Trades", "Heatmap", "Kimchi Premium", "Sim Trading", "Funding Rate", "Chart Analysis", "Rankings", "Free"]
        : ["실시간 청산", "고래 거래", "트리맵", "김치프리미엄", "모의투자", "펀딩비", "차트분석", "코인랭킹", "무료"];

    const footerBg = isLight ? "bg-white" : "bg-black";

    return (
        <section aria-labelledby="seo-footer-heading" className={`border-t ${borderColor} mt-5 ${footerBg}`}>
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

                <div>
                    <h3 className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${labelColor}`}>
                        Contact
                    </h3>
                    <a href="mailto:whird398@naver.com" className={emailBtnClass}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="whitespace-nowrap">whird398@naver.com</span>
                    </a>
                </div>

                <div className={`mt-8 pt-5 border-t ${borderColor} flex flex-col gap-1 md:flex-row md:items-center md:justify-between`}>
                    <p className={`text-[11px] leading-relaxed ${taglineColor}`}>
                        {isEn ? (
                            <>TradeHub is a crypto trader dashboard offering real-time liquidations, whale trades, heatmap, funding rates, news, and{" "}
                            <Link href="/en/trading" className={`transition-colors ${moreColor}`}>Bitcoin sim trading</Link> — all in one place.</>
                        ) : (
                            <>TradeHub는 실시간 청산·고래 거래·트리맵·김프·공포탐욕지수·뉴스·채팅·{" "}
                            <Link href="/trading" className={`transition-colors ${moreColor}`}>비트코인 모의투자</Link>를 한 화면에서 제공하는 코인 트레이더 대시보드입니다.</>
                        )}
                    </p>
                    <div className={`flex items-center gap-3 shrink-0 md:ml-4 text-[11px] ${taglineColor}`}>
                        {/* 소개 페이지는 한국어만 있다 — 운영자·데이터 출처·문의처를 밝히는 곳 */}
                        {!isEn && (
                            <>
                                <Link href="/about" className="hover:text-zinc-300 transition-colors whitespace-nowrap">
                                    소개·문의
                                </Link>
                                <span>·</span>
                            </>
                        )}
                        <Link href={isEn ? "/en/privacy" : "/privacy"} className="hover:text-zinc-300 transition-colors whitespace-nowrap">
                            {isEn ? "Privacy Policy" : "개인정보처리방침"}
                        </Link>
                        <span>·</span>
                        <Link href={isEn ? "/en/terms" : "/terms"} className="hover:text-zinc-300 transition-colors whitespace-nowrap">
                            {isEn ? "Terms of Service" : "이용약관"}
                        </Link>
                        <span>·</span>
                        <span>© 2026 TradeHub</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
