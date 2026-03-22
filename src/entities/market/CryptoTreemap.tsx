"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Ticker = {
    symbol: string;
    priceChangePercent: string;
    quoteVolume: string;
    lastPrice: string;
};

type TreemapItem = {
    symbol: string;
    name: string;
    pct: number;
    volume: number;
    price: number;
};

const EXCLUDE_PATTERNS = /(UP|DOWN|BULL|BEAR|1000)/;

function isValidSymbol(sym: string) {
    return (
        sym.endsWith("USDT") &&
        !EXCLUDE_PATTERNS.test(sym) &&
        sym !== "USDCUSDT" &&
        sym !== "FDUSDUSDT"
    );
}

// Treemap 레이아웃 계산 (Squarified)
function squarify(
    items: TreemapItem[],
    x: number,
    y: number,
    width: number,
    height: number
): { item: TreemapItem; x: number; y: number; w: number; h: number }[] {
    if (items.length === 0) return [];

    const totalVolume = items.reduce((sum, item) => sum + item.volume, 0);
    if (totalVolume === 0) return [];

    const result: { item: TreemapItem; x: number; y: number; w: number; h: number }[] = [];

    let remaining = [...items];
    let currentX = x;
    let currentY = y;
    let currentWidth = width;
    let currentHeight = height;

    while (remaining.length > 0) {
        const isHorizontal = currentWidth >= currentHeight;
        const side = isHorizontal ? currentHeight : currentWidth;

        const row: TreemapItem[] = [];
        let rowVolume = 0;
        const remainingVolume = remaining.reduce((sum, item) => sum + item.volume, 0);

        for (const item of remaining) {
            const testRow = [...row, item];
            const testVolume = rowVolume + item.volume;

            if (row.length === 0) {
                row.push(item);
                rowVolume = item.volume;
            } else {
                const currentWorst = worstRatio(row, rowVolume, side, remainingVolume, isHorizontal ? currentWidth : currentHeight);
                const testWorst = worstRatio(testRow, testVolume, side, remainingVolume, isHorizontal ? currentWidth : currentHeight);

                if (testWorst <= currentWorst) {
                    row.push(item);
                    rowVolume = testVolume;
                } else {
                    break;
                }
            }
        }

        const rowRatio = rowVolume / remainingVolume;
        const rowSize = rowRatio * (isHorizontal ? currentWidth : currentHeight);

        let offset = 0;
        for (const item of row) {
            const itemRatio = item.volume / rowVolume;
            const itemSize = itemRatio * side;

            if (isHorizontal) {
                result.push({ item, x: currentX, y: currentY + offset, w: rowSize, h: itemSize });
            } else {
                result.push({ item, x: currentX + offset, y: currentY, w: itemSize, h: rowSize });
            }
            offset += itemSize;
        }

        if (isHorizontal) {
            currentX += rowSize;
            currentWidth -= rowSize;
        } else {
            currentY += rowSize;
            currentHeight -= rowSize;
        }

        remaining = remaining.slice(row.length);
    }

    return result;
}

function worstRatio(
    row: TreemapItem[],
    rowVolume: number,
    side: number,
    totalVolume: number,
    fullSize: number
): number {
    const rowSize = (rowVolume / totalVolume) * fullSize;
    let worst = 0;
    for (const item of row) {
        const itemRatio = item.volume / rowVolume;
        const itemSize = itemRatio * side;
        const aspect = Math.max(rowSize / itemSize, itemSize / rowSize);
        worst = Math.max(worst, aspect);
    }
    return worst;
}

function getColor(pct: number): string {
    if (pct >= 5) return "rgb(22, 163, 74)";
    if (pct >= 2) return "rgb(34, 197, 94)";
    if (pct >= 0.5) return "rgb(74, 222, 128)";
    if (pct > 0) return "rgb(134, 239, 172)";
    if (pct === 0) return "rgb(115, 115, 115)";
    if (pct > -0.5) return "rgb(252, 165, 165)";
    if (pct > -2) return "rgb(248, 113, 113)";
    if (pct > -5) return "rgb(239, 68, 68)";
    return "rgb(220, 38, 38)";
}

// 스켈레톤 블록 레이아웃 (화면 비율 기반)
const SKELETON_BLOCKS = [
    { x: 0,    y: 0,    w: 35,  h: 55 },
    { x: 35,   y: 0,    w: 22,  h: 55 },
    { x: 57,   y: 0,    w: 25,  h: 30 },
    { x: 82,   y: 0,    w: 18,  h: 30 },
    { x: 57,   y: 30,   w: 14,  h: 25 },
    { x: 71,   y: 30,   w: 14,  h: 25 },
    { x: 85,   y: 30,   w: 15,  h: 25 },
    { x: 0,    y: 55,   w: 20,  h: 45 },
    { x: 20,   y: 55,   w: 18,  h: 25 },
    { x: 38,   y: 55,   w: 16,  h: 25 },
    { x: 54,   y: 55,   w: 14,  h: 25 },
    { x: 68,   y: 55,   w: 16,  h: 25 },
    { x: 84,   y: 55,   w: 16,  h: 25 },
    { x: 20,   y: 80,   w: 14,  h: 20 },
    { x: 34,   y: 80,   w: 20,  h: 20 },
    { x: 54,   y: 80,   w: 14,  h: 20 },
    { x: 68,   y: 80,   w: 32,  h: 20 },
];

export default function CryptoTreemap({ onClose }: { onClose: () => void }) {
    const [data, setData] = useState<TreemapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const HEADER_H = 48;
        const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight - HEADER_H });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
                if (!res.ok) return;
                const tickers = (await res.json()) as Ticker[];
                const items: TreemapItem[] = tickers
                    .filter((t) => isValidSymbol(t.symbol))
                    .map((t) => ({
                        symbol: t.symbol,
                        name: t.symbol.replace(/USDT$/, ""),
                        pct: parseFloat(t.priceChangePercent),
                        volume: parseFloat(t.quoteVolume),
                        price: parseFloat(t.lastPrice),
                    }))
                    .filter((t) => t.volume > 500000)
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 150)
                    .map((t) => ({ ...t, volume: Math.pow(t.volume, 0.5) }));
                setData(items);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const layout = useMemo(() => {
        if (dimensions.width === 0 || data.length === 0) return [];
        return squarify(data, 0, 0, dimensions.width, dimensions.height);
    }, [data, dimensions]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[100] overflow-hidden transition-colors duration-500 ${isLight ? "bg-neutral-100" : "bg-neutral-950"}`}
        >
            {/* Top Header Bar */}
            <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 h-12 backdrop-blur-md border-b transition-colors duration-500 ${
                isLight ? "bg-white/80 border-neutral-200/60" : "bg-neutral-950/80 border-neutral-800/60"
            }`}>
                {/* 왼쪽: 아이콘 + 제목 + 설명 */}
                <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" className={isLight ? "text-neutral-500" : "text-neutral-400"}>
                        <path fill="currentColor" d="M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z"/>
                    </svg>
                    <span className={`text-sm font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>코인 트리맵</span>
                    <div className={`w-px h-3.5 ${isLight ? "bg-neutral-300" : "bg-neutral-700"}`} />
                    <span className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>24h 거래대금 기준</span>
                </div>

                {/* 오른쪽: ESC 힌트 + 닫기 버튼 */}
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border select-none ${
                        isLight ? "text-neutral-600 border-neutral-400 bg-neutral-100" : "text-neutral-300 border-neutral-600 bg-neutral-800"
                    }`}>ESC</span>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer active:scale-95 ${
                            isLight
                                ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                        }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 top-12">
                <AnimatePresence mode="wait">
                    {loading ? (
                        /* ── 스켈레톤 ── */
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            className="absolute inset-0"
                        >
                            <style>{`
                                @keyframes treemap-shimmer {
                                    0%   { background-position: -200% 0; }
                                    100% { background-position: 200% 0; }
                                }
                            `}</style>
                            {SKELETON_BLOCKS.map((b, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute rounded-lg overflow-hidden"
                                    style={{
                                        left: `${b.x}%`,
                                        top: `${b.y}%`,
                                        width: `calc(${b.w}% - 4px)`,
                                        height: `calc(${b.h}% - 4px)`,
                                    }}
                                >
                                    {/* 다크 shimmer */}
                                    <div className="absolute inset-0 transition-opacity duration-500"
                                        style={{
                                            opacity: isLight ? 0 : 1,
                                            backgroundImage: "linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%)",
                                            backgroundSize: "200% 100%",
                                            animation: `treemap-shimmer 1.8s ease-in-out ${i * 0.06}s infinite`,
                                        }}
                                    />
                                    {/* 라이트 shimmer */}
                                    <div className="absolute inset-0 transition-opacity duration-500"
                                        style={{
                                            opacity: isLight ? 1 : 0,
                                            backgroundImage: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
                                            backgroundSize: "200% 100%",
                                            animation: `treemap-shimmer 1.8s ease-in-out ${i * 0.06}s infinite`,
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* ── 실제 트리맵 ── */
                        <motion.div
                            key="treemap"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <svg width={dimensions.width} height={dimensions.height}>
                                {layout.map(({ item, x, y, w, h }, index) => {
                                    const padding = 8;
                                    const innerW = w - padding * 2;
                                    const innerH = h - padding * 2;
                                    const nameLen = item.name.length;
                                    const fontByWidth = innerW / (nameLen * 0.65);
                                    const fontByHeight = innerH / 3.5;
                                    const fontByArea = Math.sqrt(innerW * innerH) / 4;
                                    const fontSize = Math.min(fontByWidth, fontByHeight, fontByArea);
                                    const showName = w > 30 && h > 20 && fontSize >= 6;
                                    const showPct = w > 40 && h > 35 && fontSize >= 8;
                                    const showPrice = w > 50 && h > 50 && fontSize >= 10;
                                    const formatPrice = (p: number) => {
                                        if (p < 0.0001) return p.toPrecision(2);
                                        if (p < 0.01) return p.toPrecision(3);
                                        if (p < 1) return p.toFixed(4);
                                        if (p < 1000) return p.toFixed(2);
                                        return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
                                    };
                                    const lineCount = 1 + (showPct ? 1 : 0) + (showPrice ? 1 : 0);
                                    const lineHeight = Math.min(fontSize * 1.3, innerH / (lineCount + 0.5));
                                    const totalTextH = lineHeight * lineCount;
                                    const startY = y + h / 2 - totalTextH / 2 + lineHeight / 2;
                                    const nameFontSize = Math.max(6, Math.min(fontSize, 48));
                                    const pctFontSize = Math.max(6, Math.min(fontSize * 0.7, 32));
                                    const priceFontSize = Math.max(5, Math.min(fontSize * 0.55, 24));

                                    // 스태거: 오른쪽 아래일수록 먼저, 왼쪽 위일수록 나중
                                    const cx = (x + w / 2) / dimensions.width;
                                    const cy = (y + h / 2) / dimensions.height;
                                    const staggerDelay = ((1 - cx) + (1 - cy)) / 2 * 0.6;

                                    return (
                                        <motion.g
                                            key={item.symbol}
                                            initial={{ opacity: 0, scale: 0.9, x: 14, y: 12 }}
                                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                            transition={{
                                                delay: staggerDelay,
                                                duration: 0.45,
                                                ease: [0.16, 1, 0.3, 1],
                                            }}
                                            style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}
                                        >
                                            <rect
                                                x={x + 1} y={y + 1}
                                                width={Math.max(0, w - 2)}
                                                height={Math.max(0, h - 2)}
                                                fill={getColor(item.pct)}
                                                rx={4}
                                                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                                            />
                                            {showName && (
                                                <>
                                                    <text x={x + w / 2} y={startY} textAnchor="middle" dominantBaseline="middle"
                                                        fill="white" fontSize={nameFontSize} fontWeight="bold" className="pointer-events-none">
                                                        {item.name}
                                                    </text>
                                                    {showPct && (
                                                        <text x={x + w / 2} y={startY + lineHeight} textAnchor="middle" dominantBaseline="middle"
                                                            fill="white" fontSize={pctFontSize} className="pointer-events-none opacity-90">
                                                            {item.pct >= 0 ? "+" : ""}{item.pct.toFixed(2)}%
                                                        </text>
                                                    )}
                                                    {showPrice && (
                                                        <text x={x + w / 2} y={startY + lineHeight * 2} textAnchor="middle" dominantBaseline="middle"
                                                            fill="white" fontSize={priceFontSize} className="pointer-events-none opacity-80">
                                                            ${formatPrice(item.price)}
                                                        </text>
                                                    )}
                                                </>
                                            )}
                                        </motion.g>
                                    );
                                })}
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
