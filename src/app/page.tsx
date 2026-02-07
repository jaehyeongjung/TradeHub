import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";
import MobileSuggestModal from "@/components/MobileSuggestModa";
import Script from "next/script";
import ForceTabReturnReload from "@/components/ForceTabReturnReload";
import PageSlider from "@/components/PageSlider";

const SITE = "https://www.tradehub.kr";

const ORG_JSONLD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TradeHub",
    url: SITE,
    logo: `${SITE}/favicon-512.png`,
    description: "실시간 암호화폐 청산, 고래 거래, 트리맵, 코인 선물 모의투자를 제공하는 트레이딩 대시보드",
    sameAs: [],
    contactPoint: [
        {
            "@type": "ContactPoint",
            contactType: "customer support",
            availableLanguage: ["ko", "en"],
        },
    ],
};

const SITE_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE,
    name: "TradeHub",
    description: "바이낸스 실시간 청산, 고래 거래, 150개 코인 트리맵, 김치프리미엄, 공포탐욕지수, 코인 선물 모의투자를 한 화면에서",
    inLanguage: "ko",
    potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
    },
};

const APP_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TradeHub",
    url: SITE,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
    },
    featureList: [
        "실시간 청산 알림",
        "고래 거래 추적",
        "150개 코인 트리맵",
        "김치프리미엄 계산",
        "공포탐욕지수",
        "실시간 채팅",
        "코인 뉴스",
        "코인 선물 모의투자",
        "레버리지 모의거래",
        "롱숏 포지션 연습",
    ],
};

const FAQ_JSONLD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "TradeHub는 무료인가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "네, TradeHub의 모든 기능은 무료로 제공됩니다. 실시간 청산, 고래 거래, 트리맵, 김치프리미엄, 코인 선물 모의투자 등 모든 기능을 무료로 이용할 수 있습니다.",
            },
        },
        {
            "@type": "Question",
            name: "김치프리미엄이란 무엇인가요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "김치프리미엄은 한국 거래소(업비트)와 해외 거래소(바이낸스)의 암호화폐 가격 차이를 나타내는 지표입니다. 양수면 한국이 더 비싸고, 음수면 해외가 더 비쌉니다.",
            },
        },
        {
            "@type": "Question",
            name: "공포탐욕지수는 어떻게 계산되나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "공포탐욕지수는 가격 변동성, 거래량, 소셜 트렌드 등을 종합하여 0~100 사이의 수치로 시장 심리를 나타냅니다. 0에 가까울수록 공포, 100에 가까울수록 탐욕 상태입니다.",
            },
        },
        {
            "@type": "Question",
            name: "트리맵에서 어떤 정보를 볼 수 있나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "트리맵에서는 150개 이상의 암호화폐를 거래량 기준으로 시각화하여 볼 수 있습니다. 박스 크기는 거래량을, 색상은 가격 변동률을 나타냅니다.",
            },
        },
        {
            "@type": "Question",
            name: "코인 선물 모의투자는 어떻게 이용하나요?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "TradeHub의 코인 선물 모의투자는 실제 바이낸스 실시간 가격을 기반으로 가상 자금 10,000 USDT로 선물거래를 연습할 수 있는 기능입니다. 롱/숏 포지션, 레버리지(최대 125배), 지정가/시장가/스탑마켓 주문, 익절/손절 설정, 교차/격리 마진 모드를 지원합니다.",
            },
        },
    ],
};

export default function Home() {
    return (
        <>
            <Script
                id="ld-org"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {JSON.stringify(ORG_JSONLD)}
            </Script>
            <Script
                id="ld-site"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {JSON.stringify(SITE_JSONLD)}
            </Script>
            <Script
                id="ld-app"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {JSON.stringify(APP_JSONLD)}
            </Script>
            <Script
                id="ld-faq"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {JSON.stringify(FAQ_JSONLD)}
            </Script>

            <PageSlider>
                <main className="flex flex-col px-5 bg-black min-w-310">
                    <RealTimeSection />
                    <DashBoard />
                </main>
            </PageSlider>
            <MobileSuggestModal />
            <ForceTabReturnReload />
        </>
    );
}
