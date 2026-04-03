import type { Metadata } from "next";
import { RealTimeSection } from "@/widgets/dashboard/RealTimeSection";
import { DashBoard } from "@/widgets/dashboard/DashBoard";
import { MobileSuggestModal } from "@/widgets/shared-modals/MobileSuggestModal";
import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";
import { ForceTabReturnReload } from "@/widgets/shared-modals/ForceTabReturnReload";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    title: "Real-time Crypto Dashboard — Liquidations · Whale Trades · Heatmap | TradeHub",
    description:
        "Track Binance futures liquidations, whale trades, 150-coin volume heatmap, Kimchi Premium, and Fear & Greed Index — all in one free dashboard.",
    keywords: [
        "crypto liquidation tracker", "whale trade tracker real time",
        "bitcoin liquidation live", "kimchi premium today",
        "crypto fear greed index", "coin heatmap real time",
        "binance liquidation alert", "crypto dashboard free",
        "altcoin volume heatmap", "crypto market sentiment",
    ],
    alternates: {
        canonical: "https://www.tradehub.kr/en/dashboard",
        languages: { "ko": `${SITE}/dashboard`, "en": `${SITE}/en/dashboard` },
    },
    openGraph: {
        title: "Real-time Crypto Dashboard — Liquidations · Whale Trades · Heatmap | TradeHub",
        description: "Track Binance futures liquidations, whale trades, 150-coin heatmap, and Fear & Greed Index — free.",
        url: `${SITE}/en/dashboard`,
        type: "website",
        locale: "en_US",
        siteName: "TradeHub",
    },
    twitter: {
        card: "summary_large_image",
        title: "Real-time Crypto Dashboard — Liquidations · Whale Trades · Heatmap | TradeHub",
        description: "Track Binance futures liquidations, whale trades, 150-coin heatmap, and Fear & Greed Index — free.",
    },
};

export default function Page() {
    return (
        <>
            <main className="h-screen overflow-hidden flex flex-col px-5 bg-black min-w-310 pt-12 pb-3 2xl:pb-4">
                <RealTimeSection />
                <DashBoard />
            </main>
            <SeoFooter />
            <MobileSuggestModal />
            <ForceTabReturnReload />
        </>
    );
}
