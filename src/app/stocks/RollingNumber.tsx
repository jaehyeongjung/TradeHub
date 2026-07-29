"use client";

/**
 * 오도미터 방식 숫자. 자릿수가 세로로 굴러간다.
 *
 * 각 자리마다 0~9를 세로로 쌓은 띠를 두고 translateY로 해당 숫자만 보이게 한다.
 * JS 애니메이션 없이 CSS transform만 쓰므로 GPU에서 처리되고, 자리 수가 많아도 부담이 없다.
 *
 * 쉼표·"원"·"$" 같은 비숫자는 움직이지 않는다 — 전부 움직이면 읽을 수가 없다.
 */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function Digit({ value }: { value: number }) {
    return (
        <span
            aria-hidden
            className="relative inline-block overflow-hidden align-bottom"
            style={{ height: "1em", width: "0.60em" }}
        >
            <span
                className="flex flex-col transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                style={{ transform: `translateY(-${value * 10}%)` }}
            >
                {DIGITS.map((d) => (
                    <span key={d} style={{ height: "1em", lineHeight: "1em" }}>
                        {d}
                    </span>
                ))}
            </span>
        </span>
    );
}

export function RollingNumber({
    value,
    className = "",
}: {
    /** 이미 포맷된 문자열. 예: "222,420원" */
    value: string;
    className?: string;
}) {
    return (
        <span className={className} style={{ lineHeight: 1 }}>
            {/* 스크린리더·크롤러는 굴러가는 띠 대신 이 텍스트를 읽는다 */}
            <span className="sr-only">{value}</span>
            {Array.from(value).map((ch, i) =>
                ch >= "0" && ch <= "9" ? (
                    <Digit key={i} value={Number(ch)} />
                ) : (
                    <span key={i} aria-hidden className="inline-block align-bottom">
                        {ch}
                    </span>
                ),
            )}
        </span>
    );
}
