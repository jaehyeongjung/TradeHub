import "./globals.css";
import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import Script from "next/script";

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: { default: "TradeHub", template: "%s | TradeHub" },
    description: "트레이더를 위한 실시간 포지션/채팅/뉴스 허브",
    keywords: ["트레이딩", "비트코인", "코인", "뉴스", "포지션", "TradeHub"],
    alternates: { canonical: "/" },
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
            </body>
        </html>
    );
}
