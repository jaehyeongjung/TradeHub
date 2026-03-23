"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// 네브 순서 기반 지그재그 방향
// 짝수(0,2,4) → 오른쪽 이동(x: -6%), 홀수(1,3) → 왼쪽 이동(x: +6%)
const PAGE_ORDER: Record<string, number> = {
    "/dashboard": 0,
    "/trading":   1,
    "/ranking":   2,
    "/funding":   3,
    "/altseason": 4,
};

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const order = PAGE_ORDER[pathname] ?? -1;

    if (order === -1) {
        return <>{children}</>;
    }

    const fromRight = order % 2 === 1; // 홀수 페이지는 오른쪽에서 진입

    return (
        <div className="overflow-hidden">
            <motion.div
                initial={{
                    opacity: 0,
                    x: fromRight ? "6%" : "-6%",
                    scale: 0.97,
                    filter: "blur(6px)",
                }}
                animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    filter: "blur(0px)",
                }}
                transition={{
                    duration: 0.28,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
