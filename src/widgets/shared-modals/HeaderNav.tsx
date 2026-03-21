"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HeaderNavInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 랜딩 페이지에서는 별도 nav가 있으므로 숨김
    if (pathname === "/") return null;

    const isDashboard = pathname === "/dashboard";
    const isSim = pathname === "/trading";

    const activeClass = "text-text-primary font-semibold";
    const inactiveClass = "text-text-muted hover:text-text-secondary transition-colors";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-12 w-full bg-[var(--surface-card)] border-b border-[var(--border-subtle)] flex items-center px-4">
            {/* 좌측: 브랜드 로고 */}
            <Link
                href="/dashboard"
                className="flex items-center gap-1.5 mr-6 flex-shrink-0"
            >
                <span className="font-black tracking-[-0.08em] text-sm text-text-primary select-none">
                    TRADEHUB
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
            </Link>

            {/* 우측: 네비게이션 링크 */}
            <nav className="flex items-center gap-1 ml-auto" aria-label="주요 메뉴">
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isDashboard ? activeClass : inactiveClass}`}
                    aria-current={isDashboard ? "page" : undefined}
                >
                    {/* 대시보드 아이콘 */}
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">대시보드</span>
                </Link>

                <Link
                    href="/trading?tab=sim"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isSim ? activeClass : inactiveClass}`}
                    aria-current={isSim ? "page" : undefined}
                >
                    {/* 모의투자 아이콘 */}
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">모의투자</span>
                </Link>
            </nav>
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
