"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
    /** 다시 보지 않기 유지 기간(일) */
    coolDownDays?: number;
    /** localStorage key */
    storageKey?: string;
};

export default function MobileSuggestModal({
    coolDownDays = 3,
    storageKey = "th_mobile_blocker_dismissed_at",
}: Props) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // SSR 보호
        if (typeof window === "undefined") return;

        // 최근에 닫았는지
        const last = window.localStorage.getItem(storageKey);
        if (last) {
            const lastAt = Number(last);
            const ms = coolDownDays * 24 * 60 * 60 * 1000;
            if (!Number.isNaN(lastAt) && Date.now() - lastAt < ms) return;
        }

        // 모바일 판별: UA + 뷰포트 폭
        const ua = navigator.userAgent || "";
        const isMobileUA =
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isNarrow =
            window.matchMedia?.("(max-width: 767.98px)")?.matches ??
            window.innerWidth < 768;

        if (isMobileUA || isNarrow) setOpen(true);
    }, [coolDownDays, storageKey]);

    const close = () => {
        try {
            localStorage.setItem(storageKey, String(Date.now()));
        } catch {}
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Dim */}
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                    >
                        <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-2xl overflow-hidden">
                            <div className="p-5">
                                <h2 className="text-lg font-bold">
                                    PC 접속을 권장합니다
                                </h2>
                                <p className="mt-2 text-sm text-neutral-300">
                                    TradeHub는 현재 데스크톱 환경에 최적화되어
                                    있어요.
                                    <br />
                                    모바일에서는 일부 기능/레이아웃이 제한될 수
                                    있습니다.
                                </p>

                                <div className="mt-4 flex gap-2">
                                    <a
                                        href="https://www.tradehub.kr"
                                        className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 text-center transition"
                                    >
                                        알겠어요
                                    </a>
                                    <button
                                        onClick={close}
                                        className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-600 text-neutral-200"
                                    >
                                        오늘은 그만 보기
                                    </button>
                                </div>
                            </div>

                            {/* 안전영역 패딩(iOS 하단 홈바) */}
                            <div className="pb-[env(safe-area-inset-bottom)]" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
