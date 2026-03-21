"use client";

import { useEffect, useState } from "react";

/**
 * 다크/라이트 테마 감지 hook.
 * html 요소의 "light" 클래스 존재 여부를 관찰한다.
 */
export function useTheme(): boolean {
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        setIsLight(html.classList.contains("light"));
        const observer = new MutationObserver(() =>
            setIsLight(html.classList.contains("light"))
        );
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    return isLight;
}
