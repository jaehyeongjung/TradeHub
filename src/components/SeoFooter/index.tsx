"use client";

import Image from "next/image";
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

    return (
        <section
            aria-labelledby="seo-footer-heading"
            className="border-t border-zinc-800 mt-5"
        >
            <div className="mx-auto w-full max-w-screen-xl px-5 py-8 text-zinc-300 ">
                <Image
                    src={isLight ? "/favicon-light.png" : "/favicon.png"}
                    alt="TradeHub 로고"
                    width={80}
                    height={80}
                    className="ml-[-18px]"
                />
                <h2
                    id="seo-footer-heading"
                    className="text-base md:text-xl font-semibold text-white"
                >
                    TradeHub, 코인 트레이더를 위한 올인원 대시보드
                    <br></br>트리맵 · 실시간 청산 · 고래 거래를 한 화면에서
                </h2>
                <p className="mt-5  text-sm md:text-base">
                    TradeHub는 코인 트레이더를 위한 통합 대시보드입니다.
                    <br />
                    <strong className="font-medium">
                        150개 코인 거래량 트리맵
                    </strong>
                    으로 시장을 한눈에 파악하고,
                    <strong className="font-medium"> 실시간 청산</strong>,
                    <strong className="font-medium"> 고래 거래</strong>,
                    김치프리미엄, 공포탐욕지수, 뉴스, 실시간 채팅까지 제공합니다.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3">
                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            실시간 청산 · 고래 거래
                        </h3>
                        <p className="mt-2 text-sm">
                            바이낸스 선물 실시간 청산과 $50K 이상 고래 거래를
                            실시간으로 추적하여 시장 흐름을 파악하세요.
                        </p>
                        <div className="mt-3"></div>
                    </article>

                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            트리맵 · 김프 · 공포탐욕
                        </h3>
                        <p className="mt-2 text-sm">
                            150개 코인 거래량 트리맵, 김치프리미엄,
                            공포탐욕지수로 시장 심리를 한눈에 확인하세요.
                        </p>
                        <div className="mt-3 space-x-3"></div>
                    </article>
                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            Contact
                        </h3>
                        <ul className="mt-2 text-sm leading-7">
                            <li>
                                이메일:&nbsp;
                                <a
                                    href="mailto:whird398@naver.com"
                                    className="text-teal-400 hover:underline"
                                >
                                    whird398@naver.com
                                </a>
                            </li>

                            {/* 필요 시 내부 문의 페이지가 있으면 활성화 */}
                            {/* <li>
                    <Link href="/contact" className="text-teal-400 hover:underline">
                    문의/제휴 폼 열기
                    </Link>
                </li> */}
                        </ul>
                        <p className="mt-2 text-xs text-zinc-500">
                            피드백이나 버그 제보 환영합니다. 가능한 빠르게
                            답변드리겠습니다.
                        </p>
                    </article>
                </div>

                {/* 작은 각주/브랜딩 */}
                <p className="mt-8 text-xs text-zinc-500">
                    TradeHub는 실시간 청산·고래 거래·트리맵·김프·공포탐욕지수·뉴스·채팅을
                    한 화면에서 제공하는 코인 트레이더 대시보드입니다.
                </p>
            </div>
        </section>
    );
}
