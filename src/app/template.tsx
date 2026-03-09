"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTrading = pathname === "/trading";
    const isDashboard = pathname === "/dashboard";

    if (!isTrading && !isDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="overflow-hidden">
            <motion.div
                initial={{
                    opacity: 0,
                    x: isTrading ? "6%" : "-6%",
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
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
