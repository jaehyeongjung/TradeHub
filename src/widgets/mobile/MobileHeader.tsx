"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useThemeToggle, THEME_ICON_PATH } from "@/shared/hooks/useThemeToggle";
import { useMobileCopy, type MobileCopy } from "./copy";

const NAV: { href: string; key: keyof MobileCopy }[] = [
    { href: "/dashboard", key: "navDashboard" },
    { href: "/trading?tab=sim", key: "navTrading" },
    { href: "/ranking", key: "navRanking" },
    { href: "/analysis", key: "navAnalysis" },
];

/**
 * 모바일 전용 헤더. 로고 · 메뉴 · 테마 토글만 남긴다.
 * 전역 HeaderNav는 데스크톱 기준(가로 나열 + 제휴 배너)이라 모바일에서는
 * globals.css가 data-mobile-shell을 보고 감춘다.
 */
export function MobileHeader() {
    const pathname = usePathname() ?? "/dashboard";
    const { t, isEn } = useMobileCopy();
    const { isDark, toggleTheme } = useThemeToggle();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // 시트가 열린 동안 뒤쪽 본문이 같이 스크롤되지 않게 잠근다.
    useEffect(() => {
        if (!menuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [menuOpen]);

    const withLocale = (href: string) => (isEn ? `/en${href.split("?")[0]}` : href);

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

            {mounted && createPortal(
                <AnimatePresence>
                    {menuOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-50 bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label={t.menu}
                            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-border-subtle bg-surface-elevated pb-[max(env(safe-area-inset-bottom),1rem)]"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 340 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.4 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 90 || info.velocity.y > 550) setMenuOpen(false);
                            }}
                        >
                            <div className="flex justify-center pt-3 pb-1">
                                <span className="h-1 w-9 rounded-full bg-border-strong" aria-hidden="true" />
                            </div>

                            <nav className="px-3 pt-2" aria-label={t.mainMenu}>
                                {NAV.map((item) => {
                                    const href = withLocale(item.href);
                                    const active = pathname === href.split("?")[0];
                                    return (
                                        <Link
                                            key={item.href}
                                            href={href}
                                            onClick={() => setMenuOpen(false)}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center justify-between rounded-control px-4 py-3.5 text-body transition-colors active:bg-surface-hover ${
                                                active ? "font-bold text-text-primary" : "text-text-secondary"
                                            }`}
                                        >
                                            {t[item.key] as string}
                                            {active && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-up)]" aria-hidden="true" />
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* /stocks는 코인 대시보드와 다른 공간이고 영어판이 없어 로케일을 붙이지 않는다. */}
                                <Link
                                    href="/stocks"
                                    onClick={() => setMenuOpen(false)}
                                    className="mt-1 flex items-center justify-between rounded-control border-t border-border-subtle px-4 py-3.5 text-body text-text-secondary transition-colors active:bg-surface-hover"
                                >
                                    {t.navStocks}
                                    <span className="text-caption text-text-muted">{t.navStocksHint}</span>
                                </Link>
                            </nav>
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
}
