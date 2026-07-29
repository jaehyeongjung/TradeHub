// 버튼 스타일을 문자열로 분리해 둔다.
//
// Button 컴포넌트는 "use client"라서 서버 컴포넌트가 임포트할 수 없다.
// 그런데 링크를 버튼처럼 보여야 하는 자리(<Link>로 된 CTA)가 서버 컴포넌트에 있다.
// 스타일만 이 파일에 두면 버튼과 링크가 같은 규격을 공유할 수 있다.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_SIZE: Record<ButtonSize, string> = {
    sm: "h-9 px-3.5 text-label rounded-chip gap-1",
    md: "h-11 px-4 text-label rounded-control gap-1.5",
    lg: "h-[52px] px-5 text-headline rounded-control gap-2",
};

export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
    // 흰 글씨는 text-white가 아니라 --text-on-fill로. globals.css의
    // `html.light .text-white { !important }` 규칙이 예외 목록에 없는 배경에서
    // 글자를 검정으로 바꿔버린다.
    primary:
        "bg-[var(--color-brand-strong)] text-[var(--text-on-fill)] hover:opacity-92 active:opacity-85",
    secondary:
        "bg-[var(--surface-input)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
    ghost:
        "bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--surface-input)] hover:text-[var(--text-primary)]",
    danger:
        "bg-[var(--color-down-text)] text-[var(--text-on-fill)] hover:opacity-92 active:opacity-85",
};

/** 비활성. 면을 surface-input으로 두면 같은 색 바 위에서 윤곽이 사라지므로 테두리를 남긴다. */
export const BUTTON_DISABLED =
    "bg-[var(--surface-hover)] text-[var(--text-muted)] ring-1 ring-[var(--border-default)] cursor-not-allowed active:scale-100";

export const BUTTON_BASE = [
    "inline-flex shrink-0 items-center justify-center font-bold tracking-[-0.01em]",
    "transition-[opacity,background-color,transform] duration-150",
    // 눌리는 느낌은 크게 주면 장난스러워진다. 1.5%면 충분하다.
    "active:scale-[0.985]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
].join(" ");

export function buttonClasses({
    variant = "primary",
    size = "md",
    block = false,
}: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
} = {}): string {
    return [
        BUTTON_BASE,
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        "cursor-pointer",
        block ? "w-full" : "",
    ].join(" ");
}
