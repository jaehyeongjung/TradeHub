import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";
import SeoFooter from "@/components/SeoFooter";
import Script from "next/script";

const SITE = "https://www.tradehub.kr";

const ORG_JSONLD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TradeHub",
    url: SITE,
    logo: `${SITE}/favicon-512.png`,
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
    potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
    },
};

export const Home = () => {
    return (
        <>
            {/* JSON-LD는 스크립트 '각각' 객체로 주입 (배열 금지) */}
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

            <div className="min-h-screen flex flex-col px-5 bg-black min-w-310">
                <RealTimeSection />
                <DashBoard />
            </div>
            <SeoFooter />
        </>
    );
};

export default Home;
