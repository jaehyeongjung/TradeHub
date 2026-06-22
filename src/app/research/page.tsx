import type { Metadata } from "next";
import ResearchClient from "./ResearchClient";

export const metadata: Metadata = {
    title: "코인 리서치 · 공급량·TVL·개발활동 종합 분석 | TradeHub",
    description:
        "상위 200개 코인의 공급 건전성, 유동성, TVL 실사용, 모멘텀을 종합 점수로 평가. 유통량·잠금 물량·미발행 물량 시각화, DefiLlama TVL 연동, GitHub 개발 활동 데이터 제공.",
    alternates: {
        canonical: "https://www.tradehub.kr/research",
    },
    openGraph: {
        title: "코인 리서치 · 공급량·TVL·개발활동 종합 분석",
        description: "상위 200개 코인 펀더멘털 점수 — 공급 건전성, 유동성, TVL 실사용, 7일 모멘텀.",
        url: "https://www.tradehub.kr/research",
        siteName: "TradeHub",
        locale: "ko_KR",
        type: "website",
    },
};

export default function ResearchPage() {
    return (
        <main>
            <ResearchClient />
        </main>
    );
}
