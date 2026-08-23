"use client";

import { useSyncExternalStore } from "react";

/**
 * 모바일 전용 대시보드로 갈라지는 기준.
 *
 * 1280으로 잡은 이유: 13인치 맥북(M1 Air·13" Pro 1440, M2/M3 Air 1470)에서
 * 창을 좀 줄여도 데스크톱 레이아웃이 유지되어야 한다. 데스크톱 트리는
 * RealTimeSection에 min-w-[1320px]가 걸려 있어 그 아래에서는 어차피
 * 가로 스크롤이 나므로, 그 구간은 모바일 뷰로 넘기는 편이 낫다.
 *
 * globals.css의 pre-hydration 가드와 값이 같아야 한다 — 어긋나면 수화 직전
 * 한 프레임 동안 두 트리가 같이 보인다.
 */
export const MOBILE_MAX_WIDTH = 1279.98;
const QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

function subscribe(onChange: () => void) {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
    return window.matchMedia(QUERY).matches;
}

// 서버에는 뷰포트가 없다. 데스크톱으로 렌더해 두면 기존 SSR 출력이 그대로 유지되고,
// 모바일은 수화 직후 한 번 더 렌더되며 갈라진다. false를 반환해야 수화 불일치가 없다.
function getServerSnapshot() {
    return false;
}

export function useIsMobile(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
