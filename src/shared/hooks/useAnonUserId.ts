"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "@/shared/lib/supabase-browser";

/**
 * 로그인했으면 그 계정, 아니면 익명 계정의 id.
 *
 * ── 왜 훅이 아니라 모듈 전역 스토어인가 ──────────────────────────────
 * 전에는 이 훅을 쓰는 컴포넌트마다 onAuthStateChange를 따로 등록했다.
 * /stocks에서는 Chat과 StockRoom이 같이 떠서 구독이 두 개가 되고,
 * 세션이 없을 때 각 콜백이 공유 가드를 지운 뒤 익명 로그인을 각자 호출했다.
 * signInAnonymously가 동시에 두 번 나가면 supabase-js의 auth 락에서 서로를
 * 기다리게 되는데, 이 락은 auth뿐 아니라 모든 .from() 요청이 액세스 토큰을
 * 얻으려고 통과하는 길목이다. 그래서 한 번 엉키면 게시판·뉴스·실시간 유저처럼
 * auth를 직접 쓰지 않는 화면까지 조용히 멈춘다. (SPA 이동이라 클라이언트가
 * 살아 있는 동안 계속 물려 있고, 새 탭·시크릿창에서는 멀쩡해 보인다)
 *
 * 그래서 구독은 앱 전체에 하나만 두고, 컴포넌트는 그 값을 읽기만 한다.
 */

let currentUserId: string | null = null;
const listeners = new Set<() => void>();
let watching = false;
let signInInFlight: Promise<void> | null = null;

/** 응답이 영영 안 와도 다음 시도를 막지 않도록 끊는다 */
const SIGN_IN_TIMEOUT_MS = 10_000;

function setUserId(next: string | null) {
    if (currentUserId === next) return;
    currentUserId = next;
    for (const notify of listeners) notify();
}

/** 동시에 여러 번 불려도 실제 요청은 하나. 실패는 캐시하지 않는다. */
function signInAnonymouslyOnce(): Promise<void> {
    if (signInInFlight) return signInInFlight;

    signInInFlight = (async () => {
        try {
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("anon sign-in timeout")), SIGN_IN_TIMEOUT_MS),
            );
            const { data, error } = await Promise.race([
                supabase.auth.signInAnonymously(),
                timeout,
            ]);
            if (!error && data?.user?.id) setUserId(data.user.id);
        } catch {
            // 다음 호출에서 다시 시도한다
        } finally {
            signInInFlight = null;
        }
    })();

    return signInInFlight;
}

function startWatching() {
    if (watching || typeof window === "undefined") return;
    watching = true;

    // 이 콜백 안에서 supabase.auth를 다시 부르면 락이 풀리지 않는다.
    // 상태만 기록하고, 로그인이 필요하면 다음 태스크로 빠져나가서 처리한다.
    supabase.auth.onAuthStateChange((_event, session) => {
        const id = session?.user?.id ?? null;
        setUserId(id);
        if (!id) {
            setTimeout(() => {
                void signInAnonymouslyOnce();
            }, 0);
        }
    });

    void (async () => {
        const { data } = await supabase.auth.getSession();
        const id = data.session?.user?.id ?? null;
        if (id) setUserId(id);
        else await signInAnonymouslyOnce();
    })();
}

function subscribe(onStoreChange: () => void): () => void {
    startWatching();
    listeners.add(onStoreChange);
    return () => {
        listeners.delete(onStoreChange);
    };
}

export function useAnonUserId(): string | null {
    return useSyncExternalStore(
        subscribe,
        () => currentUserId,
        () => null, // 서버 렌더에는 세션이 없다
    );
}
