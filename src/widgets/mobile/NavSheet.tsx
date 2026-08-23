"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMobileCopy, type MobileCopy } from "./copy";

const NAV: { href: string; key: keyof MobileCopy }[] = [
    { href: "/dashboard", key: "navDashboard" },
    { href: "/trading?tab=sim", key: "navTrading" },
    { href: "/ranking", key: "navRanking" },
    { href: "/analysis", key: "navAnalysis" },
];

/**
 * 하단에서 올라오는 메뉴 시트. MobileHeader가 쓴다.
 *
 * 전역 HeaderNav가 /stocks에서 null을 반환하므로, 이 시트가 없으면 주식 화면에
 * 들어간 뒤로는 코인 쪽으로 돌아갈 길이 없다. 그래서 /stocks도 같은 항목을 본다.
 */
export function NavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname() ?? "/dashboard";
    const { t, isEn } = useMobileCopy();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // 시트가 열린 동안 뒤쪽 본문이 같이 스크롤되지 않게 잠근다.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // 시트는 화면을 덮으므로 Esc로 빠져나갈 길을 준다.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!mounted) return null;

    const withLocale = (href: string) => (isEn ? `/en${href.split("?")[0]}` : href);
    const isStocks = pathname.startsWith("/stocks");

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
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
                            if (info.offset.y > 90 || info.velocity.y > 550) onClose();
                        }}
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <span className="h-1 w-9 rounded-full bg-border-strong" aria-hidden="true" />
                        </div>

                        <nav className="px-3 pt-2" aria-label={t.mainMenu}>
                            {NAV.map((item) => {
                                const href = withLocale(item.href);
                                const active = !isStocks && pathname === href.split("?")[0];
                                return (
                                    <Link
                                        key={item.href}
                                        href={href}
                                        onClick={onClose}
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

                            {/* 주식은 코인 대시보드와 다른 공간이라 선으로 끊어준다.
                                선을 링크에 border-t로 걸면 rounded-control이 양 끝을 말아
                                올려서 구분선이 아니라 그 항목의 윗변처럼 보인다. 그래서
                                독립된 1px 요소로 둔다. */}
                            <div className="my-1.5 h-px bg-border-subtle" aria-hidden="true" />

                            {/* /stocks는 영어판이 없어 로케일을 붙이지 않는다. */}
                            <Link
                                href="/stocks"
                                onClick={onClose}
                                aria-current={isStocks ? "page" : undefined}
                                className={`flex items-center justify-between rounded-control px-4 py-3.5 text-body transition-colors active:bg-surface-hover ${
                                    isStocks ? "font-bold text-text-primary" : "text-text-secondary"
                                }`}
                            >
                                {t.navStocks}
                                {isStocks ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-up)]" aria-hidden="true" />
                                ) : (
                                    <span className="text-caption text-text-muted">{t.navStocksHint}</span>
                                )}
                            </Link>
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body,
    );
}
