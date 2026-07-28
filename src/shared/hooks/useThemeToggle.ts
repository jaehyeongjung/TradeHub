"use client";

import { useEffect, useState } from "react";

/**
 * 다크/라이트 전환. html.light 클래스를 토글하고 localStorage에 저장한다.
 * 여러 헤더에서 같은 상태를 다루므로 로직을 여기 한 곳에 둔다.
 *
 * 참고: 현재 테마를 읽기만 하는 컴포넌트는 useTheme()을 쓴다. 이 훅은 전환까지 하는 쪽용이다.
 */
export function useThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const dark = saved !== "light";
        setIsDark(dark);
        document.documentElement.classList.toggle("light", !dark);
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;

        // 전환 중에만 트랜지션을 걸어 색이 튀지 않게 한다
        const style = document.createElement("style");
        style.id = "__theme-transition__";
        style.textContent = `*, *::before, *::after {
            transition: background-color 0.35s ease, color 0.25s ease,
                border-color 0.35s ease, fill 0.25s ease,
                stroke 0.25s ease, box-shadow 0.35s ease !important;
        }`;
        document.head.appendChild(style);

        setIsDark(newDark);
        localStorage.setItem("theme", newDark ? "dark" : "light");
        document.documentElement.classList.toggle("light", !newDark);
        setTimeout(() => document.getElementById("__theme-transition__")?.remove(), 400);
    };

    return { isDark, toggleTheme };
}

/** 헤더 테마 버튼 아이콘 path (해/달) */
export const THEME_ICON_PATH = {
    sun: "M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41L4.22 5.64a1 1 0 0 1 0-1.42zm14.14 14.14a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41l-1.42-1.41a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM5.64 18.36a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm12.72-12.72a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0z",
    moon: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
} as const;
