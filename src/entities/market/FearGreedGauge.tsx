"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlotNumber } from "@/shared/ui/AnimatedNumber";

type Props = {
    value: number;
    title?: string;
    subLabel?: string;
    isLoading?: boolean;
    fadeDelay?: number;
};

export default function FearGreedGauge({
    value,
    title = "공포 & 탐욕 지수",
    subLabel,
    isLoading = false,
    fadeDelay = 0,
}: Props) {
    const v = Math.max(0, Math.min(100, value));
    const [isHovered, setIsHovered] = useState(false);
    const [isLight, setIsLight] = useState(false);
    const [slotValue, setSlotValue] = useState(0);

    useEffect(() => {
        if (!isLoading && v > 0) setSlotValue(v);
    }, [isLoading, v]);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const getStateInfo = (val: number) => {
        if (val < 25) return { text: "극도의 공포", color: "text-red-400", barColor: "bg-red-500", bgLight: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400" };
        if (val < 45) return { text: "공포", color: "text-orange-400", barColor: "bg-orange-500", bgLight: isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400" };
        if (val < 55) return { text: "중립", color: "text-yellow-400", barColor: "bg-yellow-500", bgLight: isLight ? "bg-yellow-50 text-yellow-600" : "bg-yellow-500/10 text-yellow-400" };
        if (val < 75) return { text: "탐욕", color: "text-lime-400", barColor: "bg-lime-500", bgLight: isLight ? "bg-lime-50 text-lime-600" : "bg-lime-500/10 text-lime-400" };
        return { text: "극도의 탐욕", color: "text-emerald-400", barColor: "bg-emerald-500", bgLight: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400" };
    };

    const state = getStateInfo(v);
    const displayLabel = subLabel ?? state.text;

    const cardClass = isLight
        ? "rounded-2xl border border-neutral-200 bg-white p-4 2xl:p-5"
        : "rounded-2xl border border-neutral-800 bg-neutral-900 p-4 2xl:p-5";

    const heroNumClass = isLight
        ? `text-4xl 2xl:text-5xl font-bold tabular-nums ${state.color}`
        : `text-4xl 2xl:text-5xl font-bold tabular-nums ${state.color}`;

    const subNumClass = isLight ? "text-neutral-400 text-sm" : "text-neutral-500 text-sm";
    const headerLabelClass = isLight ? "text-xs 2xl:text-sm text-neutral-500 font-medium" : "text-xs 2xl:text-sm text-neutral-400 font-medium";
    const trackClass = isLight ? "bg-neutral-200" : "bg-neutral-800";
    const edgeLabelClass = isLight ? "text-[10px] 2xl:text-xs text-neutral-400" : "text-[10px] 2xl:text-xs text-neutral-500";
    const tooltipClass = isLight
        ? "absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] w-[240px] text-[11px] bg-white border border-neutral-200 text-neutral-600 rounded-xl py-3 px-4 shadow-lg z-50 pointer-events-none"
        : "absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] w-[240px] text-[11px] bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl py-3 px-4 shadow-xl z-50 pointer-events-none";

    return (
        <div
            className={`relative ${cardClass}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`transition-[opacity,transform] duration-700 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
                style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className={headerLabelClass}>{title}</h3>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] 2xl:text-xs font-medium ${state.bgLight}`}>
                        {displayLabel}
                    </div>
                </div>

                {/* 메인 숫자 */}
                <div className="flex items-baseline gap-2 mb-4">
                    <span className={heroNumClass}>
                        <SlotNumber value={slotValue} />
                    </span>
                    <span className={subNumClass}>/100</span>
                </div>

                {/* 프로그레스 바 */}
                <div className="space-y-2">
                    <div className={`relative h-1.5 rounded-full overflow-hidden ${trackClass}`}>
                        {/* 그라데이션 전체 배경 (스펙트럼 맥락) */}
                        <div
                            className="absolute inset-0 opacity-25 rounded-full"
                            style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)" }}
                        />
                        {/* 진행 바 */}
                        <motion.div
                            className="absolute left-0 top-0 bottom-0 rounded-full"
                            style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${v}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                        {/* 인디케이터 dot */}
                        <motion.div
                            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-md ${isLight ? "bg-white border-2 border-neutral-300" : "bg-white border-2 border-neutral-900"}`}
                            initial={{ left: 0 }}
                            animate={{ left: `calc(${v}% - 5px)` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>

                    {/* 레이블 */}
                    <div className={`flex justify-between ${edgeLabelClass}`}>
                        <span>공포</span>
                        <span>탐욕</span>
                    </div>
                </div>
            </div>

            {/* 툴팁 */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className={tooltipClass}
                    >
                        <p className="leading-relaxed">
                            가격 변동성, 거래량, 소셜 트렌드 등을 종합해 시장 심리를 0~100으로 표현합니다.
                        </p>
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[6px] w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent ${isLight ? "border-b-neutral-200" : "border-b-neutral-700"}`} />
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[4px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-transparent ${isLight ? "border-b-white" : "border-b-neutral-900"}`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
