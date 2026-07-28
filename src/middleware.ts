import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const BOT_UA = /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Applebot/i;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname.startsWith("/mobile") ||
        pathname.startsWith("/guide") ||
        // 검색 유입 랜딩 페이지. 모바일에서 /mobile로 튕기면 유입된 콘텐츠를 못 보고 이탈한다.
        pathname.startsWith("/stocks") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api")
    ) {
        return NextResponse.next();
    }

    const ua = req.headers.get("user-agent") ?? "";

    if (BOT_UA.test(ua)) {
        return NextResponse.next();
    }

    if (MOBILE_UA.test(ua)) {
        const isEn = pathname.startsWith("/en");
        const target = isEn ? "/mobile?lang=en" : "/mobile";
        return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
