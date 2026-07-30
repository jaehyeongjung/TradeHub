import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare global {
    var __sb__: SupabaseClient | undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
    globalThis.__sb__ ??
    createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage:
                typeof window !== "undefined" ? window.localStorage : undefined,
            storageKey: "sb-auth",
        },
    });

// 디버깅 중: 프로덕션에서도 콘솔로 클라이언트를 만질 수 있게 노출한다.
// 원인 파악이 끝나면 아래 두 줄을 지우고 원래의 개발 전용 노출로 되돌릴 것.
//   if (process.env.NODE_ENV !== "production") globalThis.__sb__ = supabase;
globalThis.__sb__ = supabase;
