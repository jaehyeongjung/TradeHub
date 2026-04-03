import type { Metadata } from "next";
import { AnalysisPage } from "@/widgets/analysis/AnalysisPage";

export const metadata: Metadata = {
    title: "코인 선물 차트 분석 · 손절가·진입가·손익비 자동계산 | TradeHub",
    description: "BTC·ETH 등 코인 선물거래를 위한 기술적 분석 도구. 추세선·지지저항선 자동 감지, 레버리지별 손절가·진입가·손익비 실시간 계산. 고배율·중배율·저배율별 최적 진입 타점을 무료로 제공합니다.",
    keywords: [
        "코인 선물 차트 분석",
        "비트코인 손절가 계산",
        "코인 레버리지 손익비",
        "선물거래 진입 타점",
        "비트코인 지지저항선",
        "코인 추세선 분석",
        "BTC 기술적 분석",
        "선물거래 손절가 진입가",
        "코인 선물 레버리지 추천",
        "비트코인 차트 분석 사이트",
        "이더리움 선물 분석",
        "코인 선물거래 분석",
    ],
    alternates: { canonical: "https://www.tradehub.kr/analysis" },
    openGraph: {
        title: "코인 선물 차트 분석 · 손절가·진입가·손익비 자동계산",
        description: "BTC·ETH 선물거래를 위한 기술적 분석 — 추세선·지지저항선 자동 감지, 레버리지별 손절가·손익비 실시간 계산. 진입 타점을 무료로 확인하세요.",
        url: "https://www.tradehub.kr/analysis",
        siteName: "TradeHub",
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "코인 선물 차트 분석 · 손절가·진입가·손익비 자동계산 | TradeHub",
        description: "BTC·ETH 선물거래를 위한 기술적 분석 — 추세선·지지저항선 자동 감지, 레버리지별 손절가·손익비 실시간 계산.",
    },
};

export default function Page() {
    return (
        <main>
            <AnalysisPage />
        </main>
    );
}
