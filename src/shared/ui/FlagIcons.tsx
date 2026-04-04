export function FlagUS({ size = 24 }: { size?: number }) {
    const w = size;
    const h = Math.round(size * (2 / 3));
    const stripeH = h / 13;
    const cantonW = w * 0.4;
    const cantonH = stripeH * 7;

    // 50 stars: 9 rows alternating 6 and 5
    const stars: { cx: number; cy: number }[] = [];
    const rows = 9;
    for (let row = 0; row < rows; row++) {
        const count = row % 2 === 0 ? 6 : 5;
        const colSpacing = cantonW / 7;
        const rowSpacing = cantonH / 10;
        const offsetX = row % 2 === 0 ? colSpacing * 0.5 : colSpacing;
        for (let col = 0; col < count; col++) {
            stars.push({
                cx: offsetX + col * colSpacing,
                cy: rowSpacing * 0.6 + row * rowSpacing,
            });
        }
    }

    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            style={{ borderRadius: 3, display: "block", flexShrink: 0 }}
        >
            {/* Base red */}
            <rect width={w} height={h} fill="#B22234" />
            {/* White stripes (rows 1,3,5,7,9,11) */}
            {[1, 3, 5, 7, 9, 11].map((i) => (
                <rect
                    key={i}
                    x={0}
                    y={i * stripeH}
                    width={w}
                    height={stripeH}
                    fill="#FFFFFF"
                />
            ))}
            {/* Blue canton */}
            <rect x={0} y={0} width={cantonW} height={cantonH} fill="#3C3B6E" />
            {/* Stars */}
            {stars.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={w * 0.016} fill="#FFFFFF" />
            ))}
        </svg>
    );
}

export function FlagKR({ size = 24 }: { size?: number }) {
    const w = size;
    const h = Math.round(size * (2 / 3));

    return (
        <svg
            width={w}
            height={h}
            viewBox="0 0 30 20"
            style={{ borderRadius: 3, display: "block", flexShrink: 0 }}
        >
            <rect width="30" height="20" fill="#FFFFFF" />

            {/* ☰ Geon (건) — top-left, 3 solid lines, rotated -45° */}
            <g transform="translate(5.5,4) rotate(-45)">
                <rect x="-2.1" y="-1.35" width="4.2" height="0.6" fill="#000" />
                <rect x="-2.1" y="-0.3"  width="4.2" height="0.6" fill="#000" />
                <rect x="-2.1" y="0.75"  width="4.2" height="0.6" fill="#000" />
            </g>

            {/* ☵ Gam (감) — top-right, broken·solid·broken, rotated 45° */}
            <g transform="translate(24.5,4) rotate(45)">
                <rect x="-2.1" y="-1.35" width="1.7"  height="0.6" fill="#000" />
                <rect x="0.4"  y="-1.35" width="1.7"  height="0.6" fill="#000" />
                <rect x="-2.1" y="-0.3"  width="4.2"  height="0.6" fill="#000" />
                <rect x="-2.1" y="0.75"  width="1.7"  height="0.6" fill="#000" />
                <rect x="0.4"  y="0.75"  width="1.7"  height="0.6" fill="#000" />
            </g>

            {/* ☲ Li (리) — bottom-left, solid·broken·solid, rotated 45° */}
            <g transform="translate(5.5,16) rotate(45)">
                <rect x="-2.1" y="-1.35" width="4.2"  height="0.6" fill="#000" />
                <rect x="-2.1" y="-0.3"  width="1.7"  height="0.6" fill="#000" />
                <rect x="0.4"  y="-0.3"  width="1.7"  height="0.6" fill="#000" />
                <rect x="-2.1" y="0.75"  width="4.2"  height="0.6" fill="#000" />
            </g>

            {/* ☷ Gon (곤) — bottom-right, 3 broken lines, rotated -45° */}
            <g transform="translate(24.5,16) rotate(-45)">
                <rect x="-2.1" y="-1.35" width="1.7" height="0.6" fill="#000" />
                <rect x="0.4"  y="-1.35" width="1.7" height="0.6" fill="#000" />
                <rect x="-2.1" y="-0.3"  width="1.7" height="0.6" fill="#000" />
                <rect x="0.4"  y="-0.3"  width="1.7" height="0.6" fill="#000" />
                <rect x="-2.1" y="0.75"  width="1.7" height="0.6" fill="#000" />
                <rect x="0.4"  y="0.75"  width="1.7" height="0.6" fill="#000" />
            </g>

            {/* 태극 — yin-yang, rotated -45° */}
            <g transform="rotate(-45, 15, 10)">
                {/* blue base circle */}
                <circle cx="15" cy="10" r="5" fill="#0047A0" />
                {/* red left half */}
                <path d="M15 5 A5 5 0 0 0 15 15 Z" fill="#CD2E3A" />
                {/* red small top circle (yang dot) */}
                <circle cx="15" cy="7.5" r="2.5" fill="#CD2E3A" />
                {/* blue small bottom circle (eum dot) */}
                <circle cx="15" cy="12.5" r="2.5" fill="#0047A0" />
            </g>
        </svg>
    );
}
