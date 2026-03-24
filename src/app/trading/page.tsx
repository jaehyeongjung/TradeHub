import type { Metadata } from "next";
import Script from "next/script";
import TradingClient from "./TradingClient";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "코인 선물 모의투자 — 무료 비트코인 선물 거래 연습 | TradeHub",
    description:
        "가입 없이 10,000 USDT 가상 자금으로 비트코인 선물 모의거래. 롱/숏 포지션, 최대 125배 레버리지, 격리·교차 마진, TP/SL 주문까지 실전 그대로 무료 연습.",
    keywords: [
        "코인 선물 모의투자", "비트코인 선물 모의거래", "선물 모의거래 무료",
        "코인 레버리지 연습", "비트코인 레버리지 연습", "선물거래 처음 배우기",
        "코인 선물거래 방법", "롱 숏 차이 코인", "격리마진 교차마진 차이",
        "코인 청산이란", "TP SL 설정 방법", "선물거래 손절 자동",
        "바이낸스 선물 연습", "코인 선물 초보", "무료 모의투자 코인",
    ],
    alternates: { canonical: "/trading" },
    openGraph: {
        type: "website",
        url: `${SITE}/trading`,
        title: "코인 선물 모의투자 — 무료 비트코인 선물 거래 연습 | TradeHub",
        siteName: "TradeHub",
        description:
            "가입 없이 10,000 USDT 가상 자금으로 비트코인 선물 모의거래. 롱/숏 포지션, 최대 125배 레버리지, 격리·교차 마진, TP/SL 주문까지 실전 그대로 무료 연습.",
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 선물 모의투자 — 무료 비트코인 선물 거래 연습 | TradeHub",
        description:
            "가입 없이 10,000 USDT 가상 자금으로 비트코인 선물 모의거래. 롱/숏, 125배 레버리지, 격리·교차 마진, TP/SL 주문 무료 연습.",
    },
};

const FAQ_JSONLD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "코인 선물 거래를 처음 시작하는 방법은?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "TradeHub에서 가입 없이 10,000 USDT 가상 자금으로 즉시 연습할 수 있습니다. 실제 바이낸스 실시간 가격 기반이라 실전과 동일한 감각을 익힐 수 있으며, 잃어도 실제 손실이 없어 초보자가 선물 거래 구조를 배우기에 최적입니다.",
            },
        },
        {
            "@type": "Question",
            name: "롱(Long)과 숏(Short) 포지션의 차이는 무엇인가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "롱(매수) 포지션은 가격이 오를 것으로 예상할 때 진입합니다. 가격이 오르면 수익, 내리면 손실입니다. 숏(공매도) 포지션은 가격이 내릴 것으로 예상할 때 진입합니다. 가격이 내리면 수익, 오르면 손실입니다. 코인 선물 거래에서는 두 방향 모두 레버리지를 활용해 수익을 극대화할 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "격리 마진(Isolated)과 교차 마진(Cross)의 차이는?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "격리 마진은 포지션마다 투입 증거금을 분리해 해당 포지션이 청산되더라도 다른 포지션과 잔고에 영향을 주지 않습니다. 교차 마진은 전체 잔고를 공유 증거금으로 사용해 청산을 방어하지만, 잔고 전체가 손실 위험에 노출됩니다. 초보자에게는 격리 마진이 안전합니다.",
            },
        },
        {
            "@type": "Question",
            name: "코인 선물 청산(Liquidation)이란 무엇인가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "청산은 레버리지를 사용한 선물 포지션에서 손실이 증거금 한계를 초과할 때 거래소가 강제로 포지션을 종료시키는 것입니다. 예를 들어 10배 레버리지로 진입하면 가격이 약 10% 불리하게 움직이면 청산됩니다. 손절(Stop-Loss) 설정으로 청산 전에 포지션을 닫을 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "레버리지가 높을수록 좋은 건가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "아닙니다. 레버리지가 높을수록 수익도 크지만 청산 위험도 비례해서 높아집니다. 125배 레버리지는 0.8%만 불리하게 움직여도 전액 청산됩니다. 초보자는 2~5배부터 시작해 리스크 관리를 익힌 후 서서히 늘려가는 것을 권장합니다.",
            },
        },
        {
            "@type": "Question",
            name: "TP(익절)와 SL(손절)은 어떻게 설정하나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "TP(Take Profit, 익절)는 목표 수익 가격에 자동으로 포지션을 종료하는 주문입니다. SL(Stop Loss, 손절)은 최대 허용 손실 가격에 자동으로 포지션을 종료합니다. TradeHub 모의투자에서 포지션 진입 시 또는 진입 후 TP/SL을 설정해 자동 매매를 연습할 수 있습니다.",
            },
        },
    ],
};

const SOFTWARE_JSONLD = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TradeHub 코인 선물 모의투자",
    url: `${SITE}/trading`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    inLanguage: "ko",
    description:
        "바이낸스 실시간 가격 기반 코인 선물 모의투자. 가입 없이 10,000 USDT 가상 자금으로 롱/숏, 레버리지, 격리·교차 마진, TP/SL 주문을 무료로 연습하세요.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    featureList: [
        "가입 없이 즉시 시작", "바이낸스 실시간 가격 연동",
        "최대 125배 레버리지", "롱/숏 포지션",
        "격리·교차 마진", "지정가·시장가·스탑마켓 주문",
        "TP/SL 자동 주문", "다중 포지션 동시 운영",
    ],
};

const BREADCRUMB_JSONLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "TradeHub", item: SITE },
        { "@type": "ListItem", position: 2, name: "코인 선물 모의투자", item: `${SITE}/trading` },
    ],
};

export default function TradingPage() {
    return (
        <>
            <Script id="ld-trading-faq" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(FAQ_JSONLD)}
            </Script>
            <Script id="ld-trading-software" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(SOFTWARE_JSONLD)}
            </Script>
            <Script id="ld-trading-bc" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(BREADCRUMB_JSONLD)}
            </Script>
            <TradingClient />
        </>
    );
}
