"use client";

import { MobileHeader } from "./MobileHeader";

/**
 * 이미 반응형인 페이지(랭킹·차트분석)에 모바일 헤더만 얹는 크롬.
 *
 * 대시보드·모의투자는 화면 자체를 다시 짜야 해서 JS로 트리를 갈아끼우지만
 * (MobileDashboard·MobileTrading), 여기는 본문이 이미 좁은 화면을 감당한다.
 * 그래서 헤더만 CSS로 바꿔 끼운다 — 수화 전후로 트리가 바뀌지 않으니
 * 첫 프레임에 데스크톱 헤더가 스쳤다 사라지는 깜빡임이 없다.
 *
 * data-mobile-chrome은 globals.css가 전역 HeaderNav를 감출 때 쓰는 표식이다.
 * 데스크톱에서도 DOM에는 남지만 xl:hidden으로 가려지고, CSS 규칙도
 * 1280px 미만에서만 걸리므로 데스크톱 헤더는 그대로다.
 */
export function MobileNav() {
    return (
        <div data-mobile-chrome className="xl:hidden">
            <MobileHeader />
        </div>
    );
}
