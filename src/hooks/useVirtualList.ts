import { useState, useRef, useCallback } from "react";

type State<T> = {
    items: T[];
    count: number;
    batchStart: number;
};

type UseVirtualListReturn<T> = {
    visibleItems: T[];
    /** <div ref={sentinelRef} /> 를 리스트 맨 아래에 붙여주세요 */
    sentinelRef: (el: HTMLDivElement | null) => void;
    hasMore: boolean;
    /** 새로 마운트된 아이템의 시작 인덱스 — 스태거 딜레이 계산용 */
    newBatchStart: number;
};

/**
 * 스크롤 기반 증분 렌더링 유틸.
 *
 * - items 레퍼런스 변경 → 렌더 중 동기 리셋 (derived state 패턴)
 * - sentinel이 DOM에 mount/unmount될 때마다 ref 콜백으로 observer 재생성
 *   → hasMore false → true 전환 시에도 observer가 정상 동작
 */
export function useVirtualList<T>(
    items: T[],
    pageSize = 20,
): UseVirtualListReturn<T> {
    const [state, setState] = useState<State<T>>(() => ({
        items,
        count: Math.min(pageSize, items.length),
        batchStart: 0,
    }));

    // ── Derived state: items 교체 시 렌더 중 즉시 리셋 ──
    let { count, batchStart } = state;
    if (state.items !== items) {
        count = Math.min(pageSize, items.length);
        batchStart = 0;
        setState({ items, count, batchStart: 0 });
    }

    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadMore = useCallback(() => {
        setState((prev) => {
            if (prev.count >= items.length) return prev;
            const next = Math.min(prev.count + pageSize, items.length);
            return { items: prev.items, count: next, batchStart: prev.count };
        });
    }, [items.length, pageSize]);

    // ref 콜백: sentinel이 DOM에 붙을 때마다 observer 재생성
    // → hasMore false→true 전환(탭 전환 후 count 리셋)에서도 정상 동작
    const sentinelRef = useCallback(
        (el: HTMLDivElement | null) => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            if (!el) return;

            const obs = new IntersectionObserver(
                (entries) => { if (entries[0].isIntersecting) loadMore(); },
                { rootMargin: "300px" },
            );
            obs.observe(el);
            observerRef.current = obs;
        },
        [loadMore],
    );

    return {
        visibleItems: items.slice(0, count),
        sentinelRef,
        hasMore: count < items.length,
        newBatchStart: batchStart,
    };
}
