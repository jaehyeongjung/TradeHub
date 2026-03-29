"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseVisibilityPollingOptions {
    interval: number;
    onPoll: () => Promise<void> | void;
    immediate?: boolean;
    enabled?: boolean;
}

export function useVisibilityPolling({
    interval,
    onPoll,
    immediate = true,
    enabled = true,
}: UseVisibilityPollingOptions) {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPollingRef = useRef(false);

    const poll = useCallback(async () => {
        if (isPollingRef.current) return;
        isPollingRef.current = true;
        try {
            await onPoll();
        } finally {
            isPollingRef.current = false;
        }
    }, [onPoll]);

    const startPolling = useCallback(() => {
        if (timerRef.current) return;
        timerRef.current = setInterval(poll, interval);
    }, [poll, interval]);

    const stopPolling = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            stopPolling();
            return;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                void poll();
                startPolling();
            }
        };

        if (immediate && !document.hidden) {
            void poll();
        }

        if (!document.hidden) {
            startPolling();
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [enabled, immediate, poll, startPolling, stopPolling]);

    return { poll, startPolling, stopPolling };
}
