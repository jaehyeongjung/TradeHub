"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function MobileSuggestModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 모바일 판별: UA + 뷰포트 폭
    const ua = navigator.userAgent || "";
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isNarrow =
      window.matchMedia?.("(max-width: 767.98px)")?.matches ?? window.innerWidth < 768;

    if (isMobileUA || isNarrow) {
      setOpen(true);
    }
  }, []);

  const close = () => setOpen(false);

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
                <h2 className="text-lg font-bold">PC 접속을 권장합니다</h2>
                <p className="mt-2 text-sm text-neutral-300">
                  TradeHub는 현재 데스크톱 환경에 최적화되어 있어요.
                  <br />
                  모바일에서는 일부 기능/레이아웃이 제한될 수 있습니다.
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={close}
                    className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-600 text-neutral-200 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <div className="pb-[env(safe-area-inset-bottom)]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
