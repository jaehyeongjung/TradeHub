"use client";
import { useEffect, useRef } from "react";

// ✅ 타입가드: 이벤트에 persisted(boolean)가 있는지 안전 확인
function hasPersisted(ev: unknown): ev is { persisted: boolean } {
  return !!ev && typeof (ev as Record<string, unknown>).persisted === "boolean";
}

export default function ForceTabReturnReload() {
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    const hardReload = () => {
      const { pathname, search, hash } = window.location;
      const sep = search ? "&" : "?";
      const url = `${pathname}${search}${sep}__rv=${Date.now()}${hash}`;
      window.location.replace(url);
    };

    const onVisibility = () => {
      const vs = document.visibilityState;
      if (vs === "hidden") wasHiddenRef.current = true;
      else if (vs === "visible" && wasHiddenRef.current) hardReload();
    };

    const onPageShow = (e: Event) => {
      if (hasPersisted(e) && e.persisted) {
        hardReload();
      }
    };

    const onFocus = () => {
      if (document.visibilityState === "visible" && wasHiddenRef.current) {
        hardReload();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow as EventListener);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow as EventListener);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
