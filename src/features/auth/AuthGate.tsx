"use client";
import { useEffect } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import { ToastProvider } from "@/shared/ui/Toast";

/**
 * 세션을 초기화하되 children을 가로막지 않는다.
 *
 * 이전에는 세션 확인이 끝날 때까지 null을 반환했는데, 그 확인이 useEffect에서만 돌기 때문에
 * SSR HTML에는 본문이 한 줄도 담기지 않았다. 크롤러 입장에서는 헤더만 있는 빈 페이지였고
 * JSON-LD 구조화 데이터까지 HTML에서 빠졌다. 검색 유입이 목적인 페이지에는 치명적이라
 * 게이트를 걷어냈다. (대가: 로그인 상태에 따라 달라지는 UI가 아주 짧게 로그아웃 상태로 보일 수 있다.)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        supabase.auth.getSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {});

        return () => subscription.unsubscribe();
    }, []);

    return <ToastProvider>{children}</ToastProvider>;
}
