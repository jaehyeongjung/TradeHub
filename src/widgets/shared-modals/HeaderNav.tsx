"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { treemapOpenAtom, loginDrawerOpenAtom } from "@/shared/store/atoms";

function HeaderNavInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const setTreemapOpen = useSetAtom(treemapOpenAtom);
    const [loginOpen, setLoginOpen] = useAtom(loginDrawerOpenAtom);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const dark = saved !== "light"; // 저장값 없으면 다크 디폴트
        setIsDark(dark);
        document.documentElement.classList.toggle("light", !dark);
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
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

    if (pathname === "/" || pathname.startsWith("/mobile")) return null;

    const isDashboard = pathname === "/dashboard";
    const isSim = pathname === "/trading";
    const isRanking = pathname === "/ranking";

    const activeClass = "text-text-primary font-semibold";
    const inactiveClass = "text-text-muted hover:text-text-secondary transition-colors";
    const iconBtnClass = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer";

    return (
        <header suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 h-12 w-full bg-[var(--surface-card)] border-b border-[var(--border-subtle)] flex items-center px-4">
            {/* 브랜드 */}
            <Link href="/dashboard" className="flex items-center gap-1.5 mr-6 flex-shrink-0">
                <span className="font-black tracking-[-0.08em] text-sm text-text-primary select-none">TRADEHUB</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
            </Link>

            {/* 네비 */}
            <nav className="flex items-center gap-1" aria-label="주요 메뉴">
                <Link href="/dashboard" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isDashboard ? activeClass : inactiveClass}`} aria-current={isDashboard ? "page" : undefined}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">대시보드</span>
                </Link>
                <Link href="/trading?tab=sim" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isSim ? activeClass : inactiveClass}`} aria-current={isSim ? "page" : undefined}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">모의투자</span>
                </Link>
                <Link href="/ranking" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isRanking ? activeClass : inactiveClass}`} aria-current={isRanking ? "page" : undefined}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">랭킹</span>
                </Link>
            </nav>

            {/* 바이비트 레퍼럴 */}
            <a
                href="https://www.bybit.com/invite?ref=ADYNPO"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 active:scale-[0.97] cursor-pointer flex-shrink-0"
                style={{ background: "linear-gradient(90deg, #f7a600 0%, #e09500 100%)", color: "#000" }}
                aria-label="Bybit 파트너 링크"
            >
                <svg width="12" height="12" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M4 8h14l-4 5H4V8z" fill="currentColor" />
                    <path d="M4 14h12l4 5H4v-5z" fill="currentColor" opacity="0.7" />
                    <path d="M4 20h10l4 5H4v-5z" fill="currentColor" opacity="0.4" />
                    <path d="M20 8l8 4-8 4V8z" fill="currentColor" />
                </svg>
                <span className="hidden sm:inline whitespace-nowrap">Bybit 가입 시 $20 지급</span>
                <span className="sm:hidden">Bybit $20</span>
            </a>

            {/* 우측 액션 */}
            <div className="flex items-center gap-1 ml-3">
                {/* 트리맵 */}
                <button type="button" onClick={() => setTreemapOpen(true)} aria-label="트리맵 보기" className={iconBtnClass}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">트리맵</span>
                </button>

                {/* 다크모드 */}
                <button type="button" onClick={toggleTheme} aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"} className={iconBtnClass}>
                    {isDark ? (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41L4.22 5.64a1 1 0 0 1 0-1.42zm14.14 14.14a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41l-1.42-1.41a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM5.64 18.36a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm12.72-12.72a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                        </svg>
                    )}
                    <span className="hidden sm:inline whitespace-nowrap">{isDark ? "라이트" : "다크"}</span>
                </button>

                {/* 로그인 */}
                <button type="button" onClick={() => setLoginOpen(true)} aria-haspopup="dialog" aria-expanded={loginOpen} aria-controls="login-drawer" className={iconBtnClass}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 12c5.33 0 8 2.67 8 6v2H4v-2c0-3.33 2.67-6 8-6" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">로그인</span>
                </button>
            </div>
        </header>
    );
}

export default function HeaderNav() {
    return (
        <Suspense fallback={null}>
            <HeaderNavInner />
        </Suspense>
    );
}
