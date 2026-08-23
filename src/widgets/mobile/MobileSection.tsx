"use client";

import type { ReactNode } from "react";

/**
 * 모바일 뷰의 섹션 껍데기. 제목 줄과 카드 여백을 한 곳에서 고정해
 * 섹션마다 간격이 어긋나지 않게 한다.
 */
export function MobileSection({
    title,
    action,
    live,
    children,
    bare = false,
}: {
    title: string;
    action?: ReactNode;
    live?: boolean;
    children: ReactNode;
    /** true면 카드 배경 없이 내용만 — 가로 스크롤 띠처럼 화면 끝까지 붙일 때 */
    bare?: boolean;
}) {
    return (
        <section className="px-4" aria-label={title}>
            <div className="flex items-center gap-2 px-1 pb-2.5">
                <h2 className="text-label font-bold text-text-tertiary">{title}</h2>
                {live && <LiveDot />}
                {action && <div className="ml-auto">{action}</div>}
            </div>
            {bare ? children : (
                <div className="overflow-hidden rounded-card border border-border-subtle bg-surface-card">
                    {children}
                </div>
            )}
        </section>
    );
}

export function LiveDot() {
    return (
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-up-muted)] px-1.5 py-0.5 text-caption font-bold text-[var(--color-up-text)]">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--color-up)]" aria-hidden="true" />
            LIVE
        </span>
    );
}

/** 값이 아직 없을 때 자리를 잡아두는 스켈레톤 — 로딩 중 섹션 높이가 튀지 않게 한다. */
export function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-chip bg-surface-input ${className}`} />;
}
