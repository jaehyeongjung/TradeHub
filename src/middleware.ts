import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 이미 /mobile이거나 /guide, 정적 파일이면 스킵
    if (
        pathname.startsWith("/mobile") ||
        pathname.startsWith("/guide") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api")
    ) {
        return NextResponse.next();
    }

    const ua = req.headers.get("user-agent") ?? "";
    if (MOBILE_UA.test(ua)) {
        return NextResponse.redirect(new URL("/mobile", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
