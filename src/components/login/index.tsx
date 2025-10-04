// src/components/AuthBox.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

function mapAuthError(code?: string, message?: string) {
  const lower = message?.toLowerCase() ?? "";
  switch (code) {
    case "user_already_exists":
      return "이미 가입된 이메일입니다.";
    case "missing_email_or_phone":
      return "회원가입하려면 이메일을 기입해주세요.";
    case "weak_password":
      return "비밀번호는 6자 이상 입력해주세요.";
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "email_not_confirmed":
      return "이메일 인증이 필요합니다. 메일함을 확인해주세요.";
    default:
      if (lower.includes("already")) return "이미 가입된 이메일입니다.";
      if (lower.includes("missing email")) return "회원가입하려면 이메일을 기입해주세요.";
      return message ?? "알 수 없는 오류가 발생했습니다.";
  }
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
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
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
      setErr("회원가입하려면 이메일과 비밀번호를 기입해주세요.");
      return;
    }
    // (선택) 형식/길이 검증
    // if (!/\S+@\S+\.\S+/.test(e)) return setErr("이메일 형식을 확인해주세요.");
    // if (p.length < 6) return setErr("비밀번호는 6자 이상 입력해주세요.");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: e, password: p });
    setLoading(false);

    if (error) {
      setErr(mapAuthError((error as any).code, error.message));
      return;
    }

    // 에러가 없어도 이미 가입인 케이스 보정 (identities 빈 배열)
    const identities = data?.user?.identities;
    const already = !data?.user || (Array.isArray(identities) && identities.length === 0);
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
      setErr("로그인하려면 이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    setLoading(false);

    if (error) {
      setErr(mapAuthError((error as any).code, error.message));
      return;
    }
    // 성공 시: onAuthStateChange로 user 상태 반영됨
  };

  const signOut = async () => {
    setErr(null);
    setInfo(null);
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="space-y-2 border-2 p-3.5 h-34 rounded-xl flex flex-col justify-center bg-neutral-950">
        <p className="text-gray-200">
          환영합니다 <b>{user.email}</b>
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
      className="space-y-2 border-2 p-2 rounded-xl bg-neutral-950"
      onSubmit={(e) => {
        e.preventDefault();
        void signIn();
      }}
    >
      {/* 안내/에러 배너 */}
      {info && (
        <div className="rounded-md border border-emerald-600/40 bg-emerald-600/15 px-3 py-2 text-emerald-300 text-xs">
          {info}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400 text-xs">
          {err}
        </div>
      )}

      <input
        className="border pl-4 py-2 w-full rounded-2xl text-gray-200 bg-neutral-900 outline-none focus:ring-2 focus:ring-emerald-600/40"
        placeholder="email"
        value={email}
        onChange={(e) => setE(e.target.value)}
        autoComplete="email"
        inputMode="email"
      />
      <input
        className="border pl-4 py-2 w-full rounded-2xl text-gray-200 bg-neutral-900 outline-none focus:ring-2 focus:ring-emerald-600/40"
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
          className="border px-3 py-2 w-full rounded-2xl border-gray-200 disabled:opacity-60 hover:bg-emerald-700/70 transition"
        >
          <span className="text-xs xl:text-sm text-gray-200 cursor-pointer">
            {loading ? "로그인 중…" : "Sign in"}
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          className="border px-3 py-2 w-full rounded-2xl border-gray-200 disabled:opacity-60 hover:bg-red-700/70 transition"
          onClick={signUp}
        >
          <span className="text-xs xl:text-sm text-gray-200 cursor-pointer">
            {loading ? "가입 중…" : "Sign up"}
          </span>
        </button>
      </div>
    </form>
  );
}
