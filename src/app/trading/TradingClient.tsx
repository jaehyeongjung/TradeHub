"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { activePageAtom } from "@/store/atoms";
import dynamic from "next/dynamic";
import ForceTabReturnReload from "@/components/ForceTabReturnReload";

function SimTradingSkeleton() {
    return (
        <div className="flex flex-col gap-3 w-full min-w-[1320px] mx-auto animate-pulse">
            {/* 헤더 바 */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-neutral-950 rounded-xl h-[52px]">
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex-shrink-0" />
                <div className="w-24 h-4 rounded-md bg-neutral-800" />
                <div className="w-32 h-5 rounded-md bg-neutral-800" />
                <div className="flex gap-6 flex-1 ml-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="w-12 h-2 rounded bg-neutral-800/80" />
                            <div className="w-16 h-3 rounded bg-neutral-800" />
                        </div>
                    ))}
                </div>
            </div>

            {/* 메인 영역 */}
            <div className="flex gap-3 h-[calc(100vh-200px)] min-h-[480px]">
                {/* 차트 */}
                <div className="flex-1 min-w-0 bg-neutral-950 rounded-xl" />

                {/* 호가창 */}
                <div className="w-[280px] flex-shrink-0 bg-neutral-950 rounded-xl flex flex-col p-3 gap-2">
                    <div className="w-20 h-3 rounded bg-neutral-800" />
                    <div className="flex justify-between mb-1">
                        {["w-12", "w-14", "w-10"].map((w, i) => (
                            <div key={i} className={`${w} h-2 rounded bg-neutral-800/60`} />
                        ))}
                    </div>
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={`a${i}`} className="flex justify-between">
                            <div className="w-16 h-2.5 rounded bg-red-900/30" />
                            <div className="w-12 h-2.5 rounded bg-neutral-800/50" />
                        </div>
                    ))}
                    <div className="h-8 rounded bg-neutral-800/60 my-1" />
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={`b${i}`} className="flex justify-between">
                            <div className="w-16 h-2.5 rounded bg-emerald-900/30" />
                            <div className="w-12 h-2.5 rounded bg-neutral-800/50" />
                        </div>
                    ))}
                </div>

                {/* 주문 패널 */}
                <div className="w-[300px] flex-shrink-0 bg-neutral-950 rounded-2xl flex flex-col p-5 gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                            <div className="w-24 h-2.5 rounded bg-neutral-800" />
                            <div className="w-40 h-8 rounded-lg bg-neutral-800" />
                            <div className="w-20 h-2 rounded bg-neutral-800/60" />
                        </div>
                        <div className="w-16 h-8 rounded-xl bg-neutral-800" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-10 rounded-xl bg-neutral-900" />
                        ))}
                    </div>
                    <div className="h-px bg-neutral-800" />
                    <div className="h-10 rounded-xl bg-neutral-900" />
                    <div className="h-10 rounded-2xl bg-neutral-900" />
                    <div className="h-20 rounded-2xl bg-neutral-900" />
                    <div className="h-10 rounded-xl bg-neutral-900" />
                    <div className="grid grid-cols-4 gap-1.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-8 rounded-xl bg-neutral-900" />
                        ))}
                    </div>
                    <div className="flex-1" />
                    <div className="h-14 rounded-2xl bg-emerald-900/40" />
                </div>
            </div>

            {/* 하단 탭 */}
            <div className="bg-neutral-950 rounded-2xl overflow-hidden">
                <div className="flex">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 py-3 flex items-center justify-center">
                            <div className="w-12 h-3 rounded bg-neutral-800" />
                        </div>
                    ))}
                </div>
                <div className="p-4 h-24" />
            </div>
        </div>
    );
}

const SimTradingPage = dynamic(
    () => import("@/components/SimTrading/SimTradingPage"),
    {
        ssr: false,
        loading: () => <SimTradingSkeleton />,
    }
);

export default function TradingClient() {
    const setActivePage = useSetAtom(activePageAtom);

    useEffect(() => {
        setActivePage("sim");
        return () => setActivePage("main");
    }, [setActivePage]);

    return (
        <>
            <div className="pt-12 pb-5 px-5 bg-black min-w-[310px]">
                <SimTradingPage />
            </div>
            <ForceTabReturnReload />
        </>
    );
}
