// SSR 시세 섹션의 공통 껍데기와 표 조각.
//
// 서버 컴포넌트다 — "use client"를 붙이면 이 파일이 존재하는 이유가 사라진다.
// 크롤러가 JS 없이 읽을 수 있는 본문을 만드는 게 목적이라, 숫자가 HTML에
// 그대로 박혀 있어야 한다.

import type { ReactNode } from "react";

export function SnapshotSection({
    heading, lead, children, note,
}: {
    heading: string;
    lead: string;
    children: ReactNode;
    note?: string;
}) {
    return (
        <section className="mx-auto max-w-2xl px-4 pt-12 sm:px-5">
            <h2 className="text-title3 font-bold tracking-tight text-text-primary">{heading}</h2>
            <p className="mt-2.5 text-body text-text-secondary">{lead}</p>
            <div className="mt-6">{children}</div>
            {note && (
                <p className="mt-3 text-footnote leading-[1.7] text-text-tertiary">{note}</p>
            )}
        </section>
    );
}

/** 등락률. 0을 상승색으로 칠하지 않으려고 부호를 따로 본다. */
export function Change({ pct }: { pct: number }) {
    const cls = pct > 0 ? "text-[var(--color-up-text)]"
              : pct < 0 ? "text-[var(--color-down-text)]"
              : "text-text-tertiary";
    return <span className={cls}>{pct > 0 ? "+" : ""}{pct.toFixed(2)}%</span>;
}

/**
 * 표는 좁은 화면에서 가로로 넘친다. 페이지 body가 통째로 흔들리지 않게
 * 자기 컨테이너 안에서만 스크롤시킨다.
 */
export function ScrollTable({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-card border border-border-subtle bg-surface-card">
            <table className="w-full min-w-[30rem] border-collapse text-label">
                {children}
            </table>
        </div>
    );
}

export const thClass = "px-3 py-2.5 text-left font-bold text-text-tertiary";
export const tdClass = "px-3 py-2.5 tabular-nums text-text-secondary";

/** $79,914.60 처럼. 1달러 미만 코인은 유효숫자를 더 준다. */
export function usd(n: number): string {
    if (!Number.isFinite(n)) return "—";
    const digits = n >= 1000 ? 0 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 거래대금은 자릿수가 커서 원문 그대로 두면 읽히지 않는다. */
export function compactUsd(n: number): string {
    if (!Number.isFinite(n)) return "—";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
    return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function krw(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return Math.round(n).toLocaleString("ko-KR") + "원";
}
