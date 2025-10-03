"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // 1) 최초 복원
        supabase.auth.getSession().then(() => setReady(true));

        // 2) 변경 구독
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            // 세션 변경시 자동 반영 (필요시 전역 상태 업데이트 추가)
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!ready) return <div className="p-3">Loading…</div>;
    return <>{children}</>;
}
