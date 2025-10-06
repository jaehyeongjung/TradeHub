import "./globals.css";
import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import Script from "next/script";
import FloatingLoginSidebar from "@/components/FloatingLoginDrawer";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: {
        default: "코인 선물 커뮤니티 · 실시간 포지션/롱숏 비율/채팅 | TradeHub",
        template: "%s | TradeHub",
    },
    description:
        "코인 커뮤니티와 코인선물 커뮤니티 기능을 한 화면에. 실시간 포지션(롱/숏 비율), 코인 뉴스, 실시간 채팅을 제공합니다.",
    keywords: [
        "코인 커뮤니티",
        "코인선물 커뮤니티",
        "비트코인 선물",
        "실시간 포지션",
        "선물 롱숏 비율",
        "김치 프리미엄",
        "코인 뉴스",
        "실시간 채팅",
        "TradeHub",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "TradeHub",
        siteName: "TradeHub",
        description:
            "코인 선물 트레이더를 위한 실시간 포지션/선물 롱숏 비율/채팅/코인 뉴스 코인 커뮤니티",
        images: [{ url: "/og.png", width: 1200, height: 630 }],
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "TradeHub",
        description:
            "코인 선물 트레이더를 위한 실시간 포지션/선물 롱숏 비율/채팅/코인 뉴스 코인 커뮤니티",
        images: ["/og.png"],
    },
    icons: { icon: "/favicon.ico" },
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
        <html lang="ko" className="bg-black">
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
