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
        default: "거래량 트리맵 · 김치프리미엄 · 코인 커뮤니티 | TradeHub",
        template: "%s | TradeHub",
    },
    description:
        "150개 코인 거래량을 한눈에 시각화. 실시간 김치프리미엄, 급등코인, 뉴스, 채팅까지 한 화면에.",
    keywords: [
        "코인 거래량",
        "거래량 트리맵",
        "김치프리미엄",
        "코인 커뮤니티",
        "코인선물",
        "급등코인",
        "코인 뉴스",
        "실시간 채팅",
        "TradeHub",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "거래량 트리맵 · 김치프리미엄 · 코인 커뮤니티 | TradeHub",
        siteName: "TradeHub",
        description: "150개 코인 거래량을 한눈에 시각화. 실시간 김치프리미엄, 급등코인, 뉴스, 채팅까지 한 화면에.",
        images: [{ url: "/main-Image.png", width: 1200, height: 630 }],
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "거래량 트리맵 · 김치프리미엄 · 코인 커뮤니티 | TradeHub",
        description: "150개 코인 거래량을 한눈에 시각화. 실시간 김치프리미엄, 급등코인, 뉴스, 채팅까지 한 화면에.",
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
        <html lang="ko" className={`bg-black light ${inter.variable}`} suppressHydrationWarning>
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
