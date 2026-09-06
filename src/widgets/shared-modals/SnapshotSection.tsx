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
 * 좁은 화면에서도 표 전체가 한 화면에 들어오게 한다.
 *
 * 전에는 min-w-[30rem](480px)을 걸어두어 390px 기기에서 무조건 가로 스크롤이 생겼다.
 * 표가 잘린 채로 뜨니 오른쪽에 무엇이 있는지 모르고 지나치게 된다.
 * 지금은 최소 폭을 두지 않고, 부차적인 열을 sm 미만에서 접는다(colSecondary).
 * overflow-x-auto는 그래도 넘칠 때를 위한 안전망으로 남겨둔다.
 */
export function ScrollTable({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-card border border-border-subtle bg-surface-card">
            <table className="w-full border-collapse text-label">
                {children}
            </table>
        </div>
    );
}

/* 헤더가 두 줄로 갈라지면("24h 등락" → "24h" / "등락") 행 높이가 들쭉날쭉해진다.
   좁은 화면에서는 좌우 여백도 줄여 열 하나라도 더 들어가게 한다. */
export const thClass =
    "whitespace-nowrap px-2 py-2.5 text-left font-bold text-text-tertiary sm:px-3";
export const tdClass =
    "whitespace-nowrap px-2 py-2.5 tabular-nums text-text-secondary sm:px-3";

/** 좁은 화면에서 접는 열. 핵심 3~4개만 남기고 나머지를 숨긴다. */
export const colSecondary = "hidden sm:table-cell";

/**
 * 종목 이름 칸. 모바일은 티커만("BTC"), sm 이상에서 정식 이름을 앞에 붙인다.
 * "Bitcoin Cash BCH"를 그대로 두면 이 칸 하나가 표 폭의 절반을 먹는다.
 */
export function SymbolCell({ name, symbol }: { name: string; symbol: string }) {
    const ticker = symbol.replace("USDT", "");
    return (
        <th
            scope="row"
            className="whitespace-nowrap px-2 py-2.5 text-left font-bold text-text-primary sm:px-3"
        >
            <span className="hidden sm:inline">{name}</span>
            <span className="sm:ml-1.5 sm:font-normal sm:text-text-tertiary">{ticker}</span>
        </th>
    );
}

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
