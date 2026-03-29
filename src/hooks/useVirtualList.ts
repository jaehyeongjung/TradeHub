import { useState, useRef, useCallback } from "react";

type State<T> = {
    items: T[];
    count: number;
    batchStart: number;
};

type UseVirtualListReturn<T> = {
    visibleItems: T[];
    sentinelRef: (el: HTMLDivElement | null) => void;
    hasMore: boolean;
    newBatchStart: number;
};

export function useVirtualList<T>(
    items: T[],
    pageSize = 20,
): UseVirtualListReturn<T> {
    const [state, setState] = useState<State<T>>(() => ({
        items,
        count: Math.min(pageSize, items.length),
        batchStart: 0,
    }));

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
