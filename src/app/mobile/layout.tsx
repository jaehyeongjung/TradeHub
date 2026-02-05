import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "모바일 안내 | TradeHub",
    description: "TradeHub는 PC 환경에 최적화된 서비스입니다.",
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
