"use client";

import { atom } from "jotai";

/**
 * 트리맵 오버레이 열림 상태
 * - 트리맵이 열려있으면 true, 닫혀있으면 false
 * - 다른 컴포넌트들은 이 상태를 참조하여 불필요한 폴링을 중단
 */
export const treemapOpenAtom = atom(false);
