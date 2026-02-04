import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthGate from "@/components/AuthGate";
import Script from "next/script";
import FloatingLoginSidebar from "@/components/FloatingLoginDrawer";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: {
        default: "실시간 청산 · 고래 거래 · 트리맵 · 김프 | TradeHub",
        template: "%s | TradeHub",
    },
    description:
        "바이낸스 실시간 청산, 고래 거래, 150개 코인 트리맵, 김치프리미엄, 공포탐욕지수를 한 화면에서.",
    keywords: [
        "실시간 청산",
        "고래 거래",
        "코인 거래량",
        "거래량 트리맵",
        "김치프리미엄",
        "공포탐욕지수",
        "코인 커뮤니티",
        "코인선물",
        "코인 뉴스",
        "실시간 채팅",
        "TradeHub",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "실시간 청산 · 고래 거래 · 트리맵 · 김프 | TradeHub",
        siteName: "TradeHub",
        description: "바이낸스 실시간 청산, 고래 거래, 150개 코인 트리맵, 김치프리미엄, 공포탐욕지수를 한 화면에서.",
        images: [{ url: "/main-Image.png", width: 1200, height: 630 }],
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "실시간 청산 · 고래 거래 · 트리맵 · 김프 | TradeHub",
        description: "바이낸스 실시간 청산, 고래 거래, 150개 코인 트리맵, 김치프리미엄, 공포탐욕지수를 한 화면에서.",
        images: ["/main-Image.png"],
    },
    icons: { icon: "/favicon.png" },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
        },
    },

    verification: {
        google: "GOOGLE_SITE_VERIFICATION_CODE",
        other: { "naver-site-verification": "NAVER_SITE_VERIFICATION_CODE" },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className={`bg-black ${inter.variable}`} suppressHydrationWarning>
            <body>
                <AuthGate>{children}</AuthGate>
                <Script
                    async
                    src="https://www.googletagmanager.com/gtag/js?id=G-PHXWQJSM4Z"
                    strategy="afterInteractive"
                />
                <Script id="ga4-inline" strategy="afterInteractive">
                    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-PHXWQJSM4Z', { send_page_view: true });
    `}
                </Script>
                <FloatingLoginSidebar />
            </body>
        </html>
    );
}
