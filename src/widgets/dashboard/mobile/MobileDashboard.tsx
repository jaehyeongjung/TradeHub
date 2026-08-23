"use client";

import { MobileHeader } from "./MobileHeader";
import { MobileHotStrip } from "./MobileHotStrip";
import { MobileNews } from "./MobileNews";
import { MobilePrices } from "./MobilePrices";
import { MobileGauges } from "./MobileGauges";
import { MobileLiveFeed } from "./MobileLiveFeed";

/**
 * 모바일 전용 대시보드.
 *
 * 데스크톱 대시보드를 좁힌 게 아니라 다시 짠 화면이다. 데스크톱은 한 화면에
 * 다 펼쳐놓고 눈으로 고르는 구조라 세로 한 줄로는 성립하지 않는다.
 * 여기서는 읽는 순서를 하나로 정한다 — 지금 뛰는 것(핫코인) → 왜(뉴스) →
 * 기준가(핵심 시세) → 시장 온도(공포탐욕·김프) → 지금 벌어지는 일(청산·고래).
 *
 * 채팅·게시판·트리맵·차트는 뺐다. 작은 화면에서 값을 못 하거나
 * 다른 화면에서 더 잘 되는 것들이다.
 *
 * data-mobile-shell은 globals.css가 전역 HeaderNav를 감출 때 쓰는 표식이다.
 */
export function MobileDashboard() {
    return (
        <div data-mobile-shell className="min-h-screen bg-surface-page">
            <MobileHeader />

            <div className="border-b border-border-subtle">
                <MobileHotStrip />
            </div>

            <main className="flex flex-col gap-6 py-5 pb-10">
                <MobileNews />
                <MobilePrices />
                <MobileGauges />
                <MobileLiveFeed />
            </main>
        </div>
    );
}
