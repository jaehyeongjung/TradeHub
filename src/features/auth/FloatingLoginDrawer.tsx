"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { AuthBox } from "@/features/auth/Login";
import { CryptoTreemap } from "@/entities/market/CryptoTreemap";
import { treemapOpenAtom, loginDrawerOpenAtom } from "@/shared/store/atoms";

export function FloatingLoginSidebar() {
    const [open, setOpen] = useAtom(loginDrawerOpenAtom);
    const [isDark, setIsDark] = useState(false);
    /**
     * 로그인 폼을 처음 열기 전까지 DOM에 넣지 않는다.
     *
     * 드로어는 모든 페이지에 깔려 있어서, 폼을 항상 렌더하면 아무도 열지 않은 모달의
     * 문구("Welcome 계정에 로그인하거나… 스팸함도 확인해주세요")가 전 페이지 HTML에
     * 60어절씩 박힌다. 도구 페이지 본문이 250어절 남짓이라 그 25%가 이 텍스트였고,
     * 애드센스가 본 "본문"을 그만큼 묽게 만들었다.
     *
     * 껍데기(aside)는 계속 두고 내용물만 미룬다 — 껍데기까지 같이 마운트하면
     * 첫 열림에서 translate 전환이 걸릴 프레임이 없어 슬라이드 없이 튀어나온다.
     * 한 번 열고 나면 계속 남겨둔다. 닫는 애니메이션 도중 내용이 사라지면 안 된다.
     */
    const [everOpened, setEverOpened] = useState(false);
    const [showTreemap, setShowTreemap] = useAtom(treemapOpenAtom);
    const pathname = usePathname();
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const lastFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        setIsDark(saved === "dark");
    }, []);

    const close = () => setOpen(false);

    useEffect(() => {
        if (open) {
            setEverOpened(true);
            lastFocusRef.current = document.activeElement as HTMLElement | null;
            document.body.classList.add("overflow-hidden");
            const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
            const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
            window.addEventListener("keydown", onKey);
            return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
        } else {
            document.body.classList.remove("overflow-hidden");
            lastFocusRef.current?.focus?.();
        }
    }, [open]);

    useEffect(() => { close(); }, [pathname]);

    if (pathname === "/mobile") return null;

    return (
        <>
            <div
                className={`fixed inset-0 z-[59] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
                aria-hidden={!open}
            >
                <div
                    onClick={close}
                    className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    id="login-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="login-drawer-title"
                    suppressHydrationWarning
                    className={`absolute right-0 top-0 h-full w-[360px] max-w-[92vw] border-l shadow-2xl transition-transform duration-300 ${
                        open ? "translate-x-0" : "translate-x-full"
                    } ${isDark ? "border-neutral-700/50 bg-neutral-950" : "border-neutral-200 bg-white"}`}
                >
                    <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-neutral-700/50" : "border-neutral-200"}`}>
                        <h2 id="login-drawer-title" className={`text-sm font-semibold ${isDark ? "text-white" : "text-neutral-800"}`}>
                            로그인
                        </h2>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={close}
                            className={`rounded-md p-2 cursor-pointer focus:outline-none focus:ring-2 ${
                                isDark
                                    ? "text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-zinc-500"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:ring-neutral-300"
                            }`}
                        >
                            <span className="sr-only">닫기</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12l6.3 6.3l-6.3 6.29l1.41 1.41l6.29-6.29l6.29 6.29l1.41-1.41l-6.29-6.29l6.29-6.3z" />
                            </svg>
                        </button>
                    </div>
                    <div className="h-[calc(100%-49px)] overflow-y-auto p-4">
                        {everOpened && <AuthBox isDark={isDark} />}
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {showTreemap && <CryptoTreemap onClose={() => setShowTreemap(false)} />}
            </AnimatePresence>
        </>
    );
}
