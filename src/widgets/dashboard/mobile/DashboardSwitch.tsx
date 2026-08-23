"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { MobileDashboard } from "./MobileDashboard";

/**
 * 데스크톱 대시보드와 모바일 전용 뷰를 가른다.
 *
 * children(데스크톱 트리)은 서버에서 그대로 렌더된다. 1280px 이상에서는
 * 이 컴포넌트가 children을 그대로 통과시키므로 기존 출력과 완전히 같다.
 * 좁은 화면에서는 수화 직후 한 번 더 렌더되며 모바일 트리로 교체된다 —
 * 그 사이 데스크톱 트리가 보이지 않도록 page.tsx의 <main>에
 * max-[1279.98px]:hidden을 걸어 둔다.
 */
export function DashboardSwitch({ children }: { children: ReactNode }) {
    const isMobile = useIsMobile();
    return isMobile ? <MobileDashboard /> : <>{children}</>;
}
