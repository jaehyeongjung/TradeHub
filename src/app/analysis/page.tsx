import type { Metadata } from "next";
import { AnalysisPage } from "@/widgets/analysis/AnalysisPage";
import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";
import { PageExplainer } from "@/widgets/shared-modals/PageExplainer";

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
    alternates: {
        canonical: "https://www.tradehub.kr/analysis",
        languages: {
            "ko": "https://www.tradehub.kr/analysis",
            "en": "https://www.tradehub.kr/en/analysis",
        },
    },
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
        <>
            <main>
                <AnalysisPage />
            </main>
            <PageExplainer
                heading="차트 분석 도구, 어떻게 읽나요?"
                lead="이 화면은 캔들 차트에서 반복적으로 눌리거나 튕긴 가격대를 자동으로 찾아 선으로 그려주고, 그 선을 기준으로 진입가·손절가를 잡았을 때 손익비가 얼마가 되는지를 레버리지별로 계산합니다. 매수·매도 신호를 주는 도구가 아니라, 이미 세운 계획의 숫자를 확인하는 계산기에 가깝습니다."
                items={[
                    {
                        term: "지지선과 저항선",
                        body: "가격이 여러 번 내려왔다가 반등한 자리가 지지선, 여러 번 올라갔다가 밀린 자리가 저항선입니다. 많이 닿았을수록 시장이 그 가격을 의식한다는 뜻이라 선이 굵게 표시됩니다. 다만 자주 닿은 선일수록 한 번 뚫렸을 때 반대 방향으로 크게 움직이는 경향도 있습니다.",
                    },
                    {
                        term: "손익비 (R:R)",
                        body: "목표가까지의 거리를 손절가까지의 거리로 나눈 값입니다. 손익비 2면 맞았을 때 버는 돈이 틀렸을 때 잃는 돈의 두 배라는 뜻입니다. 승률이 50%를 밑돌아도 손익비가 충분하면 누적 수익이 남을 수 있어서, 진입 전에 확인해야 할 숫자입니다.",
                    },
                    {
                        term: "레버리지별 손절가",
                        body: "같은 손절 폭이라도 레버리지가 높으면 청산가가 진입가에 훨씬 가까워집니다. 손절선에 닿기 전에 청산부터 당하는 배율이 어디서부터인지를 이 화면에서 확인할 수 있습니다.",
                        guide: "leverage-trading",
                    },
                    {
                        term: "교차 마진과 격리 마진",
                        body: "격리는 그 포지션에 넣은 증거금만 잃고 끝나지만, 교차는 계좌 잔고 전체가 증거금으로 쓰입니다. 청산가가 멀어지는 대신 잘못되면 계좌 전체가 위험해집니다. 어느 쪽을 고르느냐에 따라 같은 진입가라도 청산가가 달라집니다.",
                        guide: "cross-isolated-margin",
                    },
                ]}
                closing="여기 표시되는 선과 숫자는 과거 가격에서 계산한 참고 자료이고 미래를 예측하지 않습니다. 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다."
            />
            <SeoFooter />
        </>
    );
}
