import type { Metadata } from "next";
import { LandingEN } from "@/widgets/landing/LandingEN";

export const metadata: Metadata = {
    title: "TradeHub — Crypto Sim Trading · Real-Time Market Dashboard",
    description:
        "Practice crypto futures trading with 10,000 USDT — no sign-up required. Real-time Binance data, up to 125x leverage, full TP/SL engine. Free forever.",
    keywords: [
        "crypto sim trading",
        "bitcoin futures simulator",
        "crypto paper trading free",
        "binance futures practice",
        "crypto leverage trading practice",
        "bitcoin trading no signup",
        "crypto futures no risk",
        "real-time crypto dashboard",
        "altcoin season index",
        "crypto fear greed index",
        "whale trade tracker",
        "kimchi premium live",
        "TradeHub",
    ],
    alternates: {
        canonical: "https://www.tradehub.kr/en",
        languages: {
            ko: "https://www.tradehub.kr",
            en: "https://www.tradehub.kr/en",
        },
    },
    openGraph: {
        title: "TradeHub — Crypto Sim Trading · Real-Time Market Dashboard",
        description:
            "10,000 USDT to practice crypto futures trading. Real Binance data, 125x leverage, TP/SL engine. Free, no sign-up.",
        url: "https://www.tradehub.kr/en",
        siteName: "TradeHub",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "TradeHub — Crypto Sim Trading · Real-Time Market Dashboard",
        description:
            "Practice crypto futures with real Binance data. 125x leverage, no sign-up. Free.",
    },
};

export default function Page() {
    return <LandingEN />;
}
