import { NextRequest, NextResponse } from "next/server";

// 디버깅 중 임시로 끄려면 false. 끝나면 반드시 true로 되돌릴 것.
const MOBILE_REDIRECT_ENABLED = false;

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
// Yeti(네이버)·Daumoa(다음)는 모바일 크롤러 UA에 Android가 들어 있어, 봇으로 걸러내지 않으면
// /mobile로 튕겨 나간다. 국내 검색은 모바일 수집분이 본편이라 이게 빠지면 색인이 통째로 어긋난다.
const BOT_UA = /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Applebot|Yeti|Daumoa/i;

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

    if (MOBILE_REDIRECT_ENABLED && MOBILE_UA.test(ua)) {
        const isEn = pathname.startsWith("/en");
        const target = isEn ? "/mobile?lang=en" : "/mobile";
        return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
