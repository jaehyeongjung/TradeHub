import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 삭제한 뉴스·게시글 상세(각 500·1,000개)와 영문 페이지(/en/** 24개).
    // 404로 두면 구글이 "일시적일 수도 있다"고 보고 몇 달씩 색인에 남겨 두므로,
    // 영구 삭제를 뜻하는 410으로 알린다.
    // robots.txt로 막으면 안 된다 — 크롤이 막히면 410을 읽지 못해 색인이 오히려 그대로 굳는다.
    //
    // 영문을 접은 이유: 도구 페이지 4개가 89~167단어짜리 껍데기였다. 한글에만 붙여둔
    // 설명 섹션(PageExplainer)이 영문에는 없어서, 위젯과 푸터 말고는 본문이 없었다.
    // 애드센스가 사이트 전체 게재를 중단시킨 직접 원인으로 보고 한 언어만 유지한다.
    if (
        pathname.startsWith("/news") ||
        pathname.startsWith("/posts") ||
        pathname === "/en" ||
        pathname.startsWith("/en/")
    ) {
        return new NextResponse(
            `<!doctype html><meta charset="utf-8"><title>삭제된 페이지</title><p>삭제된 페이지입니다. <a href="/">TradeHub 홈으로</a></p>`,
            { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
