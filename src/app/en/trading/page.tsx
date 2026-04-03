import type { Metadata } from "next";
import TradingClient from "@/app/trading/TradingClient";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "Free Crypto Futures Sim Trading — Practice Bitcoin Futures | TradeHub",
    description:
        "Practice crypto futures trading with 10,000 USDT virtual funds — no sign-up required. Long/short, up to 125x leverage, isolated/cross margin, TP/SL orders. Real Binance prices.",
    keywords: [
        "crypto futures simulator", "bitcoin futures paper trading",
        "free crypto trading practice", "leverage trading simulator",
        "binance futures practice", "crypto sim trading",
        "bitcoin long short practice", "isolated cross margin explained",
        "crypto liquidation explained", "TP SL order crypto",
    ],
    alternates: {
        canonical: "https://www.tradehub.kr/en/trading",
        languages: { "ko": `${SITE}/trading`, "en": `${SITE}/en/trading` },
    },
    openGraph: {
        title: "Free Crypto Futures Sim Trading — Practice Bitcoin Futures | TradeHub",
        description: "10,000 USDT virtual funds, real Binance prices. Long/short, 125x leverage, TP/SL — free, no sign-up.",
        url: `${SITE}/en/trading`,
        type: "website",
        locale: "en_US",
        siteName: "TradeHub",
    },
    twitter: {
        card: "summary_large_image",
        title: "Free Crypto Futures Sim Trading — Practice Bitcoin Futures | TradeHub",
        description: "10,000 USDT virtual funds, real Binance prices. Long/short, 125x leverage, TP/SL — free.",
    },
};

export default function Page() {
    return <TradingClient />;
}
