"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase-browser";

// 한 화면에 채팅과 층 패널이 같이 뜬다. 각자 signInAnonymously를 부르면
// 익명 계정이 두 개 생겨 층과 메시지의 주인이 갈릴 수 있어 호출을 공유한다.
let pendingSignIn: Promise<string | null> | null = null;

function ensureAnonUser(): Promise<string | null> {
    if (!pendingSignIn) {
        pendingSignIn = supabase.auth
            .signInAnonymously()
            .then(({ data, error }) => {
                if (error) {
                    pendingSignIn = null; // 실패는 캐시하지 않는다 — 다음 호출에서 재시도
                    return null;
                }
                return data?.user?.id ?? null;
            })
            .catch(() => {
                pendingSignIn = null;
                return null;
            });
    }
    return pendingSignIn;
}

/**
 * 로그인했으면 그 계정, 아니면 익명 계정의 id.
 *
 * onAuthStateChange 콜백 안에서 supabase.auth를 다시 호출하면 내부 락에 걸려
 * 멈추는 일이 있어, 로그아웃 복구는 다음 틱으로 미룬다.
 */
export function useAnonUserId(): string | null {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!alive) return;
            if (session?.user) {
                setUserId(session.user.id);
                return;
            }
            setUserId(null);
            pendingSignIn = null;
            setTimeout(() => {
                void ensureAnonUser().then((id) => {
                    if (alive && id) setUserId(id);
                });
            }, 0);
        });

        (async () => {
            const { data } = await supabase.auth.getSession();
            if (!alive) return;
            if (data.session?.user) {
                setUserId(data.session.user.id);
                return;
            }
            const id = await ensureAnonUser();
            if (alive && id) setUserId(id);
        })();

        return () => {
            alive = false;
            subscription.unsubscribe();
        };
    }, []);

    return userId;
}
