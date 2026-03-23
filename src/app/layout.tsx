import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthGate from "@/components/AuthGate";
import Script from "next/script";
import FloatingLoginSidebar from "@/components/FloatingLoginDrawer";
import HeaderNav from "@/widgets/shared-modals/HeaderNav";
import JotaiProvider from "@/shared/ui/JotaiProvider";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const SITE = "https://www.tradehub.kr";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: {
        default: "TradeHub — 코인 랭킹 · 알트시즌 지수 · 모의투자",
        template: "%s | TradeHub",
    },
    description:
        "코인 시가총액 순위, 알트코인 시즌 지수, 바이낸스 실시간 모의투자까지. 암호화폐 트레이더를 위한 올인원 분석 대시보드.",
    keywords: [
        "코인 랭킹", "코인 순위", "암호화폐 순위", "코인 시가총액 순위",
        "알트코인 시즌 지수", "알트시즌", "알트시즌 언제",
        "코인 모의투자", "비트코인 모의투자", "선물 모의거래", "레버리지 연습",
        "코인 급등", "코인 고점낙폭", "저평가 코인",
        "비트코인 가격", "이더리움 가격", "코인 시세 실시간",
        "바이낸스 코인", "코인 거래대금", "공포탐욕지수",
        "TradeHub",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: SITE,
        title: "TradeHub — 코인 랭킹 · 알트시즌 지수 · 모의투자",
        siteName: "TradeHub",
        description:
            "코인 시가총액 순위, 알트코인 시즌 지수, 바이낸스 실시간 모의투자까지. 암호화폐 트레이더를 위한 올인원 분석 대시보드.",
        locale: "ko_KR",
    },
    twitter: {
        card: "summary_large_image",
        title: "TradeHub — 코인 랭킹 · 알트시즌 지수 · 모의투자",
        description:
            "코인 시가총액 순위, 알트코인 시즌 지수, 바이낸스 실시간 모의투자. 암호화폐 트레이더를 위한 올인원 대시보드.",
    },
    icons: { icon: "/favicon.png", apple: "/favicon-512.png" },
    manifest: "/manifest.json",
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
        google: "ee33be5b3c8d6d9c",
        other: { "naver-site-verification": "29c29580d72771eb7e82529710cb5dc7" },
    },
    other: {
        "google-site-verification": "ee33be5b3c8d6d9c",
    },
    category: "finance",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className={`bg-black ${inter.variable}`} suppressHydrationWarning>
            <body>
                <JotaiProvider>
                <HeaderNav />
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
                </JotaiProvider>
            </body>
        </html>
    );
}
