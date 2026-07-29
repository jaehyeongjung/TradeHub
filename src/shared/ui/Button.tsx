"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 버튼 하나뿐인데도 화면마다 높이·굵기·라운드가 달랐다. 그게 화면을 허술하게 만든다.
 * 크기는 세 개(36/44/52), 종류는 네 개로 고정한다.
 *
 * primary 배경이 --color-accent가 아니라 --color-accent-strong인 이유:
 * 선명한 브랜드 그린(#02C076) 위의 흰 글씨는 명도비가 2.5:1로 읽히지 않는다.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
    sm: "h-9 px-3.5 text-label rounded-chip gap-1",
    md: "h-11 px-4 text-label rounded-control gap-1.5",
    lg: "h-[52px] px-5 text-headline rounded-control gap-2",
};

const VARIANT: Record<Variant, string> = {
    primary:
        "bg-[var(--color-brand-strong)] text-white hover:opacity-92 active:opacity-85",
    secondary:
        "bg-[var(--surface-input)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
    ghost:
        "bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--surface-input)] hover:text-[var(--text-primary)]",
    danger:
        "bg-[var(--color-down-text)] text-white hover:opacity-92 active:opacity-85",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    block?: boolean;
    loading?: boolean;
    /** 글자 앞 아이콘. 14~16px 라인 아이콘만. */
    icon?: ReactNode;
};

export function Button({
    variant = "primary",
    size = "md",
    block = false,
    loading = false,
    icon,
    disabled,
    className = "",
    children,
    ...rest
}: Props) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={[
                "inline-flex shrink-0 items-center justify-center font-bold tracking-[-0.01em]",
                "transition-[opacity,background-color,transform] duration-150",
                // 눌리는 느낌은 크게 주면 장난스러워진다. 1.5%면 충분하다.
                "active:scale-[0.985]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                SIZE[size],
                // loading은 "잠깐 기다려"라서 색을 유지한다. 색까지 빼면 고장난 버튼으로 읽힌다.
                loading
                    ? `${VARIANT[variant]} cursor-wait active:scale-100`
                    : disabled
                      // disabled 면을 surface-input으로 두면, 같은 색 바 위에 놓였을 때
                      // 윤곽이 1.00:1로 사라진다. 한 단계 진한 면 + 테두리로 형태를 남긴다.
                      ? "bg-[var(--surface-hover)] text-[var(--text-muted)] ring-1 ring-[var(--border-default)] cursor-not-allowed active:scale-100"
                      : `${VARIANT[variant]} cursor-pointer`,
                block ? "w-full" : "",
                className,
            ].join(" ")}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={size === "lg" ? 18 : 15} strokeWidth={2.4} />
            ) : (
                icon
            )}
            {children}
        </button>
    );
}
