import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "모바일 안내 | TradeHub",
    description: "TradeHub는 PC 환경에 최적화된 서비스입니다. 실시간 청산, 고래 거래, 트리맵, 코인 선물 모의투자 등 다양한 기능을 PC에서 이용하세요.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
