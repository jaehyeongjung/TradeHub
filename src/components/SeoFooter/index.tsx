"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SeoFooter() {
    const [isLight, setIsLight] = useState(true);

    useEffect(() => {
        const html = document.documentElement;
        setIsLight(html.classList.contains("light"));
        const observer = new MutationObserver(() => {
            setIsLight(html.classList.contains("light"));
        });
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const borderColor = isLight ? "border-neutral-200" : "border-neutral-800";
    const cardBg = isLight
        ? "bg-white border border-neutral-200 shadow-sm"
        : "bg-neutral-900 border border-neutral-800";
    const titleColor = isLight ? "text-neutral-900" : "text-neutral-100";
    const bodyColor = isLight ? "text-neutral-500" : "text-neutral-400";
    const labelColor = isLight ? "text-neutral-400" : "text-neutral-600";
    const subTitleColor = isLight ? "text-neutral-700" : "text-neutral-200";
    const linkColor = isLight
        ? "text-teal-600 hover:text-teal-500"
        : "text-teal-400 hover:text-teal-300";
    const moreColor = isLight
        ? "text-neutral-400 hover:text-teal-600"
        : "text-neutral-500 hover:text-teal-400";
    const taglineColor = isLight ? "text-neutral-400" : "text-neutral-600";

    return (
        <section
            aria-labelledby="seo-footer-heading"
            className={`border-t ${borderColor} mt-5`}
        >
            <div className="mx-auto w-full max-w-screen-xl px-5 py-10">

                {/* 상단: 로고 + 브랜드 설명 */}
                <div className="flex items-start gap-3 mb-8">
                    <Image
                        src={isLight ? "/favicon-light.png" : "/favicon.png"}
                        alt="TradeHub 로고"
                        width={36}
                        height={36}
                        className="mt-0.5 flex-shrink-0"
                    />
                    <div>
                        <h2
                            id="seo-footer-heading"
                            className={`text-sm font-bold leading-tight ${titleColor}`}
                        >
                            TradeHub
                        </h2>
                        <p className={`text-xs mt-1 leading-relaxed ${bodyColor}`}>
                            코인 트레이더를 위한 올인원 대시보드 — 트리맵 · 실시간 청산 · 고래 거래 · 모의투자를 한 화면에서
                        </p>
                    </div>
                </div>

                {/* 5열 카드 그리드 */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

                    <article className={`rounded-2xl p-5 ${cardBg}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${labelColor}`}>
                            실시간 데이터
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            실시간 청산 · 고래 거래
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            바이낸스 선물 실시간 청산과 $50K 이상 고래 거래를 실시간으로 추적하여 시장 흐름을 파악하세요.
                        </p>
                    </article>

                    <article className={`rounded-2xl p-5 ${cardBg}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${labelColor}`}>
                            시장 분석
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            트리맵 · 김프 · 공포탐욕
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            150개 코인 거래량 트리맵, 김치프리미엄, 공포탐욕지수로 시장 심리를 한눈에 확인하세요.
                        </p>
                    </article>

                    <article className={`rounded-2xl p-5 ${cardBg}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${labelColor}`}>
                            무료 연습
                        </div>
                        <h3 className={`text-xs font-bold mb-2 leading-snug ${subTitleColor}`}>
                            <Link href="/trading" className={`transition-colors ${isLight ? "hover:text-teal-600" : "hover:text-teal-400"}`}>
                                비트코인 모의투자
                            </Link>
                        </h3>
                        <p className={`text-[11px] leading-relaxed ${bodyColor}`}>
                            실시간 바이낸스 가격 기반{" "}
                            <Link href="/trading" className={`transition-colors ${linkColor}`}>
                                비트코인 모의투자
                            </Link>
                            로 롱/숏, 최대 125배 레버리지를 무료로 연습하세요.
                        </p>
                    </article>

                    <article className={`rounded-2xl p-5 ${cardBg}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${labelColor}`}>
                            투자 가이드
                        </div>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/guide/kimchi-premium" className={`text-[11px] transition-colors ${linkColor}`}>
                                    김치프리미엄이란?
                                </Link>
                            </li>
                            <li>
                                <Link href="/guide/fear-greed-index" className={`text-[11px] transition-colors ${linkColor}`}>
                                    공포탐욕지수 보는법
                                </Link>
                            </li>
                            <li>
                                <Link href="/guide/bitcoin-paper-trading" className={`text-[11px] transition-colors ${linkColor}`}>
                                    비트코인 모의투자 하는법
                                </Link>
                            </li>
                            <li className="pt-1">
                                <Link href="/guide" className={`text-[11px] transition-colors ${moreColor}`}>
                                    전체 가이드 보기 →
                                </Link>
                            </li>
                        </ul>
                    </article>

                    <article className={`rounded-2xl p-5 ${cardBg}`}>
                        <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${labelColor}`}>
                            Contact
                        </div>
                        <div className="space-y-1">
                            <p className={`text-[10px] ${labelColor}`}>이메일</p>
                            <a
                                href="mailto:whird398@naver.com"
                                className={`text-[11px] block transition-colors whitespace-nowrap ${linkColor}`}
                            >
                                whird398@naver.com
                            </a>
                        </div>
                        <p className={`mt-3 text-[10px] leading-relaxed ${taglineColor}`}>
                            피드백이나 버그 제보 환영합니다.
                        </p>
                    </article>
                </div>

                {/* 하단 각주 + 저작권 */}
                <div className={`mt-8 pt-5 border-t ${borderColor} flex flex-col gap-1 md:flex-row md:items-center md:justify-between`}>
                    <p className={`text-[11px] leading-relaxed ${taglineColor}`}>
                        TradeHub는 실시간 청산·고래 거래·트리맵·김프·공포탐욕지수·뉴스·채팅·{" "}
                        <Link href="/trading" className={`transition-colors ${moreColor}`}>
                            비트코인 모의투자
                        </Link>
                        를 한 화면에서 제공하는 코인 트레이더 대시보드입니다.
                    </p>
                    <span className={`text-[11px] shrink-0 md:ml-4 ${taglineColor}`}>© 2025 TradeHub</span>
                </div>
            </div>
        </section>
    );
}
