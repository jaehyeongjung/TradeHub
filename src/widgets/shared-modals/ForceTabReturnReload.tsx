"use client";
import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { activePageAtom } from "@/shared/store/atoms";

function hasPersisted(e: unknown): e is { persisted: boolean } {
    return (
        !!e && typeof (e as Record<string, unknown>).persisted === "boolean"
    );
}

export function ForceTabReturnReload() {
    const wasHiddenRef = useRef(false);
    const activePage = useAtomValue(activePageAtom);
    const activePageRef = useRef(activePage);

    useEffect(() => {
        activePageRef.current = activePage;
    }, [activePage]);

    useEffect(() => {
        const cleanOnce = () => {
            const u = new URL(window.location.href);
            if (u.searchParams.has("__rv")) {
                u.searchParams.delete("__rv");
                window.history.replaceState(null, "", u.toString());
            }
        };
        cleanOnce();

        const hardReload = () => {
            if (activePageRef.current === "sim") return;

            const u = new URL(window.location.href);
            u.searchParams.set("__rv", String(Date.now()));
            window.location.replace(u.toString());
        };

        const onVisibility = () => {
            const vs = document.visibilityState;
            if (vs === "hidden") wasHiddenRef.current = true;
            else if (vs === "visible" && wasHiddenRef.current) hardReload();
        };

        const onPageShow = (e: Event) => {
            if (hasPersisted(e) && e.persisted) hardReload();
        };

        const onFocus = () => {
            if (
                document.visibilityState === "visible" &&
                wasHiddenRef.current
            ) {
                hardReload();
            }
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pageshow", onPageShow as EventListener);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener(
                "pageshow",
                onPageShow as EventListener
            );
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    return null;
}
