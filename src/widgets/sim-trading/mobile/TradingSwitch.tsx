"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { MobileTrading } from "./MobileTrading";

/**
 * 데스크톱 모의투자 화면과 모바일 전용 뷰를 가른다.
 * 1280px 이상에서는 children을 그대로 통과시키므로 기존 출력과 같다.
 */
export function TradingSwitch({ children }: { children: ReactNode }) {
    const isMobile = useIsMobile();
    return isMobile ? <MobileTrading /> : <>{children}</>;
}
