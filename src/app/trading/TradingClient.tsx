"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { activePageAtom } from "@/store/atoms";
import dynamic from "next/dynamic";
import ForceTabReturnReload from "@/components/ForceTabReturnReload";

const SimTradingPage = dynamic(
    () => import("@/components/SimTrading/SimTradingPage"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-sm text-neutral-500 animate-pulse">
                    모의투자 로딩 중...
                </div>
            </div>
        ),
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
            <div className="px-5 bg-black min-w-[310px] pb-8">
                <SimTradingPage />
            </div>
            <ForceTabReturnReload />
        </>
    );
}
