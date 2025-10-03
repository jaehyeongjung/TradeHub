"use client";
import { useMemo } from "react";

type Props = {
    /** 0 ~ 100 */
    value: number;
    title?: string; // 상단 라벨 (예: "Fear & Greed Index")
    subLabel?: string; // 우측 상태라벨 (예: "Greed")
};

/** 도(deg) -> 라디안 */
const toRad = (deg: number) => (deg * Math.PI) / 180;
/** 호(ARC) path 생성 */
function arcPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number
) {
    const s = {
        x: cx + r * Math.cos(toRad(startDeg)),
        y: cy + r * Math.sin(toRad(startDeg)),
    };
    const e = {
        x: cx + r * Math.cos(toRad(endDeg)),
        y: cy + r * Math.sin(toRad(endDeg)),
    };
    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export default function FearGreedGauge({
    value,
    title = "Fear & Greed",
    subLabel,
}: Props) {
    // 안전 범위 고정
    const v = Math.max(0, Math.min(100, value));

    // -90deg(0점) ~ +90deg(100점)로 매핑
    const needleDeg = useMemo(() => -90 + (v / 100) * 180, [v]);

    // 색 구간 (왼쪽 붉은색 → 오른쪽 초록색)
    const segments = [
        { start: -90, end: -60, color: "#ef4444" }, // red-500
        { start: -60, end: -30, color: "#f97316" }, // orange-500
        { start: -30, end: 0, color: "#f59e0b" }, // amber-500
        { start: 0, end: 30, color: "#a3e635" }, // lime-400
        { start: 30, end: 60, color: "#22c55e" }, // green-500
        { start: 60, end: 90, color: "#16a34a" }, // green-600
    ];

    // 라벨 (선택사항)
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

            {/* SVG 게이지 */}
            <div className="mx-auto max-w-[420px]">
                <svg viewBox="0 0 220 140" className="w-full">
                    {/* 반원 배경 그림자 */}
                    <path
                        d={arcPath(110, 120, 95, -90, 90)}
                        stroke="#0f172a"
                        strokeOpacity="0.6"
                        strokeWidth="16"
                        fill="none"
                    />
                    {/* 컬러 세그먼트 */}
                    {segments.map((s, i) => (
                        <path
                            key={i}
                            d={arcPath(110, 120, 95, s.start, s.end)}
                            stroke={s.color}
                            strokeWidth="16"
                            strokeLinecap="round"
                            fill="none"
                        />
                    ))}

                    {/* 눈금(선택) */}
                    {Array.from({ length: 11 }).map((_, i) => {
                        const deg = -90 + i * 18; // 0~100을 10등분
                        const r1 = 82,
                            r2 = 92;
                        const x1 = 110 + r1 * Math.cos(toRad(deg));
                        const y1 = 120 + r1 * Math.sin(toRad(deg));
                        const x2 = 110 + r2 * Math.cos(toRad(deg));
                        const y2 = 120 + r2 * Math.sin(toRad(deg));
                        return (
                            <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#374151"
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* 바늘 */}
                    <g transform={`rotate(${needleDeg} 110 120)`}>
                        <line
                            x1="110"
                            y1="120"
                            x2="110"
                            y2="30"
                            stroke="#d1d5db"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="110"
                            cy="120"
                            r="10"
                            fill="#d1d5db"
                            stroke="#111827"
                            strokeWidth="2"
                        />
                    </g>

                    {/* 하단 텍스트 */}
                    <text
                        x="110"
                        y="135"
                        textAnchor="middle"
                        fill="#9CA3AF"
                        fontSize="10"
                    >
                        0 (Fear) — 100 (Greed)
                    </text>
                </svg>
            </div>
        </div>
    );
}
