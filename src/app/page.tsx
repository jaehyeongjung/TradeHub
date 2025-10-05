import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";

const SITE = "https://www.tradehub.kr";

export const Home = () => {
    // Organization + WebSite 구조화 데이터
    const jsonLd = [
        {
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
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: SITE,
            name: "TradeHub",
            potentialAction: {
                "@type": "SearchAction",
                target: `${SITE}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
            },
        },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="min-h-screen flex flex-col px-5 bg-black min-w-310">
                <RealTimeSection />
                <DashBoard />
            </div>
        </>
    );
};

export default Home;
