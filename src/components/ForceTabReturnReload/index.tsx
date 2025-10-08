"use client";

/**
 * 탭이 hidden → visible 로 전환될 때, 또는 bfcache 복귀(pageshow persisted) 시
 * 즉시 전체 강제 새로고침(캐시 버스팅 쿼리 포함)합니다.
 */
import { useEffect, useRef } from "react";

export default function ForceTabReturnReload() {
    const wasHiddenRef = useRef<boolean>(false);

    useEffect(() => {
        const hardReload = () => {
            // 캐시 버스팅 쿼리 붙여서 정말 새로고침
            const { pathname, search, hash } = window.location;
            const sep = search ? "&" : "?";
            const url = `${pathname}${search}${sep}__rv=${Date.now()}${hash}`;
            // history 추가 없이 현재 엔트리 교체
            window.location.replace(url);
        };

        const onVisibility = () => {
            const vs = document.visibilityState;
            if (vs === "hidden") {
                wasHiddenRef.current = true;
            } else if (vs === "visible" && wasHiddenRef.current) {
                hardReload();
            }
        };

        // iOS Safari 등 bfcache로 돌아올 때도 강제 리로드
        const onPageShow = (e: PageTransitionEvent) => {
            // persisted === true 면 bfcache에서 복귀 → 강제 새로고침
            // persisted === false 여도 “다른 탭 갔다가 복귀” 케이스에서 실행되도록 가드
            if ("persisted" in e && (e as any).persisted) {
                hardReload();
            }
        };

        // 포커스만 바뀌는 브라우저용 보강 (hidden 플래그 없더라도 reload)
        const onFocus = () => {
            if (
                document.visibilityState === "visible" &&
                wasHiddenRef.current
            ) {
                hardReload();
            }
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pageshow", onPageShow);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pageshow", onPageShow);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    return null;
}
