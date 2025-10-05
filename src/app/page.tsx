import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";

const SITE = "https://www.tradehub.kr";

export const Home = () => {
    // 검색엔진(구글, 네이버)이 사이트 정보를 이해할 수 있게 하는 구조화 데이터(JSON-LD)
    // Organization(운영 주체 정보) + WebSite(사이트 메타정보) 두 가지를 정의
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

    // scrpt: JSON-LD 데이터를 실제 HTML로 삽입해서 SEO에 효과를 주는 부분
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
