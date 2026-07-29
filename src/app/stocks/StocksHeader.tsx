"use client";

import Link from "next/link";
import { useThemeToggle, THEME_ICON_PATH } from "@/shared/hooks/useThemeToggle";
import { KakaoShareButton } from "@/shared/ui/KakaoShareButton";

/**
 * /stocks 전용 헤더. 코인 대시보드용 네비게이션(트리맵·모의투자·랭킹 등)은
 * 검색으로 유입된 주식 토큰 방문자에게 불필요한 선택지라 로고와 테마 전환만 남긴다.
 */
export function StocksHeader() {
    const { isDark, toggleTheme } = useThemeToggle();

    return (
        <header
            suppressHydrationWarning
            className="fixed top-0 left-0 right-0 z-50 h-12 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]"
        >
            <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4 sm:px-5">
                <Link href="/stocks" className="flex flex-shrink-0 items-center gap-1.5">
                    <span className="select-none text-sm font-black tracking-[-0.08em] text-[var(--text-primary)]">
                        TradeHub
                    </span>
                    <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-accent)]"
                        aria-hidden="true"
                    />
                </Link>

                <div className="flex items-center gap-1">
                    {/* 카카오 옐로우라 헤더에서 유일한 유색 요소 — 자연히 시선이 간다 */}
                    <KakaoShareButton />

                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-chip text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                        <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d={isDark ? THEME_ICON_PATH.sun : THEME_ICON_PATH.moon} />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
