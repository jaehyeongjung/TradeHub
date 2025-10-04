import "./globals.css";
import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";

const SITE = "https://trade-hub-neon.vercel.app";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: {
        default: "TradeHub",
        template: "%s | TradeHub",
    },
    description: "트레이더를 위한 실시간 포지션/채팅/뉴스 허브",
    keywords: ["트레이딩", "비트코인", "코인", "뉴스", "포지션", "TradeHub"],
    alternates: { canonical: SITE + "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "TradeHub",
        description: "트레이더를 위한 실시간 포지션/채팅/뉴스 허브",
        siteName: "TradeHub",
        images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "TradeHub",
        description: "트레이더를 위한 실시간 포지션/채팅/뉴스 허브",
        images: ["/og.png"],
    },
    icons: { icon: "/favicon.ico" },
    verification: {
        // 콘솔에서 받는 코드로 교체
        google: "google-site-verification: googleee33be5b3c8d6d9c.html",
        other: { "naver-site-verification": "NAVER_SITE_VERIFICATION_CODE" },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className="bg-black">
            <body>
                <AuthGate>{children}</AuthGate>
            </body>
        </html>
    );
}
