import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "코인 선물 모의 트레이딩 - 무료 비트코인 연습 | TradeHub",
    description:
        "비트코인 모의투자를 무료로 시작하세요. TradeHub에서 실시간 바이낸스 가격 기반 비트코인 모의투자, 코인 선물 연습, 최대 125배 레버리지 롱/숏 포지션을 가상 자금으로 안전하게 연습할 수 있습니다.",
    keywords: [
        "비트코인 모의투자",
        "코인 모의투자",
        "비트코인 선물 연습",
        "코인 데모 트레이딩",
        "가상 코인 거래",
        "비트코인 선물 모의거래",
        "코인 선물 연습",
        "레버리지 연습",
        "선물 모의거래",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "코인 선물 모의 트레이딩 - 무료 비트코인 연습 | TradeHub",
        siteName: "TradeHub",
        description:
            "비트코인 모의투자를 무료로 시작하세요. 실시간 바이낸스 가격 기반 코인 선물 모의거래, 최대 125배 레버리지, 롱/숏 포지션을 가상 자금으로 연습.",
        images: [
            {
                url: "/main-Image.png",
                width: 1200,
                height: 630,
                alt: "TradeHub 비트코인 모의투자 플랫폼",
            },
        ],
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 선물 모의 트레이딩 - 무료 비트코인 연습 | TradeHub",
        description:
            "비트코인 모의투자를 무료로 시작하세요. 실시간 바이낸스 가격 기반 코인 선물 모의거래, 최대 125배 레버리지, 롱/숏 포지션을 가상 자금으로 연습.",
        images: ["/main-Image.png"],
    },
};

const WEB_APP_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TradeHub 비트코인 모의투자",
    url: SITE,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    description:
        "비트코인 모의투자 플랫폼. 실시간 바이낸스 가격 기반으로 가상 자금 10,000 USDT로 코인 선물 모의거래를 연습할 수 있습니다.",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
    },
    featureList: [
        "비트코인 모의투자",
        "코인 선물 모의거래",
        "최대 125배 레버리지",
        "롱/숏 포지션",
        "지정가/시장가/스탑마켓 주문",
        "익절/손절 설정",
        "교차/격리 마진 모드",
        "실시간 바이낸스 가격 연동",
    ],
};

const HOWTO_JSONLD = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "비트코인 모의투자 시작하는 방법",
    description:
        "TradeHub에서 비트코인 모의투자를 시작하는 단계별 가이드입니다.",
    step: [
        {
            "@type": "HowToStep",
            position: 1,
            name: "TradeHub 접속",
            text: "TradeHub 웹사이트에 접속하면 가상 자금 10,000 USDT가 자동 지급됩니다. 가입 없이 바로 체험할 수 있습니다.",
        },
        {
            "@type": "HowToStep",
            position: 2,
            name: "코인 선택 및 주문",
            text: "원하는 코인을 선택하고, 레버리지·마진 모드를 설정한 뒤 롱 또는 숏 포지션을 주문합니다.",
        },
        {
            "@type": "HowToStep",
            position: 3,
            name: "포지션 관리",
            text: "실시간 손익을 확인하며 익절/손절을 설정하고, 적절한 타이밍에 포지션을 종료합니다.",
        },
    ],
};

const FAQ_JSONLD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "로그인 없이 이용할 수 있나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "네, 가입이나 로그인 없이 접속 즉시 체험할 수 있습니다. 익명 세션으로 자동 시작되며, 브라우저를 닫아도 세션이 유지됩니다. 단, 브라우저 데이터를 삭제하면 기록이 사라지므로 로그인으로 영구 보관할 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "비트코인 모의투자는 무료인가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "네, TradeHub의 비트코인 모의투자는 완전 무료입니다. 접속 즉시 가상 자금 10,000 USDT로 코인 선물 모의거래를 시작할 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "어떤 코인으로 모의투자할 수 있나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "비트코인(BTC), 이더리움(ETH) 등 바이낸스 선물에 상장된 주요 코인으로 모의투자할 수 있습니다. 실시간 가격이 자동으로 반영됩니다.",
            },
        },
        {
            "@type": "Question",
            name: "레버리지는 최대 몇 배까지 가능한가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "TradeHub 비트코인 모의투자에서는 최대 125배 레버리지까지 설정할 수 있습니다. 1배부터 125배까지 자유롭게 조절하며 레버리지 거래를 연습할 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "모의투자 자금이 소진되면 어떻게 하나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "가상 자금이 모두 소진되면 자금을 리셋하여 다시 10,000 USDT로 시작할 수 있습니다. 횟수 제한 없이 무료로 이용 가능합니다.",
            },
        },
    ],
};

export default function SimTradingPage() {
    return (
        <>
            <Script id="ld-sim-app" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(WEB_APP_JSONLD)}
            </Script>
            <Script id="ld-sim-howto" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(HOWTO_JSONLD)}
            </Script>
            <Script id="ld-sim-faq" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(FAQ_JSONLD)}
            </Script>

            <main className="mx-auto max-w-screen-lg px-5 py-16 text-zinc-200 md:py-24">
                {/* Hero */}
                <section className="text-center pt-8 md:pt-16">
                    <p
                        className="landing-up inline-block rounded-full bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-400 ring-1 ring-teal-500/20"
                        style={{ animationDelay: "0s" }}
                    >
                        무료 · 가입 불필요 · 실시간 바이낸스 연동
                    </p>
                    <h1
                        className="landing-up mt-6 text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-tight"
                        style={{ animationDelay: "0.1s" }}
                    >
                        코인 선물,
                        <br />
                        <span className="text-teal-400">실전처럼</span> 연습하세요
                    </h1>
                    <p
                        className="landing-up mt-5 text-base text-zinc-400 md:text-lg max-w-xl mx-auto"
                        style={{ animationDelay: "0.2s" }}
                    >
                        바이낸스 실시간 시세 기반, 가상자금 10,000 USDT로
                        <br className="hidden md:block" />
                        최대 125배 레버리지 선물거래를 연습할 수 있습니다
                    </p>
                    <div
                        className="landing-up mt-10"
                        style={{ animationDelay: "0.35s" }}
                    >
                        <Link
                            href="/trading"
                            className="landing-cta-glow inline-block rounded-xl bg-teal-500 px-10 py-4 text-base font-semibold text-white transition hover:bg-teal-400"
                        >
                            지금 시작하기
                        </Link>
                    </div>
                    <p
                        className="landing-up mt-5 text-sm text-zinc-500"
                        style={{ animationDelay: "0.45s" }}
                    >
                        가입 없이 바로 체험 · 로그인하면 데이터 영구 보관
                    </p>
                </section>

                {/* 핵심 기능 — 큰 카드 3개 */}
                <section className="mt-28">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        주요 기능
                    </h2>
                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        <div
                            className="landing-card rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800 landing-up"
                            style={{ animationDelay: "0.1s" }}
                        >
                            <div className="landing-icon-box flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                                    <path d="M7 17l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"/>
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">
                                롱/숏 포지션
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                가격 상승과 하락 양방향으로 포지션을 열고 닫으며
                                선물거래 전략을 자유롭게 연습할 수 있습니다.
                            </p>
                        </div>
                        <div
                            className="landing-card rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800 landing-up"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <div className="landing-icon-box flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-teal-400">
                                    <path d="M3 20h4V10H3v10zm6 0h4V4H9v16zm6 0h4v-8h-4v8z" fill="currentColor"/>
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">
                                최대 125배 레버리지
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                1배부터 125배까지 자유롭게 조절하며
                                리스크 관리 감각을 키울 수 있습니다.
                            </p>
                        </div>
                        <div
                            className="landing-card rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800 landing-up"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <div className="landing-icon-box flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                                    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">
                                실시간 바이낸스 가격
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                바이낸스 실시간 시세가 자동 반영되어
                                실제 시장과 동일한 환경에서 거래합니다.
                            </p>
                        </div>
                    </div>

                    {/* 부가 기능 — 뱃지 리스트 */}
                    <div className="mt-5 flex flex-wrap gap-2">
                        {[
                            "지정가 · 시장가 · 스탑마켓 주문",
                            "TP/SL 익절·손절",
                            "교차/격리 마진 모드",
                        ].map((label) => (
                            <span
                                key={label}
                                className="landing-badge rounded-full bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300 ring-1 ring-zinc-800"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </section>

                {/* 익명 vs 로그인 비교 */}
                <section className="mt-24">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        가입 없이 체험, 로그인으로 영구 보관
                    </h2>
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <div className="landing-card rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                            <h3 className="text-lg font-semibold text-white">
                                익명 체험
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-zinc-500">•</span>
                                    접속 즉시 시작 — 가입 절차 없음
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-zinc-500">•</span>
                                    브라우저에 세션 자동 유지
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-zinc-500">•</span>
                                    브라우저 데이터 삭제 시 기록 소실
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-7">
                            <h3 className="text-lg font-semibold text-white">
                                로그인
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-teal-400">✓</span>
                                    간편 회원가입
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-teal-400">✓</span>
                                    기기·브라우저 무관 데이터 유지
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0 text-teal-400">✓</span>
                                    거래 기록 영구 보관
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 시작 방법 — 3단계 */}
                <section className="mt-24">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        시작 방법
                    </h2>
                    <ol className="mt-8 space-y-6">
                        <li className="flex gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-400">
                                1
                            </span>
                            <div>
                                <h3 className="font-semibold text-white">
                                    TradeHub 접속
                                </h3>
                                <p className="mt-1 text-sm text-zinc-400">
                                    접속하면 가상 자금 10,000 USDT가 자동 지급됩니다.
                                    가입 없이 바로 시작할 수 있습니다.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-400">
                                2
                            </span>
                            <div>
                                <h3 className="font-semibold text-white">
                                    코인 선택 & 주문
                                </h3>
                                <p className="mt-1 text-sm text-zinc-400">
                                    BTC, ETH 등 원하는 코인을 선택하고 레버리지·마진 모드를
                                    설정한 뒤 롱 또는 숏 포지션을 주문합니다.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-400">
                                3
                            </span>
                            <div>
                                <h3 className="font-semibold text-white">
                                    포지션 관리
                                </h3>
                                <p className="mt-1 text-sm text-zinc-400">
                                    실시간 손익을 확인하며 익절/손절을 설정하고,
                                    적절한 타이밍에 포지션을 종료합니다.
                                </p>
                            </div>
                        </li>
                    </ol>
                </section>

                {/* FAQ */}
                <section className="mt-24">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        자주 묻는 질문
                    </h2>
                    <dl className="mt-8 space-y-6">
                        <div>
                            <dt className="font-semibold text-white">
                                로그인 없이 이용할 수 있나요?
                            </dt>
                            <dd className="mt-2 text-sm text-zinc-400">
                                네, 가입 없이 접속 즉시 체험할 수 있습니다.
                                익명 세션으로 자동 시작되며, 브라우저를 닫아도 세션이 유지됩니다.
                                <br />
                                단, 브라우저 데이터를 삭제하면 기록이 사라지므로
                                로그인하면 영구 보관할 수 있습니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                완전 무료인가요?
                            </dt>
                            <dd className="mt-2 text-sm text-zinc-400">
                                네, 모든 기능이 무료입니다.
                                접속 즉시 가상 자금 10,000 USDT로 시작할 수 있습니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                어떤 코인으로 거래할 수 있나요?
                            </dt>
                            <dd className="mt-2 text-sm text-zinc-400">
                                비트코인(BTC), 이더리움(ETH) 등 바이낸스 선물에 상장된 주요
                                코인으로 모의투자할 수 있습니다. 실시간 가격이 자동 반영됩니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                레버리지는 최대 몇 배까지 가능한가요?
                            </dt>
                            <dd className="mt-2 text-sm text-zinc-400">
                                최대 125배까지 설정할 수 있습니다. 1배부터 125배까지
                                자유롭게 조절하며 레버리지 거래를 연습할 수 있습니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                자금이 소진되면 어떻게 하나요?
                            </dt>
                            <dd className="mt-2 text-sm text-zinc-400">
                                자금을 리셋하여 다시 10,000 USDT로 시작할 수 있습니다.
                                횟수 제한 없이 무료로 이용 가능합니다.
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* 하단 CTA */}
                <section className="mt-24 text-center">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        가입 없이, 지금 바로 시작하세요
                    </h2>
                    <p className="mt-4 text-zinc-400">
                        접속하면 10,000 USDT가 자동 지급됩니다.
                    </p>
                    <Link
                        href="/trading"
                        className="mt-8 inline-block rounded-xl bg-teal-500 px-10 py-4 text-base font-semibold text-white transition hover:bg-teal-400"
                    >
                        모의투자 시작하기
                    </Link>
                </section>

                {/* 내부 링크 */}
                <nav className="mt-16 border-t border-zinc-800 pt-8">
                    <p className="text-sm text-zinc-500">
                        <Link href="/dashboard" className="text-teal-400 hover:underline">
                            TradeHub 메인 대시보드
                        </Link>
                        {" · "}
                        실시간 청산 · 고래 거래 · 트리맵 · 김치프리미엄 · 공포탐욕지수 · 코인 뉴스 · 비트코인 모의투자
                    </p>
                </nav>
            </main>
        </>
    );
}
