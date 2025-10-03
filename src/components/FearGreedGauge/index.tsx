"use client";
import { useMemo } from "react";

type Props = {
  value: number;        // 0 ~ 100
  title?: string;
  subLabel?: string;
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

// sweep(0|1)까지 지정 가능한 arc path
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  sweep = 0 // 0: CCW, 1: CW
) {
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  // 180도는 large-arc=1로 잡아 반원 보장
  const diff = Math.abs(endDeg - startDeg);
  const largeArc = diff < 180 ? 0 : 1;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
}

export default function FearGreedGauge({
  value,
  title = "Crypto Fear & Greed",
  subLabel,
}: Props) {
  const v = Math.max(0, Math.min(100, value));
  const stateText =
    subLabel ??
    (v < 25 ? "Extreme Fear" : v < 45 ? "Fear" : v < 55 ? "Neutral" : v < 75 ? "Greed" : "Extreme Greed");

  // 좌(180°) ~ 우(0°)로 매핑 → 위쪽 반원에서 바늘 회전
  const needleDeg = useMemo(() => 180 - (v / 100) * 180, [v]);

  // SVG 레이아웃
  const cx = 120;
  const cy = 120;   // 아래쪽(바닥선) 기준 중심
  const r  = 100;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-white">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold opacity-90">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/80 text-sm font-bold">
            {v}
          </span>
          <span className="text-yellow-300 font-semibold">{stateText}</span>
        </div>
      </div>

      {/* 위쪽 반원: 높이는 140이면 충분, 좌우 여유를 위해 width 조금 넉넉히 */}
      <div className="mx-auto max-w-[420px]">
        <svg viewBox="0 0 240 140" className="w-full">
          <defs>
            {/* 레드 → 오렌지 → 엠버 → 라임 → 그린 그라데이션 */}
            <linearGradient id="gaugeGradient" x1="20" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#ef4444" />
              <stop offset="25%"  stopColor="#f97316" />
              <stop offset="45%"  stopColor="#f59e0b" />
              <stop offset="70%"  stopColor="#a3e635" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>

          {/* 얇은 어둡 배경(게이지 트랙) */}
          <path
            d={arcPath(cx, cy, r, 180, 0, 1)}
            stroke="#0f172a"
            strokeOpacity="0.6"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />

          {/* 컬러 게이지(위쪽 반원) */}
          <path
            d={arcPath(cx, cy, r, 180, 0, 1)}
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />

          {/* 눈금 */}
          {Array.from({ length: 11 }).map((_, i) => {
            const deg = 180 - i * 18; // 0~100을 10등분
            const r1 = r - 18, r2 = r - 8;
            const x1 = cx + r1 * Math.cos(toRad(deg));
            const y1 = cy + r1 * Math.sin(toRad(deg));
            const x2 = cx + r2 * Math.cos(toRad(deg));
            const y2 = cy + r2 * Math.sin(toRad(deg));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="2" />;
          })}

          {/* 바늘 */}
          <g transform={`rotate(${needleDeg} ${cx} ${cy})`}>
            <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 25)} stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="10" fill="#d1d5db" stroke="#111827" strokeWidth="2" />
          </g>

          {/* 하단 텍스트 */}
          <text x={cx} y={138} textAnchor="middle" fill="#9CA3AF" fontSize="10">
            0 (Fear) — 100 (Greed)
          </text>
        </svg>
      </div>
    </div>
  );
}
