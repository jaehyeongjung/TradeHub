"use client";

import Link from "next/link";
import { useState } from "react";
import { useThemeToggle, THEME_ICON_PATH } from "@/shared/hooks/useThemeToggle";
import { ShareButton } from "@/shared/ui/ShareButton";
import { useMobileCopy } from "./copy";
import { NavSheet } from "./NavSheet";

const ICON_BTN =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-control text-text-secondary transition-transform active:scale-90";

/**
 * 로고 · 공유 · 테마 · 메뉴만 남긴 헤더. 모바일 전 화면과 /stocks가 같이 쓴다.
 *
 * 코인 쪽 데스크톱은 가로 탭 네비(HeaderNav)를 그대로 두고, 좁은 화면에서는
 * globals.css가 data-mobile-shell / data-mobile-chrome을 보고 그쪽을 감춘다.
 * /stocks는 폭과 무관하게 이 헤더만 쓴다 — 검색으로 들어온 방문자에게
 * 코인 탭 다섯 개를 가로로 펼쳐 보일 이유가 없다.
 *
 * @param logoHref     로고가 향할 곳. 기본은 대시보드(로케일 반영).
 * @param innerClassName 안쪽 행의 정렬·여백. /stocks는 본문이 max-w-2xl 좁은
 *                     컬럼이라 헤더도 같은 폭으로 맞춰야 로고가 본문과 세로로 선다.
 */
export function MobileHeader({
    logoHref,
    innerClassName = "px-4",
}: {
    logoHref?: string;
    innerClassName?: string;
} = {}) {
    const { t, isEn } = useMobileCopy();
    const { isDark, toggleTheme } = useThemeToggle();
    const [menuOpen, setMenuOpen] = useState(false);

    const home = logoHref ?? (isEn ? "/en/dashboard" : "/dashboard");

    return (
        <>
            <header
                data-mobile-header
                suppressHydrationWarning
                className="sticky top-0 z-40 border-b border-border-subtle bg-surface-card/85 backdrop-blur-xl"
            >
                <div className={`mx-auto flex h-14 items-center gap-2 ${innerClassName}`}>
                    <Link href={home} className="flex items-center gap-1.5" aria-label="TradeHub">
                        <span className="select-none text-headline font-black tracking-[-0.08em] text-text-primary">
                            TradeHub
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-up)]" aria-hidden="true" />
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                        <ShareButton className={ICON_BTN} iconSize={20} />

                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label={isDark ? t.toLight : t.toDark}
                            className={ICON_BTN}
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
                            className={ICON_BTN}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}
