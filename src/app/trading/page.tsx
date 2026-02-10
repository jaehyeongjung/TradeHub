import type { Metadata } from "next";
import TradingClient from "./TradingClient";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "코인 선물 모의투자 - 실시간 비트코인 모의거래 | TradeHub",
    description:
        "바이낸스 실시간 가격 기반 비트코인 모의투자. 가상 자금 10,000 USDT로 코인 선물 모의거래, 최대 125배 레버리지, 롱/숏 포지션을 무료로 연습하세요.",
    alternates: { canonical: "/trading" },
    openGraph: {
        type: "website",
        url: `${SITE}/trading`,
        title: "코인 선물 모의투자 - 실시간 비트코인 모의거래 | TradeHub",
        siteName: "TradeHub",
        description:
            "바이낸스 실시간 가격 기반 비트코인 모의투자. 가상 자금 10,000 USDT로 코인 선물 모의거래, 최대 125배 레버리지, 롱/숏 포지션을 무료로 연습하세요.",
        images: [
            {
                url: "/main-Image.png",
                width: 1200,
                height: 630,
                alt: "TradeHub 비트코인 모의투자",
            },
        ],
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 선물 모의투자 - 실시간 비트코인 모의거래 | TradeHub",
        description:
            "바이낸스 실시간 가격 기반 비트코인 모의투자. 가상 자금 10,000 USDT로 코인 선물 모의거래, 최대 125배 레버리지, 롱/숏 포지션을 무료로 연습하세요.",
        images: ["/main-Image.png"],
    },
};

export default function TradingPage() {
    return <TradingClient />;
}
