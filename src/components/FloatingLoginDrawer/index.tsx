"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AuthBox from "@/components/login";

export default function FloatingLoginSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* FAB: 우하단 떠있는 버튼 */}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="login-drawer"
        className="fixed bottom-5 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-black shadow-lg ring-1 ring-amber-300/50 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 focus:ring-offset-black"
      >
        <span className="sr-only">로그인 사이드바 열기</span>
        {/* user 아이콘 (inlined) */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 12c5.33 0 8 2.67 8 6v2H4v-2c0-3.33 2.67-6 8-6" />
        </svg>
      </button>

      {/* 드로어 루트 */}
      <div
        className={`fixed inset-0 z-[59] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* 오버레이 */}
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />

        {/* 패널 */}
        <aside
          id="login-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-drawer-title"
          className={`absolute right-0 top-0 h-full w-[360px] max-w-[92vw] border-l border-zinc-800 bg-neutral-950 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 id="login-drawer-title" className="text-sm font-semibold text-white">
              로그인
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <span className="sr-only">닫기</span>
              {/* close 아이콘 */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12l6.3 6.3l-6.3 6.29l1.41 1.41l6.29-6.29l6.29 6.29l1.41-1.41l-6.29-6.29l6.29-6.3z" />
              </svg>
            </button>
          </div>

          {/* 본문: 로그인 박스 이동 */}
          <div className="h-[calc(100%-49px)] overflow-y-auto p-4">
            {/* 여기에 기존 AuthBox를 그대로 렌더 */}
            <AuthBox />

            {/* 필요시 안내/링크들 */}
            <div className="mt-6 space-y-2 text-xs text-zinc-400">
              <p>계정이 없으신가요? 가입은 로그인 화면에서 진행할 수 있어요.</p>
              <p>문제가 있으면 우측 하단 버튼으로 언제든 열고 닫을 수 있습니다.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
