"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AuthBox from "@/components/login";

export default function FloatingLoginSidebar() {
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const pathname = usePathname();
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const lastFocusRef = useRef<HTMLElement | null>(null);

    // 다크모드 초기화 (기본값: 라이트모드)
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const dark = saved === "dark"; // 저장된 값이 "dark"일 때만 다크모드
        setIsDark(dark);
        document.documentElement.classList.toggle("light", !dark);
    }, []);

    // 다크모드 토글
    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        localStorage.setItem("theme", newDark ? "dark" : "light");
        document.documentElement.classList.toggle("light", !newDark);
    };

    // 열기/닫기 토글
    const toggle = () => setOpen((v) => !v);
    const close = () => setOpen(false);

    // ESC로 닫기, 포커스/스크롤 관리
    useEffect(() => {
        if (open) {
            lastFocusRef.current = document.activeElement as HTMLElement | null;
            // 스크롤 잠금
            document.body.classList.add("overflow-hidden");
            // 약간 딜레이 후 닫기 버튼에 포커스
            const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") close();
            };
            window.addEventListener("keydown", onKey);

            return () => {
                clearTimeout(t);
                window.removeEventListener("keydown", onKey);
            };
        } else {
            document.body.classList.remove("overflow-hidden");
            // 포커스 복원
            lastFocusRef.current?.focus?.();
        }
    }, [open]);

    // 라우트 변경 시 자동 닫기
    useEffect(() => {
        close();
    }, [pathname]);

    return (
        <>
            {/* FAB: 우하단 떠있는 버튼들 */}
            <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3">
                {/* 다크모드 토글 */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                    className={`flex h-12 w-12 items-center cursor-pointer justify-center rounded-full shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isDark
                            ? "bg-zinc-700 text-yellow-300 ring-1 ring-zinc-600/50 focus:ring-zinc-500 focus:ring-offset-black"
                            : "bg-amber-100 text-orange-500 ring-1 ring-amber-300/50 focus:ring-amber-400 focus:ring-offset-white"
                    }`}
                >
                    {isDark ? (
                        /* 달 아이콘 (다크모드) */
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                fill="currentColor"
                                d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
                            />
                        </svg>
                    ) : (
                        /* 해 아이콘 (라이트모드) */
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                fill="currentColor"
                                d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41L4.22 5.64a1 1 0 0 1 0-1.42zm14.14 14.14a1 1 0 0 1 1.42 0l1.41 1.42a1 1 0 1 1-1.41 1.41l-1.42-1.41a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM5.64 18.36a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm12.72-12.72a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0z"
                            />
                        </svg>
                    )}
                </button>

                {/* 로그인 버튼 */}
                <button
                    type="button"
                    onClick={toggle}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls="login-drawer"
                    className="flex h-12 w-12 items-center cursor-pointer justify-center rounded-full bg-amber-400 text-black shadow-lg ring-1 ring-amber-300/50 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 focus:ring-offset-black"
                >
                    <span className="sr-only">로그인 사이드바 열기</span>
                    {/* user 아이콘 (inlined) */}
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fill="currentColor"
                            d="M12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 12c5.33 0 8 2.67 8 6v2H4v-2c0-3.33 2.67-6 8-6"
                        />
                    </svg>
                </button>
            </div>

            {/* 드로어 루트 */}
            <div
                className={`fixed inset-0 z-[59] ${
                    open ? "pointer-events-auto" : "pointer-events-none"
                }`}
                aria-hidden={!open}
            >
                {/* 오버레이 */}
                <div
                    onClick={close}
                    className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
                        open ? "opacity-100" : "opacity-0"
                    }`}
                />

                {/* 패널 */}
                <aside
                    id="login-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="login-drawer-title"
                    className={`absolute right-0 top-0 h-full w-[360px] max-w-[92vw] border-l border-zinc-800 bg-neutral-950 shadow-2xl transition-transform duration-300 ${
                        open ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                        <h2
                            id="login-drawer-title"
                            className="text-sm font-semibold text-white"
                        >
                            로그인
                        </h2>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={close}
                            className="rounded-md p-2 text-zinc-300 cursor-pointer hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        >
                            <span className="sr-only">닫기</span>
                            {/* close 아이콘 */}
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fill="currentColor"
                                    d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12l6.3 6.3l-6.3 6.29l1.41 1.41l6.29-6.29l6.29 6.29l1.41-1.41l-6.29-6.29l6.29-6.3z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* 본문: 로그인 박스 이동 */}
                    <div className="h-[calc(100%-49px)] overflow-y-auto p-4">
                        {/* 여기에 기존 AuthBox를 그대로 렌더 */}
                        <AuthBox />

                        {/* 필요시 안내/링크들 */}
                        <div className="mt-6 space-y-2 text-xs text-zinc-400">
                            <p>
                                계정이 없으신가요? 가입은 로그인 화면에서 진행할
                                수 있어요.
                            </p>
                            <p>
                                문제가 있으면 우측 하단 버튼으로 언제든 열고
                                닫을 수 있습니다.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
