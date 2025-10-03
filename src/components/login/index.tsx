"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

function mapAuthError(code?: string, message?: string) {
    switch (code) {
        case "invalid_credentials":
            return "이메일 또는 비밀번호가 올바르지 않습니다.";
        case "user_already_exists":
            return "이미 가입된 계정입니다.";
        case "weak_password":
            return "비밀번호가 너무 약합니다. (최소 6자리 이상)";
        case "over_request_rate_limit":
            return "잠시 후 다시 시도해주세요.";
        case "missing_email_or_phone":
            return "이메일을 입력해주세요."; // ← 이 부분이 네 케이스
        case "anonymous_signins_disabled":
            return "익명 로그인을 지원하지 않습니다. 이메일로 가입해주세요.";
        default:
            return message ?? "알 수 없는 오류가 발생했습니다.";
    }
}

export default function AuthBox() {
    const [email, setE] = useState("");
    const [pw, setP] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        const { data: sub } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );
        return () => sub.subscription.unsubscribe();
    }, []);

    const signUp = async () => {
        setErr(null);
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setErr(mapAuthError(error.code, error.message));
    };

    const signIn = async () => {
        setErr(null);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pw,
        });
        if (error) setErr(mapAuthError(error.code, error.message));
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    if (user) {
        return (
            <div className="space-y-2 border-2 p-3.5 h-34 rounded-xl flex flex-col justify-center bg-neutral-950">
                <p className="text-gray-200">
                    환영합니다 <b>{user.email}</b> 님
                </p>
                <button
                    className="border px-3 py-1 rounded-2xl text-gray-200 cursor-pointer"
                    onClick={signOut}
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <form
            className="space-y-2 border-2 p-2 h-34 rounded-xl bg-neutral-950"
            onSubmit={(e) => {
                e.preventDefault();
                signIn();
            }}
        >
            <input
                className="border pl-4 py-1 w-full rounded-2xl text-gray-200"
                placeholder="email"
                value={email}
                onChange={(e) => setE(e.target.value)}
            />
            <input
                className="border pl-4 py-1 w-full rounded-2xl text-gray-200"
                placeholder="password"
                type="password"
                value={pw}
                onChange={(e) => setP(e.target.value)}
            />
            <div className="flex gap-2">
                <button
                    type="submit"
                    className="border px-3 py-1 w-full rounded-2xl border-gray-200 hover:bg-green-700"
                >
                    <span className="text-xs whitespace-nowrap xl:text-sm text-gray-200 cursor-pointer">
                        Sign in
                    </span>
                </button>
                <button
                    type="button"
                    className="border px-3 py-1 w-full rounded-2xl border-gray-200 hover:bg-red-700"
                    onClick={signUp}
                >
                    <span className="text-xs whitespace-nowrap xl:text-sm text-gray-200 cursor-pointer">
                        Sign up
                    </span>
                </button>
            </div>
            {err && <p className="text-red-600 text-xs">{err}</p>}
        </form>
    );
}
