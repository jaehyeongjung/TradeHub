import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
// Yeti(네이버)·Daumoa(다음)는 모바일 크롤러 UA에 Android가 들어 있어, 봇으로 걸러내지 않으면
// /mobile로 튕겨 나간다. 국내 검색은 모바일 수집분이 본편이라 이게 빠지면 색인이 통째로 어긋난다.
const BOT_UA = /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Applebot|Yeti|Daumoa/i;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 삭제한 뉴스·게시글 상세(각 500·1,000개). 404로 두면 구글이 "일시적일 수도 있다"고 보고
    // 몇 달씩 색인에 남겨 두므로, 영구 삭제를 뜻하는 410으로 알린다.
    // robots.txt로 막으면 안 된다 — 크롤이 막히면 410을 읽지 못해 색인이 오히려 그대로 굳는다.
    if (pathname.startsWith("/news") || pathname.startsWith("/posts")) {
        return new NextResponse(
            `<!doctype html><meta charset="utf-8"><title>삭제된 페이지</title><p>삭제된 페이지입니다. <a href="/">TradeHub 홈으로</a></p>`,
            { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
        );
    }

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
