"use client";

import Link from "next/link";
import { useState } from "react";
import { useThemeToggle, THEME_ICON_PATH } from "@/shared/hooks/useThemeToggle";
import { ShareButton } from "@/shared/ui/ShareButton";
import { NavSheet } from "@/widgets/mobile/NavSheet";

/**
 * /stocks 전용 헤더. 코인 대시보드용 네비게이션(트리맵·모의투자·랭킹 등)을
 * 가로로 늘어놓지 않는다 — 검색으로 유입된 주식 토큰 방문자에게는 불필요한
 * 선택지라 헤더 표면에는 로고·공유·테마만 남긴다.
 *
 * 대신 메뉴 버튼 하나를 둔다. 전역 HeaderNav가 /stocks에서 null을 반환해서
 * 이게 없으면 주식 화면에 들어온 뒤로는 코인 쪽으로 돌아갈 링크가 없다.
 * 시트 내용은 모바일 헤더와 같은 NavSheet를 쓴다.
 */
export function StocksHeader() {
    const { isDark, toggleTheme } = useThemeToggle();
    const [menuOpen, setMenuOpen] = useState(false);

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
                    {/* 무채색이다. 이 화면의 주인공은 가격이라, 헤더가 색으로 시선을 뺏으면 안 된다.
                        카카오 노랑은 공유 시트 안 아이콘에만 남겼다. */}
                    <ShareButton />

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

                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="메뉴 열기"
                        aria-haspopup="dialog"
                        aria-expanded={menuOpen}
                        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-chip text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
        </header>
    );
}
