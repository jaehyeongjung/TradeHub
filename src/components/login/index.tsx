"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { User, AuthError } from "@supabase/supabase-js";

function mapAuthError(error: AuthError): string {
    const msg = (error.message || "").toLowerCase();

    // message 기반 매핑 (v2 SDK는 별도 code 필드가 없고 message/status 중심)
    if (msg.includes("user already registered") || msg.includes("already")) {
        return "이미 가입된 이메일입니다.";
    }
    if (msg.includes("missing email")) {
        return "회원가입하려면 이메일을 기입해주세요.";
    }
    if (
        msg.includes("weak password") ||
        msg.includes("password should be at least")
    ) {
        return "비밀번호는 6자 이상 입력해주세요.";
    }
    if (msg.includes("email not confirmed")) {
        return "이메일 인증이 필요합니다. 메일함을 확인해주세요.";
    }
    if (msg.includes("invalid login credentials") || error.status === 400) {
        return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }
    return error.message || "알 수 없는 오류가 발생했습니다.";
}

export default function AuthBox() {
    const [email, setE] = useState("");
    const [pw, setP] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // 세션 초기화 + 구독
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const signUp = async () => {
        setErr(null);
        setInfo(null);

        const e = email.trim();
        const p = pw.trim();

        if (!e || !p) {
            setErr("이메일과 비밀번호를 기입 후 메일확인 (스팸)");
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: e,
            password: p,
        });
        setLoading(false);

        if (error) {
            setErr(mapAuthError(error));
            return;
        }

        // 이미 가입된 이메일 보정: identities가 빈 배열이면 기존 사용자
        const identities = data?.user?.identities;
        const already =
            !data?.user ||
            (Array.isArray(identities) && identities.length === 0);
        if (already) {
            setErr("이미 가입된 이메일입니다.");
            return;
        }

        setInfo("인증 메일을 보냈습니다. 메일함을 확인해주세요.");
    };

    const signIn = async () => {
        setErr(null);
        setInfo(null);

        const e = email.trim();
        const p = pw.trim();
        if (!e || !p) {
            setErr("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: e,
            password: p,
        });
        setLoading(false);

        if (error) {
            setErr(mapAuthError(error));
            return;
        }
        // 성공 시 onAuthStateChange로 user 상태 자동 반영
    };

    const signOut = async () => {
        setErr(null);
        setInfo(null);
        await supabase.auth.signOut();
    };

    if (user) {
        return (
            <div className="space-y-2 border-2 p-3.5 h-34 rounded-xl flex flex-col justify-center bg-neutral-950 gap-1">
                <p className="text-gray-200 ml-2">
                    환영합니다 <b className="text-sm">{user.email}</b>
                    <b> 님</b>
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
            className="space-y-2 border-2 p-2 rounded-xl flex flex-col gap-0.5 bg-neutral-950"
            onSubmit={(e) => {
                e.preventDefault();
                void signIn();
            }}
        >
            {info && (
                <div className="rounded-md border border-emerald-600/40 bg-emerald-600/15 px-3 py-2 text-emerald-300 text-xs">
                    {info}
                </div>
            )}
            {err && (
                <div
                    className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400"
                    style={{ fontSize: "0.625rem" }}
                >
                    {err}
                </div>
            )}

            <input
                className="border pl-4 py-2 w-full h-8 text-xs rounded-2xl text-gray-200 bg-neutral-900 outline-none focus:ring-2 focus:ring-emerald-600/40"
                placeholder="email"
                value={email}
                onChange={(e) => setE(e.target.value)}
                autoComplete="email"
                inputMode="email"
            />
            <input
                className="border pl-4 py-2 w-full h-8 text-xs rounded-2xl text-gray-200 bg-neutral-900 outline-none focus:ring-2 focus:ring-emerald-600/40"
                placeholder="password"
                type="password"
                value={pw}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
            />

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="border px-3 py-2 w-full rounded-2xl h-8 flex items-center justify-center border-gray-200 disabled:opacity-60 hover:bg-emerald-700/70 transition"
                >
                    <span className="text-xs xl:text-sm text-gray-200 cursor-pointer">
                        {"Sign in"}
                    </span>
                </button>
                <button
                    type="button"
                    disabled={loading}
                    className="border px-3 py-2 w-full h-8 flex items-center justify-center rounded-2xl border-gray-200 disabled:opacity-60 hover:bg-red-700/70 transition"
                    onClick={() => void signUp()}
                >
                    <span className="text-xs xl:text-sm text-gray-200 cursor-pointer">
                        {"Sign up"}
                    </span>
                </button>
            </div>
        </form>
    );
}
