"use client";

import Link from "next/link";
import { useState } from "react";
import { useThemeToggle, THEME_ICON_PATH } from "@/shared/hooks/useThemeToggle";
import { useMobileCopy } from "./copy";
import { NavSheet } from "./NavSheet";

/**
 * 모바일 전용 헤더. 로고 · 메뉴 · 테마 토글만 남긴다.
 * 전역 HeaderNav는 데스크톱 기준(가로 나열 + 제휴 배너)이라 모바일에서는
 * globals.css가 data-mobile-shell / data-mobile-chrome을 보고 감춘다.
 *
 * 메뉴 시트는 StocksHeader와 공유하므로 NavSheet에 있다.
 */
export function MobileHeader() {
    const { t, isEn } = useMobileCopy();
    const { isDark, toggleTheme } = useThemeToggle();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <header data-mobile-header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border-subtle bg-surface-card/85 px-4 backdrop-blur-xl">
                <Link
                    href={isEn ? "/en/dashboard" : "/dashboard"}
                    className="flex items-center gap-1.5"
                    aria-label="TradeHub"
                >
                    <span className="select-none text-headline font-black tracking-[-0.08em] text-text-primary">
                        TradeHub
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-up)]" aria-hidden="true" />
                </Link>

                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={isDark ? t.toLight : t.toDark}
                        className="flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-transform active:scale-90"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d={isDark ? THEME_ICON_PATH.sun : THEME_ICON_PATH.moon} />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label={t.openMenu}
                        aria-haspopup="dialog"
                        aria-expanded={menuOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-transform active:scale-90"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </button>
                </div>
            </header>

            <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}
