"use client";

import { useEffect, useState } from "react";

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
