import type { Metadata } from "next";
import { AnalysisPage } from "@/widgets/analysis/AnalysisPage";

export const metadata: Metadata = {
    title: "기술적 분석 | TradeHub",
    description: "자동 추세선 감지, RSI·MACD·볼린저밴드·EMA 분석, 손익비 기반 롱/숏 시그널을 제공합니다.",
    alternates: { canonical: "/analysis" },
};

export default function Page() {
    return (
        <main>
            <AnalysisPage />
        </main>
    );
}
