"use client";

import { useEffect, useRef } from "react";

const COOLDOWN_MS = 4000;
const MIN_AWAY_MS = 1500;

export default function ForceReloadOnReturn() {
    const lastHiddenAtRef = useRef<number | null>(null);

    useEffect(() => {
        const getLastReload = () =>
            Number(sessionStorage.getItem("th:lastReload") || "0");
        const setLastReload = (t: number) =>
            sessionStorage.setItem("th:lastReload", String(t));

        const shouldReload = () => {
            const now = Date.now();
            const lastReload = getLastReload();
            if (now - lastReload < COOLDOWN_MS) return false;
            if (
                lastHiddenAtRef.current &&
                now - lastHiddenAtRef.current < MIN_AWAY_MS
            )
                return false;
            setLastReload(now);
            return true;
        };

        const hardReload = () => {
            if (!shouldReload()) return;
            window.location.reload();
        };

        const onVisibility = () => {
            if (document.visibilityState === "hidden") {
                lastHiddenAtRef.current = Date.now();
            } else if (document.visibilityState === "visible") {
                hardReload();
            }
        };

        const onFocus = () => hardReload();

        const onPageShow = (e: PageTransitionEvent) => {
            const persisted = (
                e as PageTransitionEvent & { persisted?: boolean }
            ).persisted;
            if (persisted) {
                hardReload();
            } else {
                hardReload();
            }
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", onFocus);
        window.addEventListener("pageshow", onPageShow);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("pageshow", onPageShow);
        };
    }, []);

    return null;
}
