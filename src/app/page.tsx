import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";
import MobileSuggestModal from "@/components/MobileSuggestModa";
import Script from "next/script";
import ForceTabReturnReload from "@/components/ForceTabReturnReload";

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

            <main className="flex flex-col px-5 bg-black min-w-310">
                <RealTimeSection />
                <DashBoard />
            </main>
            <MobileSuggestModal />
            <ForceTabReturnReload />
        </>
    );
};

export default Home;
