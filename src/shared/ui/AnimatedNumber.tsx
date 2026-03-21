"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    formatter?: (value: number) => string;
}

export default function AnimatedNumber({
    value,
    duration = 500,
    decimals = 0,
    prefix = "",
    suffix = "",
    className = "",
    formatter,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeOutExpo 이징
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = startValue + (endValue - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    const formattedValue = formatter
        ? formatter(displayValue)
        : displayValue.toFixed(decimals);

    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}

// 가격 변동 하이라이트가 포함된 버전
interface AnimatedPriceProps {
    value: number;
    decimals?: number;
    prefix?: string;
    className?: string;
    formatter?: (value: number) => string;
}

export function AnimatedPrice({
    value,
    decimals = 2,
    prefix = "$",
    className = "",
    formatter,
}: AnimatedPriceProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [flash, setFlash] = useState<"up" | "down" | null>(null);
    const previousValue = useRef(value);
    const animationRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousValue.current = value;
            setDisplayValue(value);
            return;
        }

        const startValue = previousValue.current;
        const endValue = value;

        if (endValue > startValue) setFlash("up");
        else if (endValue < startValue) setFlash("down");

        const flashTimer = setTimeout(() => setFlash(null), 300);

        const startTime = performance.now();
        const duration = 300;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = startValue + (endValue - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            clearTimeout(flashTimer);
        };
    }, [value]);

    const formattedValue = formatter
        ? formatter(displayValue)
        : displayValue.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
          });

    return (
        <span
            className={`
                tabular-nums transition-colors duration-300
                ${flash === "up" ? "bg-emerald-500/20" : ""}
                ${flash === "down" ? "bg-red-500/20" : ""}
                ${className}
            `}
        >
            {prefix}{formattedValue}
        </span>
    );
}

// 토스 스타일 digit slot roller
interface SlotNumberProps {
    value: number;
    className?: string;
}

function Digit({ char, prevChar }: { char: string; prevChar: string }) {
    const isNum = /\d/.test(char);
    const isPrevNum = /\d/.test(prevChar);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 마운트 후 transition 활성화
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    if (!isNum) {
        return <span>{char}</span>;
    }

    const n = parseInt(char);
    const pn = isPrevNum ? parseInt(prevChar) : n;

    return (
        <span className="inline-block overflow-hidden" style={{ height: "1.1em", verticalAlign: "bottom" }}>
            <span
                className="flex flex-col"
                style={{
                    transform: `translateY(${mounted ? `-${n * 1.1}em` : `-${pn * 1.1}em`})`,
                    transition: mounted && char !== prevChar ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                    willChange: "transform",
                }}
            >
                {[0,1,2,3,4,5,6,7,8,9].map((d) => (
                    <span key={d} className="block" style={{ height: "1.1em", lineHeight: "1.1em" }}>
                        {d}
                    </span>
                ))}
            </span>
        </span>
    );
}

export function SlotNumber({ value, className = "" }: SlotNumberProps) {
    const prevValueRef = useRef(value);
    const [prev, setPrev] = useState(String(value));
    const [curr, setCurr] = useState(String(value));

    useEffect(() => {
        if (value !== prevValueRef.current) {
            setPrev(String(prevValueRef.current));
            setCurr(String(value));
            prevValueRef.current = value;
        }
    }, [value]);

    // 자릿수 맞추기 (앞에 공백 패딩)
    const maxLen = Math.max(curr.length, prev.length);
    const paddedCurr = curr.padStart(maxLen, " ");
    const paddedPrev = prev.padStart(maxLen, " ");

    return (
        <span className={`inline-flex tabular-nums font-mono ${className}`}>
            {paddedCurr.split("").map((char, i) => (
                <Digit key={i} char={char} prevChar={paddedPrev[i] ?? char} />
            ))}
        </span>
    );
}
