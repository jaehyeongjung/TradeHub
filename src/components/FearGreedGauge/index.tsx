"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = { value: number; title?: string; subLabel?: string; isLoading?: boolean; fadeDelay?: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function arcPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number,
    sweep = 1
) {
    const s = {
        x: cx + r * Math.cos(toRad(startDeg)),
        y: cy + r * Math.sin(toRad(startDeg)),
    };
    const e = {
        x: cx + r * Math.cos(toRad(endDeg)),
        y: cy + r * Math.sin(toRad(endDeg)),
    };
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${e.x} ${e.y}`;
}

/** 스프링(언더댐핑) 애니메이션 */
function useSpring(
    target: number,
    { stiffness = 90, damping = 10, kick = 1, initFrom = -110 } = {}
) {
    const [val, setVal] = useState(initFrom);
    const valRef = useRef(initFrom);
    const velRef = useRef(0);
    const raf = useRef<number | null>(null);
    const didInit = useRef(false);

    useEffect(() => {
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        if (!didInit.current) {
            didInit.current = true;
            valRef.current = initFrom;
            setVal(initFrom);
            velRef.current = kick;
        }

        if (reduce) {
            valRef.current = target;
            setVal(target);
            velRef.current = 0;
            return;
        }

        let prev = performance.now();

        const step = (now: number) => {
            const dt = Math.min((now - prev) / 1000, 1 / 30);
            prev = now;

            const x = valRef.current - target;
            const a = -stiffness * x - damping * velRef.current;
            velRef.current += a * dt;
            const next = valRef.current + velRef.current * dt;

            valRef.current = next;
            setVal(next);

            if (
                Math.abs(next - target) < 0.01 &&
                Math.abs(velRef.current) < 0.01
            ) {
                valRef.current = target;
                setVal(target);
                velRef.current = 0;
                raf.current = null;
                return;
            }
            raf.current = requestAnimationFrame(step);
        };

        raf.current = requestAnimationFrame(step);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = null;
        };
    }, [target, stiffness, damping, kick, initFrom]);

    return val;
}

export default function FearGreedGauge({
    value,
    title = "Crypto Fear & Greed",
    subLabel,
    isLoading = false,
    fadeDelay = 0,
}: Props) {
    const v = Math.max(0, Math.min(100, value));
    const [isHovered, setIsHovered] = useState(false);

    const MIN = -90;
    const MAX = 95;
    const SPAN = MAX - MIN;
    const targetDeg = useMemo(() => MIN + (v / 100) * SPAN, [v, MIN, SPAN]);
    const animatedDeg = useSpring(targetDeg, {
        stiffness: 90,
        damping: 10,
        kick: 1,
        initFrom: MIN,
    });
    const progress = useMemo(
        () => clamp01((animatedDeg - MIN) / SPAN),
        [animatedDeg, MIN, SPAN]
    );

    const cx = 120,
        cy = 120,
        r = 95;
    const trackLen = Math.PI * r;

    const stateText =
        subLabel ??
        (v < 25
            ? "Extreme Fear"
            : v < 45
            ? "Fear"
            : v < 55
            ? "Neutral"
            : v < 75
            ? "Greed"
            : "Extreme Greed");

    return (
        <div
            className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-4 2xl:p-8 text-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`transition-[opacity,transform] duration-700 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`} style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
            {/* 헤더 */}
            <div className="mb-2 2xl:mb-4 flex items-center justify-between">
                <h3 className="text-xs 2xl:text-base font-semibold opacity-90">
                    {title}
                </h3>
                <div className="flex items-center gap-2 2xl:gap-4">
                    <span className="inline-flex h-8 w-8 2xl:h-12 2xl:w-12 items-center justify-center rounded-full bg-yellow-500/80 text-xs 2xl:text-base font-bold ml-3">
                        {v}
                    </span>
                    <span className="text-yellow-300 font-semibold text-xs 2xl:text-base ml-4">
                        {stateText}
                    </span>
                </div>
            </div>

            {/* 게이지 */}
            <svg viewBox="0 0 240 150" className="w-full">
                <defs>
                    <linearGradient
                        id="gaugeGradient"
                        x1="0"
                        y1="0"
                        x2="240"
                        y2="0"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="35%" stopColor="#f59e0b" />
                        <stop offset="65%" stopColor="#84cc16" />
                        <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                </defs>

                {/* 트랙 */}
                <path
                    d={arcPath(cx, cy, r, 180, 0, 1)}
                    stroke="#1f2937"
                    strokeOpacity="0.6"
                    strokeWidth="18"
                    fill="none"
                    strokeLinecap="round"
                />
                {/* 진행 바 */}
                <path
                    d={arcPath(cx, cy, r, 180, 0, 1)}
                    stroke="url(#gaugeGradient)"
                    strokeWidth="18"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={trackLen}
                    strokeDashoffset={trackLen * (1 - progress)}
                />
                {/* 바늘 */}
                <g transform={`rotate(${animatedDeg} ${cx} ${cy})`}>
                    <line
                        x1={cx}
                        y1={cy}
                        x2={cx}
                        y2={cy - 85}
                        stroke="#e5e7eb"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        fill="#e5e7eb"
                        stroke="#111827"
                        strokeWidth="2"
                    />
                </g>
                <text
                    x="120"
                    y="145"
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="10"
                >
                    0 (Fear) — 100 (Greed)
                </text>
            </svg>
            </div>

            {/* 💬 커스텀 툴팁 */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[255px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-lg py-4 px-5 shadow-lg z-50 pointer-events-none"
                    >
                        <div className="font-semibold text-amber-300 mb-1">
                            지표 설명
                        </div>
                        <p className="leading-snug">
                            암호화폐 시장의 <b>투자 심리</b>를 수치로
                            표현합니다.
                            <br />
                            <br />• <b>가격 변동성</b> (Volatility)
                            <br />• <b>거래량 및 모멘텀</b> (Volume & Momentum)
                            <br />• <b>소셜 미디어 언급량</b> (Social Trends)
                            <br />• <b>비트코인 도미넌스</b> 및 트렌드 등을
                            <br />
                            종합해 0~100 사이의 값으로 계산합니다.
                            <br />
                            <br />
                            낮을수록 공포(Fear),<br></br> 높을수록 탐욕(Greed)을
                            의미합니다.
                        </p>
                        {/* 테두리가 있는 삼각형 화살표 */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent border-b-neutral-700" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent border-b-neutral-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
