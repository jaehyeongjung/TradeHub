"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = { value: number; title?: string; subLabel?: string };

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

/** 스프링(언더댐핑) */
function useSpring(
  target: number,
  {
    stiffness = 90,
    damping = 10,
    kick = 1,
    initFrom = -110, // 왼쪽 끝에서 출발
  }: { stiffness?: number; damping?: number; kick?: number; initFrom?: number } = {}
) {
  const [val, setVal] = useState(initFrom);
  const valRef = useRef(initFrom);   // ⭐ 최신 값을 ref로 보관
  const velRef = useRef(0);
  const raf = useRef<number | null>(null);
  const didInit = useRef(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!didInit.current) {
      didInit.current = true;
      valRef.current = initFrom;     // 초기값 세팅
      setVal(initFrom);
      velRef.current = kick;         // 살짝 튕겨 시작
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

      const x = valRef.current - target;                  // ⭐ 항상 최신값 사용
      const a = -stiffness * x - damping * velRef.current;
      velRef.current += a * dt;
      const next = valRef.current + velRef.current * dt;

      valRef.current = next;                              // ⭐ ref 갱신
      setVal(next);

      if (Math.abs(next - target) < 0.01 && Math.abs(velRef.current) < 0.01) {
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
      if (raf.current) cancelAnimationFrame(raf.current!);
      raf.current = null;
    };
  }, [target, stiffness, damping, kick, initFrom]);

  return val;
}


export default function FearGreedGauge({
    value,
    title = "Crypto Fear & Greed",
    subLabel,
}: Props) {
    const v = Math.max(0, Math.min(100, value));

    /** 각도 범위를 넓혀 체감 확대 (원하면 -100~+100, -90~+90로 조절) */
    const MIN = -110;
    const MAX = 110;
    const SPAN = MAX - MIN;

    const targetDeg = useMemo(() => MIN + (v / 100) * SPAN, [v]);

    // 최초엔 왼쪽 끝에서 출발 → 스프링으로 목표 각도
    const animatedDeg = useSpring(targetDeg, {
        stiffness: 90,
        damping: 10,
        kick: 1,
        initFrom: MIN,
    });

    // 진행도(채워지는 컬러 바)
    const progress = useMemo(
        () => clamp01((animatedDeg - MIN) / SPAN),
        [animatedDeg]
    );

    // SVG 레이아웃
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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-white">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold opacity-90">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/80 text-sm font-bold">
                        {v}
                    </span>
                    <span className="text-yellow-300 font-semibold">
                        {stateText}
                    </span>
                </div>
            </div>

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

                {/* 회색 트랙 */}
                <path
                    d={arcPath(cx, cy, r, 180, 0, 1)}
                    stroke="#0f172a"
                    strokeOpacity="0.6"
                    strokeWidth="18"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* 진행 채우기 */}
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
    );
}
