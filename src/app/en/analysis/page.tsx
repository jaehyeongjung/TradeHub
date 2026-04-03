import type { Metadata } from "next";
import { AnalysisPage } from "@/widgets/analysis/AnalysisPage";

export const metadata: Metadata = {
    title: "Crypto Futures Chart Analysis · Stop Loss, Entry Price & Leverage Calculator | TradeHub",
    description: "Free AI-powered crypto futures analysis tool. Auto-detects trend lines & support/resistance levels. Calculates stop loss, entry price, take profit, and capital risk % by leverage. BTC, ETH and more.",
    keywords: [
        "crypto futures chart analysis",
        "bitcoin stop loss calculator",
        "crypto leverage risk calculator",
        "futures trading entry price",
        "BTC technical analysis",
        "crypto stop loss take profit",
        "leverage position calculator",
        "bitcoin support resistance levels",
        "crypto trading signal",
        "futures trading analysis tool",
        "binance futures analysis",
        "crypto chart pattern analysis",
    ],
    alternates: {
        canonical: "https://www.tradehub.kr/en/analysis",
        languages: {
            "ko": "https://www.tradehub.kr/analysis",
            "en": "https://www.tradehub.kr/en/analysis",
        },
    },
    openGraph: {
        title: "Crypto Futures Chart Analysis · Stop Loss & Leverage Calculator",
        description: "Auto-detect trend lines & S/R levels. Get stop loss, entry price, take profit, and exact capital risk % at your leverage. Free. BTC, ETH and more.",
        url: "https://www.tradehub.kr/en/analysis",
        siteName: "TradeHub",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Crypto Futures Chart Analysis · Stop Loss & Leverage Calculator | TradeHub",
        description: "Auto-detect trend lines & S/R levels. Get stop loss, entry price, and capital risk % at your leverage. Free.",
    },
};

export default function Page() {
    return (
        <main>
            <AnalysisPage locale="en" />
        </main>
    );
}
