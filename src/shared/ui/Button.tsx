"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
    BUTTON_BASE,
    BUTTON_DISABLED,
    BUTTON_SIZE,
    BUTTON_VARIANT,
    type ButtonSize,
    type ButtonVariant,
} from "./button-styles";

/**
 * 버튼 하나뿐인데도 화면마다 높이·굵기·라운드가 달랐다. 그게 화면을 허술하게 만든다.
 * 크기는 세 개(36/44/52), 종류는 네 개로 고정한다.
 *
 * 링크를 버튼처럼 보여야 하면 buttonClasses()를 쓴다 (button-styles.ts).
 */

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
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
                BUTTON_BASE,
                BUTTON_SIZE[size],
                // loading은 "잠깐 기다려"라서 색을 유지한다. 색까지 빼면 고장난 버튼으로 읽힌다.
                loading
                    ? `${BUTTON_VARIANT[variant]} cursor-wait active:scale-100`
                    : disabled
                      ? BUTTON_DISABLED
                      : `${BUTTON_VARIANT[variant]} cursor-pointer`,
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
